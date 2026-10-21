namespace Portfolio.Assistant.Core
{
    /// <summary>Decides from the current counts whether a question may go to the model.</summary>
    public static class RateLimitPolicy
    {
        private static readonly TimeSpan Minute = TimeSpan.FromMinutes(1);

        /// <summary>Allows the question and returns the new counts, or denies it with the wait.</summary>
        /// <param name="visitor">The visitor's counts today; null before their first question.</param>
        /// <param name="globalCount">Questions from everyone today.</param>
        public static RateLimitDecision Decide(RateLimits limits, VisitorUsage? visitor, int globalCount, DateTimeOffset now)
        {
            var usage = WithMinuteRolledOver(visitor, now);
            var untilMidnight = NextUtcMidnight(now) - now;
            TimeSpan[] waits =
            [
                globalCount >= limits.GlobalPerDay ? untilMidnight : TimeSpan.Zero,
                usage.DayCount >= limits.PerDay ? untilMidnight : TimeSpan.Zero,
                usage.MinuteCount >= limits.PerMinute ? usage.MinuteStart + Minute - now : TimeSpan.Zero,
            ];

            var longestWait = waits.Max();
            return longestWait > TimeSpan.Zero
                ? new RateLimitDecision.Denied(RoundUpToWholeSeconds(longestWait))
                : new RateLimitDecision.Allowed(usage with { DayCount = usage.DayCount + 1, MinuteCount = usage.MinuteCount + 1 }, globalCount + 1);
        }

        // a visitor's first question, or their first after a minute has passed, starts a new minute
        private static VisitorUsage WithMinuteRolledOver(VisitorUsage? visitor, DateTimeOffset now) => visitor switch
        {
            null => new VisitorUsage(DayCount: 0, MinuteStart: now, MinuteCount: 0),
            _ when now - visitor.MinuteStart >= Minute => visitor with { MinuteStart = now, MinuteCount = 0 },
            _ => visitor,
        };

        // the daily counts live in a partition per UTC date, so they reset at UTC midnight
        private static DateTimeOffset NextUtcMidnight(DateTimeOffset now) => new(now.UtcDateTime.Date.AddDays(1), TimeSpan.Zero);

        // rounded up, so a client that waits exactly this long is never a moment early
        private static int RoundUpToWholeSeconds(TimeSpan wait) => (int)Math.Ceiling(wait.TotalSeconds);
    }
}
