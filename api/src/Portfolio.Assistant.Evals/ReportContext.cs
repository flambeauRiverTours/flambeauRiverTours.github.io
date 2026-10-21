namespace Portfolio.Assistant.Evals
{
    /// <summary>What a report describes besides the results.</summary>
    /// <param name="Date">When the run started.</param>
    /// <param name="JudgeDeployment">The grounding judge's deployment; null when none ran.</param>
    internal sealed record ReportContext(DateTimeOffset Date, string Deployment, string PromptVersion, int Runs, EvalSet Set = EvalSet.Tuned, string? JudgeDeployment = null);
}
