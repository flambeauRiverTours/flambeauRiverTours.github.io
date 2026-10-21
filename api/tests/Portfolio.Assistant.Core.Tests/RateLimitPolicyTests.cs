using FluentAssertions;

namespace Portfolio.Assistant.Core.Tests
{
    public class RateLimitPolicyTests
    {
        private static readonly RateLimits Limits = new() { PerMinute = 5, PerDay = 30, GlobalPerDay = 300 };
        private static readonly DateTimeOffset Now = new(2026, 10, 21, 14, 0, 0, TimeSpan.Zero);

        private static RateLimitDecision Decide(VisitorUsage? visitor, int globalCount = 0, DateTimeOffset? now = null) =>
            RateLimitPolicy.Decide(Limits, visitor, globalCount, now ?? Now);

        private static int RetryAfterSecondsOf(RateLimitDecision decision) => decision.Should().BeOfType<RateLimitDecision.Denied>().Subject.RetryAfterSeconds;

        [Fact]
        public void The_default_limits_are_5_a_minute_30_a_day_and_300_a_day_in_total() =>
            new RateLimits().Should().Be(Limits);

        [Fact]
        public void A_visitors_first_request_is_allowed_and_starts_their_counts() =>
            Decide(visitor: null, globalCount: 7).Should().Be(new RateLimitDecision.Allowed(new VisitorUsage(DayCount: 1, MinuteStart: Now, MinuteCount: 1), GlobalCount: 8));

        [Fact]
        public void Requests_under_the_minute_limit_are_allowed_and_counted()
        {
            var minuteStart = Now.AddSeconds(-20);

            Decide(new VisitorUsage(DayCount: 9, minuteStart, MinuteCount: 4)).Should().Be(new RateLimitDecision.Allowed(new VisitorUsage(10, minuteStart, 5), GlobalCount: 1));
        }

        [Fact]
        public void A_request_over_the_minute_limit_waits_for_the_minute_to_end() =>
            RetryAfterSecondsOf(Decide(new VisitorUsage(DayCount: 5, Now.AddSeconds(-20), MinuteCount: 5))).Should().Be(40);

        [Fact]
        public void A_new_minute_starts_a_new_minute_count() =>
            Decide(new VisitorUsage(DayCount: 5, Now.AddSeconds(-60), MinuteCount: 5)).Should().Be(new RateLimitDecision.Allowed(new VisitorUsage(6, Now, 1), GlobalCount: 1));

        [Fact]
        public void A_request_over_the_daily_limit_waits_until_midnight_utc() =>
            RetryAfterSecondsOf(Decide(new VisitorUsage(DayCount: 30, Now.AddMinutes(-5), MinuteCount: 1))).Should().Be(10 * 60 * 60);

        [Fact]
        public void The_global_daily_cap_turns_everyone_away_until_midnight_utc() =>
            RetryAfterSecondsOf(Decide(visitor: null, globalCount: 300)).Should().Be(10 * 60 * 60);

        [Fact]
        public void When_several_limits_are_hit_the_longest_wait_wins() =>
            RetryAfterSecondsOf(Decide(new VisitorUsage(DayCount: 30, Now.AddSeconds(-20), MinuteCount: 5))).Should().Be(10 * 60 * 60);

        [Fact]
        public void A_wait_is_rounded_up_to_whole_seconds_and_never_zero()
        {
            var justBeforeMidnight = new DateTimeOffset(2026, 10, 21, 23, 59, 59, 500, TimeSpan.Zero);

            RetryAfterSecondsOf(Decide(visitor: null, globalCount: 300, now: justBeforeMidnight)).Should().Be(1);
        }

        [Fact]
        public void Midnight_is_measured_in_utc_whatever_the_offset_of_now()
        {
            var berlinAfternoon = new DateTimeOffset(2026, 10, 21, 16, 0, 0, TimeSpan.FromHours(2));

            RetryAfterSecondsOf(Decide(visitor: null, globalCount: 300, now: berlinAfternoon)).Should().Be(10 * 60 * 60);
        }
    }
}
