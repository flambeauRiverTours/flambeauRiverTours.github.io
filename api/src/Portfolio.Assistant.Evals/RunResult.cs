namespace Portfolio.Assistant.Evals
{
    /// <summary>One run of one case.</summary>
    /// <param name="Raw">The model's output, or the error when the call failed.</param>
    /// <param name="Filtered">The content filter blocked it; <paramref name="Raw"/> is the reply a visitor would see.</param>
    internal sealed record RunResult(string Raw, RunGrade Grade, int InputTokens, int OutputTokens, bool Filtered = false);
}
