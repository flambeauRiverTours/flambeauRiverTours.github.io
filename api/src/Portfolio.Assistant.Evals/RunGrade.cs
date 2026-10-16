namespace Portfolio.Assistant.Evals
{
    /// <summary>The outcome of grading one run.</summary>
    /// <param name="Failures">Why the run failed; empty when it passed.</param>
    internal sealed record RunGrade(IReadOnlyList<string> Failures, LinkScore Links)
    {
        /// <summary>Whether the run passed every check.</summary>
        public bool Passed => Failures.Count == 0;
    }
}
