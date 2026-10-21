using System.Globalization;
using System.Net;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals
{
    /// <summary>Asks each case several times and grades every answer.</summary>
    /// <param name="progress">Gets a line every <see cref="ProgressInterval"/> finished calls and at the end; nothing by default.</param>
    /// <param name="callTimeout">How long one call may take, the SDK's retries included, before its run fails; <see cref="DefaultCallTimeout"/> by default.</param>
    /// <param name="judge">Checks each answer's claims against the knowledge; an unsupported claim fails the run. None by default.</param>
    internal sealed class EvalRunner(IAnswerModel model, KnowledgeBase knowledge, Grader grader, TextWriter? progress = null, TimeSpan? callTimeout = null, IGroundingJudge? judge = null)
    {
        /// <summary>How many finished calls there are between progress lines.</summary>
        public const int ProgressInterval = 50;

        /// <summary>Longer than the SDK's own retries under throttling, so only a stuck call reaches it.</summary>
        public static readonly TimeSpan DefaultCallTimeout = TimeSpan.FromMinutes(6);

        private readonly TextWriter progressWriter = progress ?? TextWriter.Null;
        private readonly TimeSpan timeout = callTimeout ?? DefaultCallTimeout;

        /// <summary>Runs the cases a few calls at a time; results keep the cases' order.</summary>
        /// <param name="runs">How many times to ask each question; a case must pass every time.</param>
        /// <param name="parallelism">How many model calls to make at once, and how many judge calls; each deployment's rate limit is small.</param>
        public async Task<IReadOnlyList<CaseResult>> RunAsync(IReadOnlyList<EvalCase> cases, int runs, int parallelism, CancellationToken cancellationToken)
        {
            // the judge has its own limit: its deployment has its own rate limit, and it is slower than the model
            using var modelGate = new SemaphoreSlim(parallelism);
            using var judgeGate = new SemaphoreSlim(parallelism);
            var gates = new Gates(modelGate, judgeGate);
            var tally = new Tally(cases.Count * runs, progressWriter);
            return await Task.WhenAll(cases.Select(evalCase => RunCaseAsync(evalCase, runs, gates, tally, cancellationToken)));
        }

        private async Task<CaseResult> RunCaseAsync(EvalCase evalCase, int runs, Gates gates, Tally tally, CancellationToken cancellationToken)
        {
            var attempts = Enumerable.Range(0, runs).Select(_ => RunOnceAsync(evalCase, gates, tally, cancellationToken));
            return new CaseResult(evalCase, await Task.WhenAll(attempts));
        }

        private async Task<RunResult> RunOnceAsync(EvalCase evalCase, Gates gates, Tally tally, CancellationToken cancellationToken)
        {
            var result = await AskAsync(evalCase, gates, cancellationToken);
            tally.Record(result.Grade.Passed);
            return result;
        }

        private async Task<RunResult> AskAsync(EvalCase evalCase, Gates gates, CancellationToken cancellationToken)
        {
            var gate = gates.Model;
            await gate.WaitAsync(cancellationToken);
            // the deadline starts once the call has its slot, so time spent queueing doesn't count against it
            using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            deadline.CancelAfter(timeout);
            ModelAnswer answer;
            try
            {
                // WaitAsync gives up at the deadline even if the call ignores its token, as calls on connections left dead by sleep did
                answer = await model.AnswerAsync(PromptBuilder.Build(knowledge, evalCase.HistoryMessages, evalCase.Question), deadline.Token).WaitAsync(deadline.Token);
            }
            catch (Exception error) when (IsTransient(error))
            {
                return Failed(error.Message);
            }
            catch (OperationCanceledException) when (deadline.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
            {
                return Failed(string.Create(CultureInfo.InvariantCulture, $"timed out after {timeout.TotalSeconds:0.###} s"));
            }
            finally
            {
                gate.Release();
            }

            // graded outside the try, so a grader bug stops the eval instead of looking like a model error
            var grade = grader.Grade(evalCase, answer.Text);
            var grounding = answer.Filtered ? null : await JudgeAsync(evalCase, answer.Text, gates.Judge, cancellationToken);
            var unsupported = (grounding?.Unsupported ?? []).Select(claim => $"unsupported claim: {claim}");
            return new RunResult(answer.Text, grade with { Failures = [.. grade.Failures, .. unsupported] }, answer.InputTokens, answer.OutputTokens, answer.Filtered)
            {
                CacheReadTokens = answer.CacheReadTokens,
                CacheWriteTokens = answer.CacheWriteTokens,
                Grounding = grounding,
            };
        }

        // the judge sees the answer as the visitor would, without its Links line; a judge that is throttled or times out
        // says nothing about the answer, so the run is left unjudged rather than failed
        private async Task<GroundingVerdict?> JudgeAsync(EvalCase evalCase, string raw, SemaphoreSlim gate, CancellationToken cancellationToken)
        {
            if (judge is null)
            {
                return null;
            }

            var shown = LinkExtractor.Extract(raw, knowledge.Links).Text;
            await gate.WaitAsync(cancellationToken);
            using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            deadline.CancelAfter(timeout);
            try
            {
                return await judge.JudgeAsync(evalCase.Question, shown, deadline.Token).WaitAsync(deadline.Token);
            }
            catch (Exception error) when (IsTransient(error) || (error is OperationCanceledException && !cancellationToken.IsCancellationRequested))
            {
                var detail = error is HttpRequestException { StatusCode: { } status } ? ((int)status).ToString(CultureInfo.InvariantCulture) : error.GetType().Name;
                return new GroundingVerdict(Unsupported: null, 0, 0) { NoVerdictReason = $"the judge's call failed ({detail})" };
            }
            finally
            {
                gate.Release();
            }
        }

        private static RunResult Failed(string message) => new(message, new RunGrade([$"model error: {message}"], LinkScore.None), 0, 0);

        // only a failure that a retry could fix fails just one run; auth, configuration and bugs stop the eval
        private static bool IsTransient(Exception error) => error switch
        {
            TimeoutException => true,
            HttpRequestException { StatusCode: null } => true,
            HttpRequestException { StatusCode: HttpStatusCode.RequestTimeout or HttpStatusCode.TooManyRequests } => true,
            HttpRequestException { StatusCode: { } status } => (int)status >= 500,
            _ => false,
        };

        /// <summary>One limit for model calls and one for judge calls, shared by every run.</summary>
        private sealed record Gates(SemaphoreSlim Model, SemaphoreSlim Judge);

        /// <summary>Counts finished calls across the parallel runs, so a long run shows it is still moving.</summary>
        private sealed class Tally(int total, TextWriter writer)
        {
            private readonly Lock gate = new();
            private int done;
            private int failed;

            public void Record(bool passed)
            {
                // one lock keeps the counts and the lines in step when calls finish together
                lock (gate)
                {
                    done++;
                    failed += passed ? 0 : 1;
                    if (done % ProgressInterval == 0 || done == total)
                    {
                        writer.WriteLine(string.Create(CultureInfo.InvariantCulture, $"{done} / {total} calls done ({failed} failed)"));
                    }
                }
            }
        }
    }
}
