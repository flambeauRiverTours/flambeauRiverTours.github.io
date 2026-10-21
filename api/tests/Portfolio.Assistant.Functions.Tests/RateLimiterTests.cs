using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    public sealed class RateLimiterTests : IDisposable
    {
        private static readonly RateLimits Limits = new() { PerMinute = 2, PerDay = 3, GlobalPerDay = 4 };

        private readonly ManualTimeProvider clock = new(new DateTimeOffset(2026, 10, 21, 14, 0, 0, TimeSpan.Zero));
        private readonly MemoryDailyCountStore store = new();
        private readonly List<RateLimiter> created = [];

        public void Dispose() => created.ForEach(rateLimiter => rateLimiter.Dispose());

        private RateLimiter RateLimiter(IDailyCountStore? countStore = null)
        {
            var rateLimiter = new RateLimiter(Limits, clock, countStore ?? store);
            created.Add(rateLimiter);
            return rateLimiter;
        }

        private static async Task<IEnumerable<bool>> Allowed(RateLimiter rateLimiter, params string[] visitors)
        {
            var allowed = new List<bool>();
            foreach (var visitor in visitors)
            {
                allowed.Add(await rateLimiter.AdmitAsync(visitor) is RateLimitDecision.Allowed);
            }

            return allowed;
        }

        [Fact]
        public async Task A_visitor_over_the_minute_limit_is_turned_away_until_the_minute_ends()
        {
            var rateLimiter = RateLimiter();

            (await Allowed(rateLimiter, "203.0.113.7", "203.0.113.7", "203.0.113.7")).Should().Equal(true, true, false);

            clock.Now = clock.Now.AddMinutes(1);
            (await rateLimiter.AdmitAsync("203.0.113.7")).Should().BeOfType<RateLimitDecision.Allowed>();
        }

        [Fact]
        public async Task Visitors_are_counted_apart_but_share_the_daily_cap() =>
            (await Allowed(RateLimiter(), "203.0.113.7", "203.0.113.7", "198.51.100.9", "198.51.100.9", "192.0.2.1")).Should().Equal(true, true, true, true, false);

        [Fact]
        public async Task A_new_utc_day_starts_everyone_afresh()
        {
            var rateLimiter = RateLimiter();
            await Allowed(rateLimiter, "203.0.113.7", "203.0.113.7", "198.51.100.9", "198.51.100.9");

            clock.Now = new DateTimeOffset(2026, 10, 22, 0, 0, 1, TimeSpan.Zero);

            (await Allowed(rateLimiter, "203.0.113.7", "192.0.2.1")).Should().Equal(true, true);
        }

        // Flex Consumption stops an idle app, so a restart must not reopen the cap
        [Fact]
        public async Task The_daily_cap_survives_a_restart()
        {
            await Allowed(RateLimiter(), "203.0.113.7", "203.0.113.7", "198.51.100.9");

            (await Allowed(RateLimiter(), "192.0.2.1", "192.0.2.2")).Should().Equal(true, false);
            store.Count(new DateOnly(2026, 10, 21)).Should().Be(4);
        }

        // during a deploy, the old and new instances can both be counting for a moment
        [Fact]
        public async Task A_count_changed_elsewhere_is_read_again_before_the_question_is_allowed()
        {
            var rateLimiter = RateLimiter();
            await Allowed(rateLimiter, "203.0.113.7");

            store.WriteElsewhere(new DateOnly(2026, 10, 21), 4);

            (await rateLimiter.AdmitAsync("198.51.100.9")).Should().BeOfType<RateLimitDecision.Denied>().Which.GlobalCapReached.Should().BeTrue();
        }

        // the cap is the cost control: without the count, no question goes to the model
        [Fact]
        public async Task A_question_is_refused_when_the_count_cant_be_read_or_saved()
        {
            var rateLimiter = RateLimiter(new FailingDailyCountStore());

            await FluentActions.Awaiting(() => rateLimiter.AdmitAsync("203.0.113.7")).Should().ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task A_turned_away_question_isnt_counted()
        {
            var rateLimiter = RateLimiter();
            await Allowed(rateLimiter, "203.0.113.7", "203.0.113.7", "203.0.113.7");

            store.Count(new DateOnly(2026, 10, 21)).Should().Be(2);
        }
    }
}
