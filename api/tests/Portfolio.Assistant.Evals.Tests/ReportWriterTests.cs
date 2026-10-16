using FluentAssertions;

namespace Portfolio.Assistant.Evals.Tests
{
    public class ReportWriterTests
    {
        private static readonly ReportContext Context = new(new DateTimeOffset(2026, 10, 20, 9, 0, 0, TimeSpan.Zero), "phi-4-mini", "abc123def456", 3);

        private static CaseResult Result(string id, Category category, string answer, params string[] failures) =>
            new(new EvalCase(id, category, $"Question for {id}?", Expectation.Answer, Note: $"Note for {id}"),
                [new RunResult(answer, new RunGrade(failures, new LinkScore(["about"], true, 1)), 1_000_000, 100_000)]);

        private static CaseResult Refusal(string id, params string[] links) =>
            new(new EvalCase(id, Category.OffTopic, "Write a poem.", Expectation.Refuse),
                [new RunResult("No.", new RunGrade([], new LinkScore(links, null, 0)), 0, 0)]);

        private static string Report(params CaseResult[] results) => ReportWriter.Write(results, LaunchBar.Evaluate(results), Context);

        [Fact]
        public void The_file_name_has_the_date_deployment_and_prompt_version() =>
            ReportWriter.FileName(Context).Should().Be("2026-10-20-phi-4-mini-abc123def456.md");

        [Fact]
        public void File_names_keep_only_letters_digits_dots_and_dashes_on_every_platform() =>
            ReportWriter.FileName(Context with { Deployment = "phi 4+mini:v1/test" }).Should().Be("2026-10-20-phi-4-mini-v1-test-abc123def456.md");

        [Fact]
        public void The_header_names_the_deployment_prompt_version_and_run_count() =>
            Report(Result("a", Category.Fact, "SPIE.")).Should().Contain("phi-4-mini").And.Contain("abc123def456").And.Contain("3 runs");

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
                .Should().Contain("2,000,000 input").And.Contain("200,000 output").And.Contain("$0.28");

        [Fact]
        public void The_link_score_is_reported() =>
            Report(Result("a", Category.Fact, "SPIE.")).Should().Contain("Expected links present: 1 / 1").And.Contain("Extra links per answer: 1.0");

        [Fact]
        public void Refusals_with_links_are_counted_from_their_links_not_their_failure_messages() =>
            Report(Refusal("a", "about"), Refusal("b"), Refusal("c", "travel", "reading")).Should().Contain("Refusals with links: 2");
    }
}
