using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Portfolio.Assistant.Core
{
    /// <summary>One line of the daily question log: one per question that reached the model, with no IP-derived data.</summary>
    /// <param name="RequestId">The trace ID, which finds the request's telemetry in App Insights.</param>
    /// <param name="Outcome"><c>ok</c>, <c>filtered</c>, <c>truncated</c>, <c>model_error</c> or <c>cancelled</c>.</param>
    public sealed record QuestionLogEntry(DateTimeOffset Timestamp, string RequestId, string Outcome, string Deployment, string PromptVersion, long LatencyMs)
    {
        // relaxed escaping keeps apostrophes and accents readable; the log is never shown in a page
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        };

        /// <summary>The visitor's trimmed question; only for requests that reached the model.</summary>
        public string? Question { get; init; }

        /// <summary>How many earlier messages came with the question; their text isn't kept.</summary>
        public int? HistoryTurns { get; init; }

        /// <summary>The answer the visitor saw.</summary>
        public string? Answer { get; init; }

        /// <summary>The IDs of the links the visitor saw.</summary>
        public IReadOnlyList<string>? Links { get; init; }

        /// <summary>Prompt tokens billed, including those written to or read from the cache.</summary>
        public int? InputTokens { get; init; }

        /// <summary>Of <see cref="InputTokens"/>, those read from the cache.</summary>
        public int? CacheReadTokens { get; init; }

        /// <summary>Of <see cref="InputTokens"/>, those written to the cache.</summary>
        public int? CacheWriteTokens { get; init; }

        /// <summary>Answer tokens billed.</summary>
        public int? OutputTokens { get; init; }

        /// <summary>The entry for a request that ended in <paramref name="outcome"/>, or null for one turned away before the model.</summary>
        /// <param name="timestamp">When the request arrived.</param>
        /// <remarks>
        /// Turned-away requests carry no question to review, and a flood of them would fill the day's append blob
        /// (50,000 blocks); App Insights records each as a request with its status code.
        /// </remarks>
        public static QuestionLogEntry? For(AskOutcome outcome, string requestId, DateTimeOffset timestamp, TimeSpan latency, string deployment, string promptVersion)
        {
            QuestionLogEntry Entry(string name, AskValidation.Valid ask) =>
                new(timestamp, requestId, name, deployment, promptVersion, (long)Math.Round(latency.TotalMilliseconds)) { Question = ask.Question, HistoryTurns = ask.History.Count };

            return outcome switch
            {
                AskOutcome.Answered answered => Entry(AnsweredOutcome(answered.Answer), answered.Ask) with
                {
                    Answer = answered.Reply.Text,
                    Links = [.. answered.Reply.Links.Select(link => link.Id)],
                    InputTokens = answered.Answer.InputTokens,
                    CacheReadTokens = answered.Answer.CacheReadTokens,
                    CacheWriteTokens = answered.Answer.CacheWriteTokens,
                    OutputTokens = answered.Answer.OutputTokens,
                },
                AskOutcome.ModelError failed => Entry("model_error", failed.Ask),
                AskOutcome.Cancelled cancelled => Entry("cancelled", cancelled.Ask),
                AskOutcome.Invalid or AskOutcome.RateLimited or AskOutcome.CountFailed => null,
                _ => throw new ArgumentOutOfRangeException(nameof(outcome), outcome, "Unknown outcome."),
            };
        }

        /// <summary>The day's append blob, <c>yyyy/MM/dd.jsonl</c> in UTC.</summary>
        public static string BlobPath(DateTimeOffset timestamp) =>
            timestamp.UtcDateTime.ToString("yyyy'/'MM'/'dd'.jsonl'", CultureInfo.InvariantCulture);

        /// <summary>The entry as one line of JSON, without its newline; empty fields are left out.</summary>
        public string ToJsonLine() => JsonSerializer.Serialize(this, JsonOptions);

        private static string AnsweredOutcome(ModelAnswer answer) => answer switch
        {
            { Filtered: true } => "filtered",
            { Truncated: true } => "truncated",
            _ => "ok",
        };
    }
}
