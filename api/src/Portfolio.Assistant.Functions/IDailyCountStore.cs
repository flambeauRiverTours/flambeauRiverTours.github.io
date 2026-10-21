namespace Portfolio.Assistant.Functions
{
    /// <summary>Keeps the global count of questions for each UTC day where a restart can't lose it.</summary>
    internal interface IDailyCountStore
    {
        /// <summary>The day's count, or zero with no version before its first write.</summary>
        Task<DailyCount> ReadAsync(DateOnly day);

        /// <summary>Saves the day's count unless it changed since <paramref name="expectedVersion"/> was read.</summary>
        /// <param name="expectedVersion">Null when the day had no count yet.</param>
        /// <returns>The saved count, or null when another write came first.</returns>
        Task<DailyCount?> TryWriteAsync(DateOnly day, int count, string? expectedVersion);
    }

    /// <summary>A day's global count as stored.</summary>
    /// <param name="Version">Changes with every write; null before the first.</param>
    internal sealed record DailyCount(int Count, string? Version);
}
