using FluentAssertions;

namespace Portfolio.Assistant.Core.Tests
{
    public class ModelPriceTests
    {
        [Fact]
        public void Uncached_input_and_output_are_priced_per_million_tokens() =>
            ModelPrice.ClaudeHaiku55.Cost(new TokenUsage(Input: 2_000_000, CacheRead: 0, CacheWrite: 0, Output: 200_000)).Should().Be(0.30m);

        // cache reads cost a tenth of the input price and cache writes a quarter more
        [Fact]
        public void Input_read_from_or_written_to_the_cache_is_priced_at_its_own_rate() =>
            ModelPrice.ClaudeHaiku55.Cost(new TokenUsage(Input: 1_000_000, CacheRead: 800_000, CacheWrite: 100_000, Output: 100_000))
                .Should().Be(0.0805m);

        [Fact]
        public void The_judge_is_priced_at_sonnets_rates() =>
            ModelPrice.ClaudeSonnet55.Cost(new TokenUsage(Input: 1_000_000, CacheRead: 0, CacheWrite: 0, Output: 100_000)).Should().Be(3.00m);

        [Fact]
        public void Usages_add_field_by_field() =>
            (new TokenUsage(10, 5, 1, 2) + new TokenUsage(20, 6, 0, 3)).Should().Be(new TokenUsage(30, 11, 1, 5));
    }
}
