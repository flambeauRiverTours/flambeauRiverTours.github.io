using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals
{
    /// <summary>One run of one case.</summary>
    /// <param name="Raw">The model's output, or the error when the call failed.</param>
    /// <param name="InputTokens">All prompt tokens, including those written to or read from the cache.</param>
    /// <param name="Filtered">The content filter blocked it; <paramref name="Raw"/> is the reply a visitor would see.</param>
    internal sealed record RunResult(string Raw, RunGrade Grade, int InputTokens, int OutputTokens, bool Filtered = false)
    {
        /// <summary>Of <see cref="InputTokens"/>, those read from the cache.</summary>
        public int CacheReadTokens { get; init; }

        /// <summary>Of <see cref="InputTokens"/>, those written to the cache.</summary>
        public int CacheWriteTokens { get; init; }

        /// <summary>The grounding judge's verdict; null when no judge ran or there was no answer to judge.</summary>
        public GroundingVerdict? Grounding { get; init; }
    }
}
