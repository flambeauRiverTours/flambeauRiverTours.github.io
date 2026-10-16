namespace Portfolio.Assistant.Evals
{
    /// <summary>One run of one case.</summary>
    /// <param name="Raw">The model's output, or the error when the call failed.</param>
    internal sealed record RunResult(string Raw, RunGrade Grade, int InputTokens, int OutputTokens);
}
