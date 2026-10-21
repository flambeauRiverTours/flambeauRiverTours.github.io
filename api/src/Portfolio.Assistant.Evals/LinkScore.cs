namespace Portfolio.Assistant.Evals
{
    /// <summary>The run's links compared with the expected ones.</summary>
    /// <param name="Ids">The IDs the model gave.</param>
    /// <param name="ExpectedPresent">Whether every expected ID is there; null when none are expected.</param>
    /// <param name="Extra">How many IDs weren't expected; 0 when none are expected.</param>
    internal sealed record LinkScore(IReadOnlyList<string> Ids, bool? ExpectedPresent, int Extra)
    {
        /// <summary>No links and nothing expected, e.g. for a failed call.</summary>
        public static readonly LinkScore None = new([], null, 0);
    }
}
