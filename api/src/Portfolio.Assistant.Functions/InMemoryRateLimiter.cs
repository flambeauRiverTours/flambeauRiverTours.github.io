using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Counts questions per visitor and in total, in memory, and turns away those over the limits.</summary>
    /// <remarks>
    /// The app is capped at one instance (<c>maximumInstanceCount: 1</c>), so these are the only counts.
    /// Addresses never leave memory and are dropped at UTC midnight; a restart or deploy also starts the counts afresh.
    /// </remarks>
    internal sealed class InMemoryRateLimiter(RateLimits limits, TimeProvider clock)
    {
        private readonly Lock gate = new();
        private readonly Dictionary<string, VisitorUsage> visitors = [];
        private DateOnly today;
        private int globalCount;

        /// <summary>Decides whether the visitor may ask now, and counts the question if so.</summary>
        /// <param name="visitorAddress">The visitor's IP address, from <see cref="VisitorAddress"/>.</param>
        public RateLimitDecision Admit(string visitorAddress)
        {
            var now = clock.GetUtcNow();
            lock (gate)
            {
                StartNewDayIfDue(now);
                var decision = RateLimitPolicy.Decide(limits, visitors.GetValueOrDefault(visitorAddress), globalCount, now);
                if (decision is RateLimitDecision.Allowed allowed)
                {
                    visitors[visitorAddress] = allowed.Visitor;
                    globalCount = allowed.GlobalCount;
                }

                return decision;
            }
        }

        private void StartNewDayIfDue(DateTimeOffset now)
        {
            var day = DateOnly.FromDateTime(now.UtcDateTime);
            if (day != today)
            {
                visitors.Clear();
                globalCount = 0;
                today = day;
            }
        }
    }
}
