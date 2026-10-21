namespace Portfolio.Assistant.Evals
{
    /// <summary>An earlier turn in an eval case.</summary>
    /// <param name="Role"><c>user</c> or <c>assistant</c>.</param>
    internal sealed record HistoryMessage(string Role, string Content);
}
