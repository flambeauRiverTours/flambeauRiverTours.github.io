using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Portfolio.Assistant.Core
{
    /// <summary>One line of the daily question log: one per request, with no IP-derived data.</summary>
    /// <param name="RequestId">The trace ID, which finds the request's telemetry in App Insights.</param>
    /// <param name="Outcome"><c>ok</c>, <c>filtered</c>, <c>model_error</c>, <c>invalid</c> or <c>rate_limited</c>.</param>
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

        /// <summary>Prompt tokens billed.</summary>
        public int? InputTokens { get; init; }

        /// <summary>Answer tokens billed.</summary>
        public int? OutputTokens { get; init; }

        /// <summary>The entry for a request that ended in <paramref name="outcome"/>.</summary>
        /// <param name="timestamp">When the request arrived.</param>
        public static QuestionLogEntry For(AskOutcome outcome, string requestId, DateTimeOffset timestamp, TimeSpan latency, string deployment, string promptVersion)
        {
            QuestionLogEntry Entry(string name) => new(timestamp, requestId, name, deployment, promptVersion, (long)Math.Round(latency.TotalMilliseconds));

            return outcome switch
            {
                AskOutcome.Answered answered => Entry(answered.Answer.Filtered ? "filtered" : "ok") with
                {
                    Question = answered.Ask.Question,
                    HistoryTurns = answered.Ask.History.Count,
                    Answer = answered.Reply.Text,
                    Links = [.. answered.Reply.Links.Select(link => link.Id)],
                    InputTokens = answered.Answer.InputTokens,
                    OutputTokens = answered.Answer.OutputTokens,
                },
                AskOutcome.ModelError failed => Entry("model_error") with { Question = failed.Ask.Question, HistoryTurns = failed.Ask.History.Count },
                AskOutcome.RateLimited => Entry("rate_limited"),
                AskOutcome.Invalid => Entry("invalid"),
                _ => throw new ArgumentOutOfRangeException(nameof(outcome), outcome, "Unknown outcome."),
            };
        }

        /// <summary>The day's append blob, <c>yyyy/MM/dd.jsonl</c> in UTC.</summary>
        public static string BlobPath(DateTimeOffset timestamp) =>
            timestamp.UtcDateTime.ToString("yyyy'/'MM'/'dd'.jsonl'", CultureInfo.InvariantCulture);

        /// <summary>The entry as one line of JSON, without its newline; empty fields are left out.</summary>
        public string ToJsonLine() => JsonSerializer.Serialize(this, JsonOptions);
    }
}
