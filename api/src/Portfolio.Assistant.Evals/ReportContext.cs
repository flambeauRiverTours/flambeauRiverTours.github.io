namespace Portfolio.Assistant.Evals
{
    /// <summary>What a report describes besides the results.</summary>
    /// <param name="Date">When the run started.</param>
    internal sealed record ReportContext(DateTimeOffset Date, string Deployment, string PromptVersion, int Runs);
}
