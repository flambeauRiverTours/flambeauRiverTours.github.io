using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Keeps one line per request for review.</summary>
    internal interface IQuestionLog
    {
        /// <summary>Adds the entry to its day's log.</summary>
        Task WriteAsync(QuestionLogEntry entry, CancellationToken cancellationToken);
    }
}
