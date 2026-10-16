namespace Portfolio.Assistant.Core
{
    /// <summary>Everything sent to the model for one answer.</summary>
    /// <param name="System">The rules plus the knowledge.</param>
    /// <param name="Messages">Earlier turns, oldest first, ending with the question.</param>
    public sealed record Prompt(string System, IReadOnlyList<ChatMessage> Messages);
}
