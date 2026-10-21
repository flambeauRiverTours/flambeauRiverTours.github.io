namespace Portfolio.Assistant.Core
{
    /// <summary>One visitor's questions so far today.</summary>
    /// <param name="MinuteStart">When the current one-minute window began.</param>
    /// <param name="MinuteCount">Questions in that window.</param>
    public sealed record VisitorUsage(int DayCount, DateTimeOffset MinuteStart, int MinuteCount);
}
