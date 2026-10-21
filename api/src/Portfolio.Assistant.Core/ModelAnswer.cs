namespace Portfolio.Assistant.Core
{
    /// <summary>The model's reply and its token counts.</summary>
    /// <param name="Text">The raw reply, including the final <c>Links:</c> line.</param>
    /// <param name="InputTokens">All prompt tokens, including those written to or read from the cache.</param>
    /// <param name="Filtered">The content filter blocked the question or the answer; <paramref name="Text"/> is then <see cref="FilteredReply"/>.</param>
    public sealed record ModelAnswer(string Text, int InputTokens, int OutputTokens, bool Filtered = false)
    {
        /// <summary>What a visitor sees when the content filter blocks a question or answer.</summary>
        public const string FilteredReply = "Sorry, I can only answer questions about Jack, his experience and his job search.\nLinks: none";

        /// <summary>The reply hit the token limit and stops mid-answer, without its <c>Links:</c> line.</summary>
        public bool Truncated { get; init; }

        /// <summary>Prompt tokens read from the cache, billed at about a tenth of the input price.</summary>
        public int CacheReadTokens { get; init; }

        /// <summary>Prompt tokens written to the cache, billed at about 1.25 times the input price.</summary>
        public int CacheWriteTokens { get; init; }
    }
}
