namespace Portfolio.Assistant.Core
{
    /// <summary>One message in the conversation.</summary>
    public sealed record ChatMessage(ChatRole Role, string Content);

    /// <summary>Who wrote a message.</summary>
    public enum ChatRole
    {
        /// <summary>The visitor.</summary>
        User,

        /// <summary>The assistant.</summary>
        Assistant,
    }
}
