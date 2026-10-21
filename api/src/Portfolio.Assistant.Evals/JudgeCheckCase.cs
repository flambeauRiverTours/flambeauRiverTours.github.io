using System.Text.Json;

namespace Portfolio.Assistant.Evals
{
    /// <summary>One hand-labelled answer in <c>api/evals/judge-checks.jsonl</c>, for checking the grounding judge itself.</summary>
    /// <param name="Unsupported">Whether the answer makes a claim the knowledge doesn't support, so the judge should flag it.</param>
    /// <param name="Note">Why the label is what it is.</param>
    internal sealed record JudgeCheckCase(string Id, string Question, string Answer, bool Unsupported, string Note)
    {
        /// <summary>Reads one case per non-blank line.</summary>
        public static IReadOnlyList<JudgeCheckCase> Parse(string jsonl) =>
            [.. jsonl.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(line => JsonSerializer.Deserialize<JudgeCheckCase>(line, JsonSerializerOptions.Web) ?? throw new JsonException($"Not a case: {line}"))];
    }
}
