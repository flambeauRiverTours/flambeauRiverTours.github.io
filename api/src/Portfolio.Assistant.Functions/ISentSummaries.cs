namespace Portfolio.Assistant.Functions
{
    /// <summary>Days already emailed, so no day is sent twice.</summary>
    internal interface ISentSummaries
    {
        /// <summary>Whether the day's summary was sent.</summary>
        Task<bool> WasSentAsync(DateOnly day, CancellationToken cancellationToken);

        /// <summary>Records the day's summary as sent; marking it again is harmless.</summary>
        Task MarkSentAsync(DateOnly day, CancellationToken cancellationToken);
    }
}
