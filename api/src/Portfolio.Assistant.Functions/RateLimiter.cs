using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Counts questions per visitor and in total, and turns away those over the limits.</summary>
    /// <remarks>
    /// Visitors are counted in memory: the app runs on one instance (<c>maximumInstanceCount: 1</c>), addresses never leave it,
    /// and a restart forgetting them is harmless. The global count is the cost control, so it is stored: a restart, a deploy or
    /// Flex Consumption stopping an idle app must not reopen the cap. Without the stored count, no question is allowed.
    /// </remarks>
    internal sealed class RateLimiter(RateLimits limits, TimeProvider clock, IDailyCountStore store) : IDisposable
    {
        // another instance is only ever counting during a deploy, so a few tries always settle it
        private const int MaxWriteAttempts = 3;

        private readonly SemaphoreSlim gate = new(1, 1);
        private readonly Dictionary<string, VisitorUsage> visitors = [];
        private DateOnly today;

        // the stored count as last read or written; null until it is read for today
        private DailyCount? global;

        /// <summary>Decides whether the visitor may ask now, and counts the question if so.</summary>
        /// <param name="visitorAddress">The visitor's address, from <see cref="VisitorAddress"/>.</param>
        /// <exception cref="InvalidOperationException">The global count couldn't be saved.</exception>
        public async Task<RateLimitDecision> AdmitAsync(string visitorAddress)
        {
            await gate.WaitAsync();
            try
            {
                var now = clock.GetUtcNow();
                StartNewDayIfDue(now);
                for (var attempt = 1; attempt <= MaxWriteAttempts; attempt++)
                {
                    global ??= await store.ReadAsync(today);
                    var decision = RateLimitPolicy.Decide(limits, visitors.GetValueOrDefault(visitorAddress), global.Count, now);
                    if (decision is not RateLimitDecision.Allowed allowed)
                    {
                        return decision;
                    }

                    global = await store.TryWriteAsync(today, allowed.GlobalCount, global.Version);
                    if (global is not null)
                    {
                        visitors[visitorAddress] = allowed.Visitor;
                        return decision;
                    }
                }

                throw new InvalidOperationException($"The global count kept changing during {MaxWriteAttempts} attempts to save it.");
            }
            finally
            {
                gate.Release();
            }
        }

        /// <inheritdoc />
        public void Dispose() => gate.Dispose();

        private void StartNewDayIfDue(DateTimeOffset now)
        {
            var day = DateOnly.FromDateTime(now.UtcDateTime);
            if (day != today)
            {
                visitors.Clear();
                global = null;
                today = day;
            }
        }
    }
}
