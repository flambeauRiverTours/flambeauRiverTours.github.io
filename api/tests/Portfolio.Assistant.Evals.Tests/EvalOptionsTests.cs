using FluentAssertions;

namespace Portfolio.Assistant.Evals.Tests
{
    public class EvalOptionsTests
    {
        [Fact]
        public void No_arguments_give_the_defaults() =>
            EvalOptions.Parse([]).Should().Be(new EvalOptions());

        [Fact]
        public void Every_option_is_read()
        {
            var options = EvalOptions.Parse(["--self-test", "--deployment", "haiku-test", "--runs", "1", "--parallel", "5", "--category", "trap,privacy", "--id", "a,b"]);

            options.SelfTest.Should().BeTrue();
            options.Deployment.Should().Be("haiku-test");
            options.Runs.Should().Be(1);
            options.Parallelism.Should().Be(5);
            options.Categories.Should().Equal(Category.Trap, Category.Privacy);
            options.Ids.Should().Equal("a", "b");
        }

        [Theory]
        [InlineData("Unknown option: --bogus", "--bogus")]
        [InlineData("Unknown option: --price-in", "--price-in", "0.5")]
        [InlineData("Unknown option: --chat-completions", "--chat-completions")]
        [InlineData("Unknown option: --system-role", "--system-role")]
        [InlineData("--runs needs a value", "--runs")]
        [InlineData("--runs needs a whole number of at least 1", "--runs", "zero")]
        [InlineData("--runs needs a whole number of at least 1", "--runs", "0")]
        [InlineData("--parallel needs a whole number of at least 1", "--parallel", "-1")]
        [InlineData("Unknown category: trapz", "--category", "trapz")]
        public void A_wrong_option_throws_with_a_message_saying_what_is_wrong(string message, params string[] args) =>
            FluentActions.Invoking(() => EvalOptions.Parse(args)).Should().Throw<UsageException>().WithMessage(message);

        [Fact]
        public void By_default_the_runner_evaluates_claude_haiku_5_5() =>
            EvalOptions.Parse([]).Deployment.Should().Be("claude-haiku-5-5");

        [Fact]
        public void Categories_use_the_same_names_as_the_eval_set() =>
            EvalOptions.Parse(["--category", "multi_hop,off_topic"]).Categories.Should().Equal(Category.MultiHop, Category.OffTopic);

        [Fact]
        public void Filters_select_by_category_or_id()
        {
            var trap = new EvalCase("trap-ckad", Category.Trap, "Q?", Expectation.Idk);
            var fact = new EvalCase("current-employer", Category.Fact, "Q?", Expectation.Answer);

            EvalOptions.Parse([]).Selects(fact).Should().BeTrue();
            EvalOptions.Parse(["--category", "trap"]).Selects(trap).Should().BeTrue();
            EvalOptions.Parse(["--category", "trap"]).Selects(fact).Should().BeFalse();
            EvalOptions.Parse(["--id", "current-employer"]).Selects(fact).Should().BeTrue();
            EvalOptions.Parse(["--id", "current-employer"]).Selects(trap).Should().BeFalse();
        }

        [Fact]
        public void The_usage_text_lists_every_option() =>
            EvalOptions.Usage.Should().Contain("--self-test").And.Contain("--deployment").And.Contain("--runs").And.Contain("--parallel")
                .And.Contain("--category").And.Contain("--id");
    }
}
