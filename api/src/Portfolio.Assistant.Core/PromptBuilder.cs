namespace Portfolio.Assistant.Core
{
    /// <summary>Builds the prompt for one question.</summary>
    public static class PromptBuilder
    {
        /// <summary>Adds the history and question to the knowledge.</summary>
        /// <param name="history">Earlier turns, oldest first.</param>
        public static Prompt Build(KnowledgeBase knowledge, IReadOnlyList<ChatMessage> history, string question) =>
            new(knowledge.SystemMessage, [.. history, new ChatMessage(ChatRole.User, question)]);
    }
}
