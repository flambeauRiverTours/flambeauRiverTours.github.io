using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals
{
    /// <summary>One line of <c>api/evals/questions.jsonl</c>; see its README.</summary>
    internal sealed record EvalCase(
        string Id,
        Category Category,
        string Question,
        Expectation Expect,
        IReadOnlyList<HistoryMessage>? History = null,
        IReadOnlyList<string>? MustMatch = null,
        IReadOnlyList<string>? MustNotMatch = null,
        IReadOnlyList<string>? ExpectedLinks = null,
        string? Note = null,
        string? PassExample = null)
    {
        /// <summary>The earlier turns as chat messages.</summary>
        public IReadOnlyList<ChatMessage> HistoryMessages =>
            [.. (History ?? []).Select(message => new ChatMessage(message.Role == "assistant" ? ChatRole.Assistant : ChatRole.User, message.Content))];

        /// <summary>Everything the visitor wrote, for the echo exemptions.</summary>
        public string VisitorText => string.Join("\n", (History ?? []).Select(message => message.Content).Append(Question));
    }
}
