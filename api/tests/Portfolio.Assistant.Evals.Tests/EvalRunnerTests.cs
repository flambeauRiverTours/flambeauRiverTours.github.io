using System.Collections.Concurrent;
using System.Net;
using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals.Tests
{
    /// <summary>
    /// A model that answers from a script and records every prompt it was sent.
    /// </summary>
    internal sealed class ScriptedModel(Func<Prompt, string> answer) : IAnswerModel
    {
        public ConcurrentBag<Prompt> Prompts { get; } = [];

        public string Deployment => "scripted";

        public Task<ModelAnswer> AnswerAsync(Prompt prompt, CancellationToken cancellationToken)
        {
            Prompts.Add(prompt);
            return Task.FromResult(new ModelAnswer(answer(prompt), 100, 10, Deployment));
        }
    }

    public class EvalRunnerTests
    {
        private static readonly KnowledgeBase Knowledge = KnowledgeBase.Create("Rules.", "Site", "FAQ", []);
        private static readonly Grader Grader = new(new HashSet<string> { "about" });

        private static EvalCase Case(string id, string question = "Where does Jack work?", IReadOnlyList<HistoryMessage>? history = null) =>
            new(id, Category.Fact, question, Expectation.Answer, History: history, MustMatch: ["SPIE"]);

        private static Task<IReadOnlyList<CaseResult>> Run(IAnswerModel model, IReadOnlyList<EvalCase> cases, int runs = 3) =>
            new EvalRunner(model, Knowledge, Grader).RunAsync(cases, runs, parallelism: 2, TestContext.Current.CancellationToken);

        [Fact]
        public async Task Each_case_is_asked_once_per_run()
        {
            var model = new ScriptedModel(_ => "Jack works at SPIE.\nLinks: none");

            var results = await Run(model, [Case("a"), Case("b")], runs: 3);

            results.Should().AllSatisfy(result => result.Runs.Should().HaveCount(3));
            model.Prompts.Should().HaveCount(6);
        }

        [Fact]
        public async Task Results_come_back_in_the_cases_order()
        {
            var results = await Run(new ScriptedModel(_ => "Jack works at SPIE.\nLinks: none"), [Case("a"), Case("b"), Case("c")]);

            results.Select(result => result.Case.Id).Should().Equal("a", "b", "c");
        }

        [Fact]
        public async Task A_case_fails_if_any_run_fails()
        {
            var calls = 0;
            var model = new ScriptedModel(_ => Interlocked.Increment(ref calls) == 2 ? "Jack works in Berlin.\nLinks: none" : "Jack works at SPIE.\nLinks: none");

            var result = (await Run(model, [Case("a")], runs: 3)).Single();

            result.Passed.Should().BeFalse();
            result.Runs.Count(run => run.Grade.Passed).Should().Be(2);
        }

        [Fact]
        public async Task A_model_error_fails_the_run_instead_of_stopping_the_eval()
        {
            var model = new ScriptedModel(_ => throw new HttpRequestException("429 Too Many Requests"));

            var result = (await Run(model, [Case("a")], runs: 1)).Single();

            result.Passed.Should().BeFalse();
            result.Runs.Single().Grade.Failures.Should().ContainSingle(failure => failure.Contains("model error") && failure.Contains("429"));
        }

        [Theory]
        [InlineData(HttpStatusCode.TooManyRequests)]
        [InlineData(HttpStatusCode.ServiceUnavailable)]
        [InlineData(null)]
        public async Task A_transient_model_error_fails_only_that_run(HttpStatusCode? status)
        {
            var model = new ScriptedModel(_ => throw new HttpRequestException("call failed", null, status));

            var result = (await Run(model, [Case("a")], runs: 1)).Single();

            result.Runs.Single().Grade.Failures.Should().ContainSingle(failure => failure.Contains("model error"));
        }

        [Fact]
        public async Task A_timeout_fails_only_that_run()
        {
            var result = (await Run(new ScriptedModel(_ => throw new TimeoutException("slow")), [Case("a")], runs: 1)).Single();

            result.Passed.Should().BeFalse();
        }

        [Theory]
        [InlineData(HttpStatusCode.Unauthorized)]
        [InlineData(HttpStatusCode.NotFound)]
        public async Task A_permanent_model_error_stops_the_eval(HttpStatusCode status)
        {
            var model = new ScriptedModel(_ => throw new HttpRequestException("call failed", null, status));

            await FluentActions.Awaiting(() => Run(model, [Case("a")], runs: 1)).Should().ThrowAsync<HttpRequestException>();
        }

        [Fact]
        public async Task A_bug_stops_the_eval_instead_of_being_reported_as_a_model_error()
        {
            var model = new ScriptedModel(_ => throw new InvalidOperationException("bug"));

            await FluentActions.Awaiting(() => Run(model, [Case("a")], runs: 1)).Should().ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task The_prompt_has_the_knowledge_the_history_and_the_question()
        {
            var model = new ScriptedModel(_ => "SPIE.\nLinks: none");
            var history = new[] { new HistoryMessage("user", "Where does Jack work?"), new HistoryMessage("assistant", "At SPIE.") };

            await Run(model, [Case("a", question: "And before that?", history: history)], runs: 1);

            var prompt = model.Prompts.Single();
            prompt.System.Should().Be(Knowledge.SystemMessage);
            prompt.Messages.Select(message => (message.Role, message.Content)).Should().Equal(
                (ChatRole.User, "Where does Jack work?"), (ChatRole.Assistant, "At SPIE."), (ChatRole.User, "And before that?"));
        }

        [Fact]
        public async Task Token_counts_are_kept_per_run()
        {
            var result = (await Run(new ScriptedModel(_ => "SPIE.\nLinks: none"), [Case("a")], runs: 1)).Single();

            result.Runs.Single().InputTokens.Should().Be(100);
            result.Runs.Single().OutputTokens.Should().Be(10);
        }
    }
}
