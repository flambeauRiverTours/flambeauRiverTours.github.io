namespace Portfolio.Assistant.Core
{
    /// <summary>How many questions are allowed, per visitor and in total; the Function binds these from <c>Limits</c> settings.</summary>
    public sealed record RateLimits
    {
        /// <summary>Per visitor, in a fixed one-minute window.</summary>
        public int PerMinute { get; init; } = 5;

        /// <summary>Per visitor, per UTC day.</summary>
        public int PerDay { get; init; } = 30;

        /// <summary>All visitors together, per UTC day; the cost cap.</summary>
        public int GlobalPerDay { get; init; } = 300;
    }
}
