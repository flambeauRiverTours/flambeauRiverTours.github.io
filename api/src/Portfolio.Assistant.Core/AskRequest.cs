namespace Portfolio.Assistant.Core
{
    /// <summary>The body the drawer posts to <c>/api/ask</c>, before validation.</summary>
    /// <param name="History">Earlier messages, oldest first; null means none.</param>
    public sealed record AskRequest(string? Question, IReadOnlyList<AskRequestMessage>? History);

    /// <summary>One earlier message as the drawer sends it.</summary>
    /// <param name="Role"><c>user</c> or <c>assistant</c> once validated.</param>
    public sealed record AskRequestMessage(string? Role, string? Content);
}
