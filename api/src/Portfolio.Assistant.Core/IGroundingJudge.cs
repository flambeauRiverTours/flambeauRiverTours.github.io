namespace Portfolio.Assistant.Core
{
    /// <summary>A stronger model that lists the claims in an answer the knowledge doesn't support.</summary>
    /// <remarks>Catches inventions nobody anticipated, which the eval set's patterns can't; used by the eval runner only.</remarks>
    public interface IGroundingJudge
    {
        /// <summary>The deployment's name, for the report.</summary>
        string Deployment { get; }

        /// <summary>Checks one answer, as the visitor would see it, against the knowledge.</summary>
        Task<GroundingVerdict> JudgeAsync(string question, string answer, CancellationToken cancellationToken);
    }

    /// <summary>The judge's verdict on one answer and what it cost.</summary>
    /// <param name="Unsupported">Each claim the knowledge doesn't support; empty when grounded, null when the judge gave no verdict.</param>
    /// <param name="InputTokens">All prompt tokens, including those written to or read from the cache.</param>
    public sealed record GroundingVerdict(IReadOnlyList<string>? Unsupported, int InputTokens, int OutputTokens)
    {
        /// <summary>Prompt tokens read from the cache.</summary>
        public int CacheReadTokens { get; init; }

        /// <summary>Prompt tokens written to the cache.</summary>
        public int CacheWriteTokens { get; init; }

        /// <summary>Why there is no verdict, when <see cref="Unsupported"/> is null.</summary>
        public string? NoVerdictReason { get; init; }
    }
}
