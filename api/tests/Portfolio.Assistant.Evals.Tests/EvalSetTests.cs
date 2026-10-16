using System.Text.Json;
using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals.Tests
{
    /// <summary>
    /// Runs the real eval set's example answers through the full grader, so
    /// the README's patterns and the cases can't drift apart.
    /// </summary>
    public class EvalSetTests
    {
        private static readonly IReadOnlyList<EvalCase> Cases = EvalCaseReader.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "data", "questions.jsonl")));

        private static readonly HashSet<string> LinkIds =
            [.. JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "data", "links.json"))).RootElement.EnumerateArray().Select(link => link.GetProperty("id").GetString()!)];

        private static readonly KnowledgeBase Knowledge = KnowledgeBase.Create("Rules.", "Site", "FAQ", []);

        public static TheoryData<string> CasesWithExamples => [.. Cases.Where(evalCase => evalCase.PassExample is not null).Select(evalCase => evalCase.Id)];

        [Fact]
        public void The_eval_set_loads_with_every_field() =>
            Cases.Should().HaveCountGreaterThan(300).And.OnlyContain(evalCase => evalCase.Id.Length > 0 && evalCase.Question.Length > 0);

        [Theory]
        [MemberData(nameof(CasesWithExamples))]
        public async Task Every_example_answer_passes_the_full_grader(string id)
        {
            var evalCase = Cases.Single(candidate => candidate.Id == id);
            var answer = await new PassExampleModel([evalCase]).AnswerAsync(PromptBuilder.Build(Knowledge, evalCase.HistoryMessages, evalCase.Question), TestContext.Current.CancellationToken);

            new Grader(LinkIds).Grade(evalCase, answer.Text).Failures.Should().BeEmpty();
        }
    }
}
