namespace Portfolio.Assistant.Core
{
    /// <summary>The model's reply and its token counts.</summary>
    /// <param name="Text">The raw reply, including the final <c>Links:</c> line.</param>
    public sealed record ModelAnswer(string Text, int InputTokens, int OutputTokens, string Deployment);
}
