namespace Portfolio.Assistant.Core
{
    /// <summary>A plain-text email to the owner.</summary>
    public sealed record SummaryEmail(string Subject, string Text);
}
