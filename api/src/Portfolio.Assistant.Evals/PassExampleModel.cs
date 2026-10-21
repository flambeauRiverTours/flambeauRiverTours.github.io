using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals
{
    /// <summary>Answers with each case's passExample, for <c>--self-test</c>.</summary>
    /// <remarks>Checks the whole pipeline without calling Azure.</remarks>
    internal sealed class PassExampleModel(IReadOnlyList<EvalCase> cases) : IAnswerModel
    {
        private readonly Dictionary<string, EvalCase> casesByConversation = ByConversation(cases);

        /// <inheritdoc />
        public string Deployment => "self-test";

        /// <inheritdoc />
        public Task<ModelAnswer> AnswerAsync(Prompt prompt, CancellationToken cancellationToken)
        {
            var text = casesByConversation.TryGetValue(Key(prompt.Messages.Select(message => message.Content)), out var evalCase)
                ? $"{evalCase.PassExample}\nLinks: {Links(evalCase)}"
                : "There's no example answer for this case.\nLinks: none";
            return Task.FromResult(new ModelAnswer(text, 0, 0));
        }

        // keyed on the whole conversation, since some cases share a question but not a history
        private static Dictionary<string, EvalCase> ByConversation(IReadOnlyList<EvalCase> cases)
        {
            var byConversation = new Dictionary<string, EvalCase>();
            foreach (var evalCase in cases.Where(evalCase => evalCase.PassExample is not null))
            {
                var key = Key(evalCase.HistoryMessages.Select(message => message.Content).Append(evalCase.Question));
                if (!byConversation.TryAdd(key, evalCase))
                {
                    throw new ArgumentException($"Cases {byConversation[key].Id} and {evalCase.Id} have the same conversation, so self-test can't tell them apart.", nameof(cases));
                }
            }

            return byConversation;
        }

        private static string Key(IEnumerable<string> contents) => string.Join("\n", contents);

        private static string Links(EvalCase evalCase) =>
            evalCase.Expect == Expectation.Refuse || evalCase.ExpectedLinks is not { Count: > 0 } ? "none" : string.Join(", ", evalCase.ExpectedLinks);
    }
}
