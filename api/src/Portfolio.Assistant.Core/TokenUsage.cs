namespace Portfolio.Assistant.Core
{
    /// <summary>Tokens billed for one or more calls.</summary>
    /// <param name="Input">Every prompt token, including those read from or written to the cache.</param>
    public sealed record TokenUsage(long Input, long CacheRead, long CacheWrite, long Output)
    {
        /// <summary>No tokens.</summary>
        public static TokenUsage None { get; } = new(0, 0, 0, 0);

        /// <summary>The two usages together.</summary>
        public static TokenUsage operator +(TokenUsage left, TokenUsage right) =>
            new(left.Input + right.Input, left.CacheRead + right.CacheRead, left.CacheWrite + right.CacheWrite, left.Output + right.Output);
    }
}
