using System.Diagnostics;
using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    public sealed class RateLimiterTests : IDisposable
    {
        private static readonly RateLimits Limits = new() { PerMinute = 2, PerDay = 3, GlobalPerDay = 4 };
        private static readonly TimeSpan ShortDeadline = TimeSpan.FromMilliseconds(200);

        private readonly ManualTimeProvider clock = new(new DateTimeOffset(2026, 10, 21, 14, 0, 0, TimeSpan.Zero));
        private readonly MemoryDailyCountStore store = new();
        private readonly List<RateLimiter> created = [];

        public void Dispose() => created.ForEach(rateLimiter => rateLimiter.Dispose());

        private RateLimiter RateLimiter(IDailyCountStore? countStore = null, TimeSpan? deadline = null)
        {
            var rateLimiter = new RateLimiter(Limits, clock, countStore ?? store, deadline ?? TimeSpan.FromSeconds(5));
            created.Add(rateLimiter);
            return rateLimiter;
        }

        private static Task<RateLimitDecision> Admit(RateLimiter rateLimiter, string visitor) => rateLimiter.AdmitAsync(visitor, TestContext.Current.CancellationToken);

        private static async Task<IEnumerable<bool>> Allowed(RateLimiter rateLimiter, params string[] visitors)
        {
            var allowed = new List<bool>();
            foreach (var visitor in visitors)
            {
                allowed.Add(await Admit(rateLimiter, visitor) is RateLimitDecision.Allowed);
            }

            return allowed;
        }

        [Fact]
        public async Task A_visitor_over_the_minute_limit_is_turned_away_until_the_minute_ends()
        {
            var rateLimiter = RateLimiter();

            (await Allowed(rateLimiter, "203.0.113.7", "203.0.113.7", "203.0.113.7")).Should().Equal(true, true, false);

            clock.Now = clock.Now.AddMinutes(1);
            (await Admit(rateLimiter, "203.0.113.7")).Should().BeOfType<RateLimitDecision.Allowed>();
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

            (await Admit(rateLimiter, "198.51.100.9")).Should().BeOfType<RateLimitDecision.Denied>().Which.GlobalCapReached.Should().BeTrue();
        }

        // the cap is the cost control: without the count, no question goes to the model
        [Fact]
        public async Task A_question_is_refused_when_the_count_cant_be_read_or_saved()
        {
            var rateLimiter = RateLimiter(new FailingDailyCountStore());

            await FluentActions.Awaiting(() => Admit(rateLimiter, "203.0.113.7")).Should().ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task A_turned_away_question_isnt_counted()
        {
            var rateLimiter = RateLimiter();
            await Allowed(rateLimiter, "203.0.113.7", "203.0.113.7", "203.0.113.7");

            store.Count(new DateOnly(2026, 10, 21)).Should().Be(2);
        }

        // storage's own timeouts and retries can run to minutes; the visitor's answer can't wait that long
        [Fact]
        public async Task An_admit_that_cant_reach_the_count_gives_up_at_the_deadline()
        {
            var rateLimiter = RateLimiter(new HangingDailyCountStore(), ShortDeadline);
            var timer = Stopwatch.StartNew();

            await FluentActions.Awaiting(() => Admit(rateLimiter, "203.0.113.7")).Should().ThrowAsync<TimeoutException>();

            timer.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(2));
        }

        // one admit at a time holds the count, so a hung one must not hold everyone else for longer than the deadline
        [Fact]
        public async Task A_visitor_queued_behind_a_hung_admit_waits_no_longer_than_the_deadline()
        {
            var rateLimiter = RateLimiter(new HangingDailyCountStore(), ShortDeadline);
            var timer = Stopwatch.StartNew();

            var first = Admit(rateLimiter, "203.0.113.7");
            var second = Admit(rateLimiter, "198.51.100.9");

            await FluentActions.Awaiting(() => second).Should().ThrowAsync<TimeoutException>();
            timer.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(2));
            await FluentActions.Awaiting(() => first).Should().ThrowAsync<TimeoutException>();
        }

        // a slowdown mustn't spend the day's cap on visitors who have already gone
        [Fact]
        public async Task A_visitor_who_left_before_their_turn_isnt_counted()
        {
            var rateLimiter = RateLimiter();
            using var left = new CancellationTokenSource();
            await left.CancelAsync();

            await FluentActions.Awaiting(() => rateLimiter.AdmitAsync("203.0.113.7", left.Token)).Should().ThrowAsync<OperationCanceledException>();

            store.Count(new DateOnly(2026, 10, 21)).Should().Be(0);
        }
    }
}
