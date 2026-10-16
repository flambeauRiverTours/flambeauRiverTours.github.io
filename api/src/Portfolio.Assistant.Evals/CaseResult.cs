namespace Portfolio.Assistant.Evals
{
    /// <summary>Every run of one case.</summary>
    internal sealed record CaseResult(EvalCase Case, IReadOnlyList<RunResult> Runs)
    {
        /// <summary>Whether every run passed; one failure fails the case.</summary>
        public bool Passed => Runs.All(run => run.Grade.Passed);
    }
}
