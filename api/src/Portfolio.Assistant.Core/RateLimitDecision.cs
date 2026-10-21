namespace Portfolio.Assistant.Core
{
    /// <summary>Whether a question may go to the model.</summary>
    public abstract record RateLimitDecision
    {
        private RateLimitDecision()
        {
        }

        /// <summary>Ask the model, then store these counts.</summary>
        /// <param name="Visitor">The visitor's counts including this question.</param>
        /// <param name="GlobalCount">Today's total including this question.</param>
        public sealed record Allowed(VisitorUsage Visitor, int GlobalCount) : RateLimitDecision;

        /// <summary>Answer with a 429; no counts change.</summary>
        /// <param name="RetryAfterSeconds">Whole seconds until the visitor may ask again; at least 1.</param>
        /// <param name="GlobalCapReached">Everyone is turned away until midnight, which raises an alert.</param>
        public sealed record Denied(int RetryAfterSeconds, bool GlobalCapReached) : RateLimitDecision;
    }
}
