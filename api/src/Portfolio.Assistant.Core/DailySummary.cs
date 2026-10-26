namespace Portfolio.Assistant.Core
{
    /// <summary>One UTC day's numbers from the question log, with no visitor text.</summary>
    /// <param name="Unreadable">Log lines that aren't whole entries.</param>
    /// <param name="EstimatedCost">Dollars, at <see cref="ModelPrice.ClaudeHaiku55"/>.</param>
    /// <param name="NeedsALook">Entries not <c>ok</c>, in log order.</param>
    public sealed record DailySummary(
        DateOnly Day,
        int Questions,
        int Unreadable,
        IReadOnlyList<DailySummary.OutcomeCount> Outcomes,
        int MidConversation,
        TokenUsage Tokens,
        decimal EstimatedCost,
        long MedianLatencyMs,
        IReadOnlyList<DailySummary.Request> Slowest,
        IReadOnlyList<DailySummary.Request> NeedsALook,
        IReadOnlyList<string> PromptVersions)
    {
        private const int SlowestShown = 3;

        /// <summary>How many entries ended in one outcome.</summary>
        public sealed record OutcomeCount(string Outcome, int Count);

        /// <summary>A request to find in the log by its ID.</summary>
        public sealed record Request(string RequestId, string Outcome, long LatencyMs);

        /// <summary>Summarises a day from its log lines.</summary>
        public static DailySummary From(DateOnly day, IEnumerable<string> lines)
        {
            var nonBlank = lines.Where(line => !string.IsNullOrWhiteSpace(line)).ToList();
            var entries = nonBlank.Select(QuestionLogEntry.FromJsonLine).OfType<QuestionLogEntry>().ToList();
            var tokens = Total(entries);

            return new DailySummary(
                day,
                entries.Count,
                nonBlank.Count - entries.Count,
                CountOutcomes(entries),
                entries.Count(entry => entry.HistoryTurns > 0),
                tokens,
                ModelPrice.ClaudeHaiku55.Cost(tokens),
                Median([.. entries.Select(entry => entry.LatencyMs)]),
                [.. entries.OrderByDescending(entry => entry.LatencyMs).ThenBy(entry => entry.RequestId, StringComparer.Ordinal).Take(SlowestShown).Select(AsRequest)],
                [.. entries.Where(entry => entry.Outcome != "ok").Select(AsRequest)],
                [.. entries.Select(entry => entry.PromptVersion).Distinct(StringComparer.Ordinal)]);
        }

        // most common first; ties alphabetical, so the email reads the same every time
        private static List<OutcomeCount> CountOutcomes(IEnumerable<QuestionLogEntry> entries) =>
            [.. entries.GroupBy(entry => entry.Outcome, StringComparer.Ordinal)
                .Select(group => new OutcomeCount(group.Key, group.Count()))
                .OrderByDescending(outcome => outcome.Count).ThenBy(outcome => outcome.Outcome, StringComparer.Ordinal)];

        private static TokenUsage Total(IEnumerable<QuestionLogEntry> entries) =>
            entries.Aggregate(TokenUsage.None, (total, entry) =>
                total + new TokenUsage(entry.InputTokens ?? 0, entry.CacheReadTokens ?? 0, entry.CacheWriteTokens ?? 0, entry.OutputTokens ?? 0));

        private static Request AsRequest(QuestionLogEntry entry) => new(entry.RequestId, entry.Outcome, entry.LatencyMs);

        private static long Median(IReadOnlyList<long> values)
        {
            if (values.Count == 0)
            {
                return 0;
            }

            var sorted = values.Order().ToList();
            var middle = sorted.Count / 2;
            return sorted.Count % 2 == 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
        }
    }
}
