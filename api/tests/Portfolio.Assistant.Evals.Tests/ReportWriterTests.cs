using FluentAssertions;

namespace Portfolio.Assistant.Evals.Tests
{
    public class ReportWriterTests
    {
        private static readonly ReportContext Context = new(new DateTimeOffset(2026, 10, 20, 9, 0, 0, TimeSpan.Zero), "claude-haiku-5-5", "abc123def456", 3);

        private static CaseResult Result(string id, Category category, string answer, params string[] failures) =>
            new(new EvalCase(id, category, $"Question for {id}?", Expectation.Answer, Note: $"Note for {id}"),
                [new RunResult(answer, new RunGrade(failures, new LinkScore(["about"], true, 1)), 1_000_000, 100_000)]);

        private static CaseResult Refusal(string id, params string[] links) =>
            new(new EvalCase(id, Category.OffTopic, "Write a poem.", Expectation.Refuse),
                [new RunResult("No.", new RunGrade([], new LinkScore(links, null, 0)), 0, 0)]);

        private static string Report(params CaseResult[] results) => ReportWriter.Write(results, LaunchBar.Evaluate(results), Context);

        [Fact]
        public void The_file_name_has_the_date_deployment_and_prompt_version() =>
            ReportWriter.FileName(Context).Should().Be("2026-10-20-claude-haiku-5-5-abc123def456.md");

        [Fact]
        public void File_names_keep_only_letters_digits_dots_and_dashes_on_every_platform() =>
            ReportWriter.FileName(Context with { Deployment = "claude haiku+5:v1/test" }).Should().Be("2026-10-20-claude-haiku-5-v1-test-abc123def456.md");

        [Fact]
        public void A_file_name_not_yet_taken_is_kept() =>
            ReportWriter.UnusedFileName("2026-10-20-haiku-abc.md", _ => false).Should().Be("2026-10-20-haiku-abc.md");

        [Theory]
        [InlineData("2026-10-20-haiku-abc-2.md", "2026-10-20-haiku-abc.md")]
        [InlineData("2026-10-20-haiku-abc-3.md", "2026-10-20-haiku-abc.md", "2026-10-20-haiku-abc-2.md")]
        public void An_existing_report_is_never_overwritten(string expected, params string[] taken) =>
            ReportWriter.UnusedFileName("2026-10-20-haiku-abc.md", taken.Contains).Should().Be(expected);

        [Fact]
        public void The_header_names_the_deployment_prompt_version_and_run_count() =>
            Report(Result("a", Category.Fact, "SPIE.")).Should().Contain("claude-haiku-5-5").And.Contain("abc123def456").And.Contain("3 runs");

        [Fact]
        public void The_launch_bar_verdict_is_stated()
        {
            Report(Result("a", Category.Fact, "SPIE.")).Should().Contain("Launch bar: met");
            Report(Result("a", Category.Trap, "Jack holds the CKAD.", "known fabrication: CKAD")).Should().Contain("Launch bar: not met");
        }

        [Fact]
        public void Pass_rates_are_listed_by_category_with_the_eval_set_names() =>
            Report(Result("a", Category.Fact, "SPIE."), Result("b", Category.Fact, "Berlin.", "missing required pattern: SPIE"), Result("c", Category.MultiHop, "No."))
                .Should().Contain("| fact | 1 / 2 | 50%").And.Contain("| multi_hop | 1 / 1 | 100%");

        [Fact]
        public void Every_failure_shows_the_question_the_reasons_and_the_full_answer() =>
            Report(Result("b", Category.Fact, "Jack works in Berlin.", "missing required pattern: SPIE"))
                .Should().Contain("### b (fact, expect answer)").And.Contain("Question for b?").And.Contain("Note for b")
                .And.Contain("Run 1: missing required pattern: SPIE").And.Contain("> Jack works in Berlin.");

        [Fact]
        public void Passing_cases_are_not_listed_as_failures() =>
            Report(Result("a", Category.Fact, "Jack works at SPIE.")).Should().NotContain("Jack works at SPIE.");

        [Fact]
        public void Token_totals_and_the_estimated_cost_are_reported() =>
            Report(Result("a", Category.Fact, "SPIE."), Result("b", Category.Fact, "SPIE."))
                .Should().Contain("2,000,000 input").And.Contain("200,000 output").And.Contain("$0.30");

        // a cache read costs a tenth of the input price and a write 1.25 times it
        [Fact]
        public void Cached_tokens_are_reported_and_priced_apart()
        {
            static CaseResult Cached(string id) => new(new EvalCase(id, Category.Fact, "Q?", Expectation.Answer),
                [new RunResult("SPIE.", new RunGrade([], LinkScore.None), 1_000_000, 100_000) { CacheReadTokens = 800_000, CacheWriteTokens = 100_000 }]);

            Report(Cached("a"), Cached("b")).Should().Contain("2,000,000 input (1,600,000 read from the cache, 200,000 written to it)").And.Contain("$0.16");
        }

        [Fact]
        public void The_link_score_is_reported() =>
            Report(Result("a", Category.Fact, "SPIE.")).Should().Contain("Expected links present: 1 / 1").And.Contain("Extra links per answer: 1.0");

        [Fact]
        public void Runs_blocked_by_the_content_filter_are_counted()
        {
            var filtered = new CaseResult(new EvalCase("a", Category.Jailbreak, "Q?", Expectation.Refuse),
                [new RunResult("Sorry.", new RunGrade([], LinkScore.None), 0, 0, Filtered: true), new RunResult("Sorry.", new RunGrade([], LinkScore.None), 0, 0)]);

            Report(filtered).Should().Contain("Blocked by the content filter: 1 run");
        }

        [Fact]
        public void Refusals_with_links_are_counted_from_their_links_not_their_failure_messages() =>
            Report(Refusal("a", "about"), Refusal("b"), Refusal("c", "travel", "reading")).Should().Contain("Refusals with links: 2");
    }
}
