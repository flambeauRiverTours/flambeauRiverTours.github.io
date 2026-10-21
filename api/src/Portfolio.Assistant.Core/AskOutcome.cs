namespace Portfolio.Assistant.Core
{
    /// <summary>How a request to <c>/api/ask</c> ended: what the visitor is sent and what the log keeps.</summary>
    /// <remarks>Only outcomes that reached the model carry the question, so turned-away requests can't log it.</remarks>
    public abstract record AskOutcome
    {
        private AskOutcome()
        {
        }

        /// <summary>A 400: the body broke a rule.</summary>
        public sealed record Invalid(string Detail) : AskOutcome;

        /// <summary>A 429: the visitor or the whole site is over its limit.</summary>
        public sealed record RateLimited(int RetryAfterSeconds) : AskOutcome;

        /// <summary>A 503: the model call failed.</summary>
        public sealed record ModelError(AskValidation.Valid Ask) : AskOutcome;

        /// <summary>A 200: the model's reply, or the polite refusal when the content filter blocked it.</summary>
        /// <param name="Reply">What the visitor sees.</param>
        public sealed record Answered(AskValidation.Valid Ask, ModelAnswer Answer, AnswerWithLinks Reply) : AskOutcome;
    }
}
