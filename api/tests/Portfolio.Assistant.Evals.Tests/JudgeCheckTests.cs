using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals.Tests
{
    public class JudgeCheckTests
    {
        private static readonly JudgeCheckCase Invented = new("planted", "Q?", "Jack led a team of 12.", Unsupported: true, "planted invention");
        private static readonly JudgeCheckCase Grounded = new("wpf-1", "Q?", "Jack built WPF apps at SPIE.", Unsupported: false, "the FAQ says so");

        [Fact]
        public void The_real_check_set_loads_with_unique_ids_and_a_note_on_every_row()
        {
            var cases = JudgeCheckCase.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "data", "judge-checks.jsonl")));

            cases.Should().HaveCountGreaterThan(30);
            cases.Select(check => check.Id).Should().OnlyHaveUniqueItems();
            cases.Should().OnlyContain(check => check.Question.Length > 0 && check.Answer.Length > 0 && check.Note.Length > 0);
            cases.Should().Contain(check => check.Unsupported).And.Contain(check => !check.Unsupported);
        }

        [Fact]
        public async Task Each_answer_is_judged_once_and_compared_with_its_label()
        {
            var judge = new ScriptedJudge(answer => answer.Contains("12", StringComparison.Ordinal) ? ["a team of 12"] : []);

            var results = await JudgeCheck.RunAsync(judge, [Invented, Grounded], parallelism: 2, TestContext.Current.CancellationToken);

            results.Should().OnlyContain(result => result.Agrees);
            judge.Judged.Should().HaveCount(2);
        }

        [Fact]
        public void The_report_lists_false_positives_and_misses_with_the_judges_words_and_the_reason()
        {
            JudgeCheckResult[] results =
            [
                new(Grounded, new GroundingVerdict(["built WPF apps at SPIE"], 0, 0)),
                new(Invented, new GroundingVerdict([], 0, 0)),
                new(Grounded with { Id = "unjudged" }, new GroundingVerdict(null, 0, 0) { NoVerdictReason = "the judge refused" }),
            ];

            var report = JudgeCheck.Write(results, "claude-sonnet-5-5");

            report.Should().Contain("Agreed: 0 of 3").And.Contain("False positives (1)").And.Contain("Missed (1)").And.Contain("Not judged (1)")
                .And.Contain("wpf-1").And.Contain("built WPF apps at SPIE").And.Contain("the FAQ says so")
                .And.Contain("planted").And.Contain("the judge refused");
        }
    }
}
