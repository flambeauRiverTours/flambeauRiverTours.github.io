using System.Globalization;
using System.Text;

namespace Portfolio.Assistant.Core
{
    /// <summary>Writes a <see cref="DailySummary"/> as the owner's morning email.</summary>
    /// <remarks>Visitors' text stays in the 90-day log (privacy page), so the email says where to read it.</remarks>
    public static class DailySummaryEmail
    {
        private static readonly CultureInfo Invariant = CultureInfo.InvariantCulture;

        /// <summary>The email, pointing to the day's log in the given storage account.</summary>
        public static SummaryEmail For(DailySummary summary, string storageAccount)
        {
            var text = new StringBuilder();
            AppendCounts(text, summary);
            AppendRequests(text.AppendLine().AppendLine("Needs a look:"), summary.NeedsALook);
            AppendTokens(text.AppendLine(), summary);
            text.AppendLine().AppendLine(Invariant, $"Latency: median {summary.MedianLatencyMs:N0} ms; slowest:");
            AppendRequests(text, summary.Slowest);
            text.AppendLine().AppendLine("Prompt versions: " + string.Join(", ", summary.PromptVersions));
            AppendReadInstructions(text.AppendLine(), summary.Day, storageAccount);
            return new SummaryEmail(Subject(summary), text.ToString());
        }

        private static string Subject(DailySummary summary)
        {
            var needsALook = summary.NeedsALook.Count + summary.Unreadable;
            var subject = string.Create(Invariant, $"Assistant, {summary.Day:yyyy-MM-dd}: {summary.Questions} question{Plural(summary.Questions)}");
            return needsALook == 0 ? subject : subject + string.Create(Invariant, $" ({needsALook} need{(needsALook == 1 ? "s" : "")} a look)");
        }

        private static void AppendCounts(StringBuilder text, DailySummary summary)
        {
            text.AppendLine(Invariant, $"The assistant's questions on {summary.Day.ToString("dddd d MMMM yyyy", Invariant)} (UTC).")
                .AppendLine()
                .AppendLine(Invariant, $"{summary.Questions:N0} questions, {summary.MidConversation:N0} mid-conversation")
                .AppendLine("Outcomes: " + string.Join(", ", summary.Outcomes.Select(outcome => string.Create(Invariant, $"{outcome.Outcome} {outcome.Count:N0}"))));
            if (summary.Unreadable > 0)
            {
                text.AppendLine(Invariant, $"Lines that couldn't be read: {summary.Unreadable:N0}");
            }
        }

        private static void AppendTokens(StringBuilder text, DailySummary summary)
        {
            var tokens = summary.Tokens;
            text.AppendLine(Invariant, $"Tokens: {tokens.Input:N0} input ({tokens.CacheRead:N0} read from the cache, {tokens.CacheWrite:N0} written to it), {tokens.Output:N0} output")
                .AppendLine(Invariant, $"Estimated cost: ${summary.EstimatedCost:0.0000} at Claude Haiku 5.5's list prices");
        }

        private static void AppendRequests(StringBuilder text, IReadOnlyList<DailySummary.Request> requests)
        {
            if (requests.Count == 0)
            {
                text.AppendLine("- none");
            }

            foreach (var request in requests)
            {
                text.AppendLine(Invariant, $"- {request.Outcome}  {request.RequestId}  {request.LatencyMs:N0} ms");
            }
        }

        private static void AppendReadInstructions(StringBuilder text, DateOnly day, string storageAccount)
        {
            var path = QuestionLogEntry.BlobPath(day);
            text.AppendLine("The questions and answers aren't in this email. To read them:")
                .AppendLine(Invariant, $"- Portal: storage account {storageAccount} → Containers → assistant-logs → {path} (switch to your Microsoft Entra account)")
                .AppendLine(Invariant, $"- CLI: az storage blob download --auth-mode login --account-name {storageAccount} -c assistant-logs -n {path} -f {day:yyyy-MM-dd}.jsonl");
        }

        private static string Plural(int count) => count == 1 ? "" : "s";
    }
}
