namespace Portfolio.Assistant.Core
{
    /// <summary>The answer a visitor sees and the page sections it links to.</summary>
    /// <param name="Text">Plain text, without the <c>Links:</c> line or web addresses.</param>
    /// <param name="Links">At most three, in the model's order.</param>
    public sealed record AnswerWithLinks(string Text, IReadOnlyList<LinkTarget> Links);
}
