namespace Portfolio.Assistant.Core
{
    /// <summary>The model's reply and its token counts.</summary>
    /// <param name="Text">The raw reply, including the final <c>Links:</c> line.</param>
    /// <param name="Filtered">The content filter blocked the question or the answer; <paramref name="Text"/> is then <see cref="FilteredReply"/>.</param>
    public sealed record ModelAnswer(string Text, int InputTokens, int OutputTokens, bool Filtered = false)
    {
        /// <summary>What a visitor sees when the content filter blocks a question or answer.</summary>
        public const string FilteredReply = "Sorry, I can only answer questions about Jack, his experience and his job search.\nLinks: none";
    }
}
