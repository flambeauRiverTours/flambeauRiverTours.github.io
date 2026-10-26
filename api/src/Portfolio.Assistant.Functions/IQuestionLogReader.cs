namespace Portfolio.Assistant.Functions
{
    /// <summary>Reads back a day of the question log, for the daily summary.</summary>
    internal interface IQuestionLogReader
    {
        /// <summary>The storage account holding the log, named in the summary email.</summary>
        string StorageAccount { get; }

        /// <summary>The UTC day's lines in the order written; none if nothing was logged.</summary>
        Task<IReadOnlyList<string>> ReadDayAsync(DateOnly day, CancellationToken cancellationToken);
    }
}
