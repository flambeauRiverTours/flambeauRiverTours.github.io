using System.Net;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals
{
    /// <summary>Asks each case several times and grades every answer.</summary>
    internal sealed class EvalRunner(IAnswerModel model, KnowledgeBase knowledge, Grader grader)
    {
        /// <summary>Runs the cases a few calls at a time; results keep the cases' order.</summary>
        /// <param name="runs">How many times to ask each question; a case must pass every time.</param>
        /// <param name="parallelism">How many calls to make at once; the deployment's rate limit is small.</param>
        public async Task<IReadOnlyList<CaseResult>> RunAsync(IReadOnlyList<EvalCase> cases, int runs, int parallelism, CancellationToken cancellationToken)
        {
            using var gate = new SemaphoreSlim(parallelism);
            return await Task.WhenAll(cases.Select(evalCase => RunCaseAsync(evalCase, runs, gate, cancellationToken)));
        }

        private async Task<CaseResult> RunCaseAsync(EvalCase evalCase, int runs, SemaphoreSlim gate, CancellationToken cancellationToken)
        {
            var attempts = Enumerable.Range(0, runs).Select(_ => RunOnceAsync(evalCase, gate, cancellationToken));
            return new CaseResult(evalCase, await Task.WhenAll(attempts));
        }

        private async Task<RunResult> RunOnceAsync(EvalCase evalCase, SemaphoreSlim gate, CancellationToken cancellationToken)
        {
            await gate.WaitAsync(cancellationToken);
            ModelAnswer answer;
            try
            {
                answer = await model.AnswerAsync(PromptBuilder.Build(knowledge, evalCase.HistoryMessages, evalCase.Question), cancellationToken);
            }
            catch (Exception error) when (IsTransient(error))
            {
                return new RunResult(error.Message, new RunGrade([$"model error: {error.Message}"], LinkScore.None), 0, 0);
            }
            finally
            {
                gate.Release();
            }

            // graded outside the try, so a grader bug stops the eval instead of looking like a model error
            return new RunResult(answer.Text, grader.Grade(evalCase, answer.Text), answer.InputTokens, answer.OutputTokens);
        }

        // only a failure that a retry could fix fails just one run; auth, configuration and bugs stop the eval
        private static bool IsTransient(Exception error) => error switch
        {
            TimeoutException => true,
            HttpRequestException { StatusCode: null } => true,
            HttpRequestException { StatusCode: HttpStatusCode.RequestTimeout or HttpStatusCode.TooManyRequests } => true,
            HttpRequestException { StatusCode: { } status } => (int)status >= 500,
            _ => false,
        };
    }
}
