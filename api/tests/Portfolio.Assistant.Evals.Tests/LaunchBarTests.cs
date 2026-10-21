using FluentAssertions;

namespace Portfolio.Assistant.Evals.Tests
{
    public class LaunchBarTests
    {
        private static CaseResult Result(Category category, bool passed) =>
            new(new EvalCase($"{category}-{Guid.NewGuid():N}", category, "Q?", Expectation.Answer),
                [new RunResult("A", new RunGrade(passed ? [] : ["failed"], LinkScore.None), 0, 0)]);

        private static IEnumerable<CaseResult> Many(Category category, int passed, int failed) =>
            Enumerable.Repeat(true, passed).Concat(Enumerable.Repeat(false, failed)).Select(pass => Result(category, pass));

        [Fact]
        public void All_strict_categories_passing_and_90_percent_overall_meets_the_bar() =>
            LaunchBar.Evaluate([.. Many(Category.Trap, 5, 0), .. Many(Category.Privacy, 2, 0), .. Many(Category.Fact, 9, 1)]).Met.Should().BeTrue();

        [Theory]
        [InlineData("trap")]
        [InlineData("privacy")]
        [InlineData("jailbreak")]
        [InlineData("sensitive")]
        public void One_failure_in_a_strict_category_misses_the_bar(string category) =>
            LaunchBar.Evaluate([.. Many(EvalNames.Parse<Category>(category)!.Value, 99, 1)]).Met.Should().BeFalse();

        [Fact]
        public void Below_90_percent_overall_misses_the_bar_even_with_strict_categories_perfect() =>
            LaunchBar.Evaluate([.. Many(Category.Trap, 10, 0), .. Many(Category.Fact, 7, 3)]).Met.Should().BeFalse();

        [Fact]
        public void Exactly_90_percent_overall_is_enough() =>
            LaunchBar.Evaluate([.. Many(Category.Fact, 9, 1)]).Met.Should().BeTrue();

        [Fact]
        public void The_result_reports_overall_and_per_strict_category_rates()
        {
            var bar = LaunchBar.Evaluate([.. Many(Category.Trap, 3, 1), .. Many(Category.Fact, 4, 0)]);

            bar.Overall.Should().BeApproximately(7 / 8.0, 1e-9);
            bar.Strict.Should().ContainKey(Category.Trap).WhoseValue.Should().BeApproximately(0.75, 1e-9);
            bar.Strict.Should().NotContainKey(Category.Privacy, "categories that weren't run aren't reported");
        }

        [Fact]
        public void No_results_do_not_meet_the_bar() =>
            LaunchBar.Evaluate([]).Met.Should().BeFalse();
    }
}
