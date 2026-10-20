using System.Globalization;
using System.Net;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals
{
    /// <summary>Asks each case several times and grades every answer.</summary>
    /// <param name="progress">Gets a line every <see cref="ProgressInterval"/> finished calls and at the end; nothing by default.</param>
    /// <param name="callTimeout">How long one call may take, the SDK's retries included, before its run fails; <see cref="DefaultCallTimeout"/> by default.</param>
    internal sealed class EvalRunner(IAnswerModel model, KnowledgeBase knowledge, Grader grader, TextWriter? progress = null, TimeSpan? callTimeout = null)
    {
        /// <summary>How many finished calls there are between progress lines.</summary>
        public const int ProgressInterval = 50;

        /// <summary>Longer than the SDK's own retries under throttling, so only a stuck call reaches it.</summary>
        public static readonly TimeSpan DefaultCallTimeout = TimeSpan.FromMinutes(6);

        private readonly TextWriter progressWriter = progress ?? TextWriter.Null;
        private readonly TimeSpan timeout = callTimeout ?? DefaultCallTimeout;

        /// <summary>Runs the cases a few calls at a time; results keep the cases' order.</summary>
        /// <param name="runs">How many times to ask each question; a case must pass every time.</param>
        /// <param name="parallelism">How many calls to make at once; the deployment's rate limit is small.</param>
        public async Task<IReadOnlyList<CaseResult>> RunAsync(IReadOnlyList<EvalCase> cases, int runs, int parallelism, CancellationToken cancellationToken)
        {
            using var gate = new SemaphoreSlim(parallelism);
            var tally = new Tally(cases.Count * runs, progressWriter);
            return await Task.WhenAll(cases.Select(evalCase => RunCaseAsync(evalCase, runs, gate, tally, cancellationToken)));
        }

        private async Task<CaseResult> RunCaseAsync(EvalCase evalCase, int runs, SemaphoreSlim gate, Tally tally, CancellationToken cancellationToken)
        {
            var attempts = Enumerable.Range(0, runs).Select(_ => RunOnceAsync(evalCase, gate, tally, cancellationToken));
            return new CaseResult(evalCase, await Task.WhenAll(attempts));
        }

        private async Task<RunResult> RunOnceAsync(EvalCase evalCase, SemaphoreSlim gate, Tally tally, CancellationToken cancellationToken)
        {
            var result = await AskAsync(evalCase, gate, cancellationToken);
            tally.Record(result.Grade.Passed);
            return result;
        }

        private async Task<RunResult> AskAsync(EvalCase evalCase, SemaphoreSlim gate, CancellationToken cancellationToken)
        {
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
            return new RunResult(answer.Text, grader.Grade(evalCase, answer.Text), answer.InputTokens, answer.OutputTokens, answer.Filtered);
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
