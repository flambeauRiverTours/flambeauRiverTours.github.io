using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    public class InMemoryRateLimiterTests
    {
        private static readonly RateLimits Limits = new() { PerMinute = 2, PerDay = 3, GlobalPerDay = 4 };

        private readonly ManualTimeProvider clock = new(new DateTimeOffset(2026, 10, 21, 14, 0, 0, TimeSpan.Zero));

        private InMemoryRateLimiter RateLimiter() => new(Limits, clock);

        private static IEnumerable<bool> Allowed(InMemoryRateLimiter rateLimiter, params string[] visitors) =>
            [.. visitors.Select(visitor => rateLimiter.Admit(visitor) is RateLimitDecision.Allowed)];

        [Fact]
        public void A_visitor_over_the_minute_limit_is_turned_away_until_the_minute_ends()
        {
            var rateLimiter = RateLimiter();

            Allowed(rateLimiter, "203.0.113.7", "203.0.113.7", "203.0.113.7").Should().Equal(true, true, false);

            clock.Now = clock.Now.AddMinutes(1);
            rateLimiter.Admit("203.0.113.7").Should().BeOfType<RateLimitDecision.Allowed>();
        }

        [Fact]
        public void Visitors_are_counted_apart_but_share_the_daily_cap() =>
            Allowed(RateLimiter(), "203.0.113.7", "203.0.113.7", "198.51.100.9", "198.51.100.9", "192.0.2.1").Should().Equal(true, true, true, true, false);

        [Fact]
        public void A_new_utc_day_starts_everyone_afresh()
        {
            var rateLimiter = RateLimiter();
            Allowed(rateLimiter, "203.0.113.7", "203.0.113.7", "198.51.100.9", "198.51.100.9");

            clock.Now = new DateTimeOffset(2026, 10, 22, 0, 0, 1, TimeSpan.Zero);

            Allowed(rateLimiter, "203.0.113.7", "192.0.2.1").Should().Equal(true, true);
        }
    }
}
