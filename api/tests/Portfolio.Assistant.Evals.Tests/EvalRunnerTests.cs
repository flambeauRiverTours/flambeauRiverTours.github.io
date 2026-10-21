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
            return Task.FromResult(new ModelAnswer(answer(prompt), 100, 10));
        }
    }

    /// <summary>
    /// A model whose content filter blocks every question.
    /// </summary>
    internal sealed class FilteringModel : IAnswerModel
    {
        public string Deployment => "filtering";

        public Task<ModelAnswer> AnswerAsync(Prompt prompt, CancellationToken cancellationToken) =>
            Task.FromResult(new ModelAnswer(ModelAnswer.FilteredReply, 0, 0, Filtered: true));
    }

    /// <summary>
    /// A model that never answers the questions it is told to hang on, like a call on a dead connection.
    /// </summary>
    internal sealed class HangingModel(Func<Prompt, bool> hangs, bool ignoresCancellation = false) : IAnswerModel
    {
        public string Deployment => "hanging";

        public async Task<ModelAnswer> AnswerAsync(Prompt prompt, CancellationToken cancellationToken)
        {
            if (hangs(prompt))
            {
                await Task.Delay(Timeout.Infinite, ignoresCancellation ? CancellationToken.None : cancellationToken);
            }

            return new ModelAnswer("Jack works at SPIE.\nLinks: none", 100, 10);
        }
    }

    public class EvalRunnerTests
    {
        private static readonly KnowledgeBase Knowledge = KnowledgeBase.Create("Rules.", "Site", "FAQ", []);
        private static readonly Grader Grader = new(new HashSet<string> { "about" });
        private static readonly Func<Prompt, bool> SlowQuestion = prompt => prompt.Messages[^1].Content == "Slow?";

        private static EvalCase Case(string id, string question = "Where does Jack work?", IReadOnlyList<HistoryMessage>? history = null) =>
            new(id, Category.Fact, question, Expectation.Answer, History: history, MustMatch: ["SPIE"]);

        // a 2-minute deadline cut off 6 throttled but healthy calls in a full run on 2026-10-20;
        // the runner allows 8 attempts of up to 30 s each, plus the Retry-After waits between them
        [Fact]
        public void The_default_deadline_outlasts_the_sdks_own_retries() =>
            EvalRunner.DefaultCallTimeout.Should().BeGreaterThan(TimeSpan.FromSeconds(30) * 8);

        private static Task<IReadOnlyList<CaseResult>> Run(IAnswerModel model, IReadOnlyList<EvalCase> cases, int runs = 3) =>
            new EvalRunner(model, Knowledge, Grader).RunAsync(cases, runs, parallelism: 2, TestContext.Current.CancellationToken);

        private static Task<IReadOnlyList<CaseResult>> RunWithDeadline(IAnswerModel model, IReadOnlyList<EvalCase> cases, CancellationToken cancellationToken) =>
            new EvalRunner(model, Knowledge, Grader, callTimeout: TimeSpan.FromMilliseconds(100)).RunAsync(cases, runs: 1, parallelism: 2, cancellationToken);

        private static async Task<string[]> ProgressLines(string answer, int calls)
        {
            var progress = new StringWriter();
            await new EvalRunner(new ScriptedModel(_ => answer), Knowledge, Grader, progress)
                .RunAsync([Case("a")], calls, parallelism: 4, TestContext.Current.CancellationToken);
            return progress.ToString().Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries);
        }

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
        public async Task An_answer_blocked_by_the_content_filter_is_marked_as_filtered()
        {
            var model = new FilteringModel();

            var run = (await Run(model, [Case("a")], runs: 1)).Single().Runs.Single();

            run.Filtered.Should().BeTrue();
            run.Raw.Should().Be(ModelAnswer.FilteredReply);
        }

        [Fact]
        public async Task A_call_that_never_returns_fails_as_timed_out_instead_of_hanging()
        {
            var run = (await RunWithDeadline(new HangingModel(_ => true), [Case("a")], TestContext.Current.CancellationToken)).Single().Runs.Single();

            run.Grade.Passed.Should().BeFalse();
            run.Grade.Failures.Should().ContainSingle(failure => failure.Contains("timed out after"));
        }

        [Fact]
        public async Task A_call_that_ignores_cancellation_still_times_out()
        {
            var model = new HangingModel(_ => true, ignoresCancellation: true);

            var run = (await RunWithDeadline(model, [Case("a")], TestContext.Current.CancellationToken)).Single().Runs.Single();

            run.Grade.Failures.Should().ContainSingle(failure => failure.Contains("timed out after"));
        }

        [Fact]
        public async Task A_timed_out_call_does_not_cancel_the_other_runs()
        {
            var results = await RunWithDeadline(new HangingModel(SlowQuestion), [Case("slow", question: "Slow?"), Case("a"), Case("b")], TestContext.Current.CancellationToken);

            results.Select(result => result.Passed).Should().Equal(false, true, true);
        }

        [Fact]
        public async Task Cancelling_the_eval_stops_every_call_instead_of_timing_them_out()
        {
            using var cancellation = CancellationTokenSource.CreateLinkedTokenSource(TestContext.Current.CancellationToken);
            cancellation.CancelAfter(TimeSpan.FromMilliseconds(50));
            var runner = new EvalRunner(new HangingModel(_ => true), Knowledge, Grader);

            await FluentActions.Awaiting(() => runner.RunAsync([Case("a"), Case("b")], runs: 1, parallelism: 2, cancellation.Token))
                .Should().ThrowAsync<OperationCanceledException>();
        }

        [Fact]
        public async Task Progress_is_printed_every_50_calls_and_at_the_end() =>
            (await ProgressLines("Jack works at SPIE.\nLinks: none", calls: 120))
                .Should().Equal("50 / 120 calls done (0 failed)", "100 / 120 calls done (0 failed)", "120 / 120 calls done (0 failed)");

        [Fact]
        public async Task Progress_counts_the_failed_runs() =>
            (await ProgressLines("Jack works in Berlin.\nLinks: none", calls: 60))
                .Should().Equal("50 / 60 calls done (50 failed)", "60 / 60 calls done (60 failed)");

        [Fact]
        public async Task Token_counts_are_kept_per_run()
        {
            var result = (await Run(new ScriptedModel(_ => "SPIE.\nLinks: none"), [Case("a")], runs: 1)).Single();

            result.Runs.Single().InputTokens.Should().Be(100);
            result.Runs.Single().OutputTokens.Should().Be(10);
        }

        private static Task<IReadOnlyList<CaseResult>> RunJudged(IAnswerModel model, IGroundingJudge judge, IReadOnlyList<EvalCase> cases) =>
            new EvalRunner(model, Knowledge, Grader, judge: judge).RunAsync(cases, runs: 1, parallelism: 2, TestContext.Current.CancellationToken);

        // the judge sees what a visitor would: the answer without its Links line
        [Fact]
        public async Task The_judge_checks_the_answer_the_visitor_sees()
        {
            var judge = new ScriptedJudge(_ => []);

            await RunJudged(new ScriptedModel(_ => "Jack works at SPIE.\nLinks: about"), judge, [Case("a")]);

            judge.Judged.Should().ContainSingle().Which.Should().Be(("Where does Jack work?", "Jack works at SPIE."));
        }

        [Fact]
        public async Task An_answer_with_an_unsupported_claim_fails_its_run_naming_the_claim()
        {
            var judge = new ScriptedJudge(_ => ["led a team of 12"]);

            var run = (await RunJudged(new ScriptedModel(_ => "Jack works at SPIE, where he led a team of 12.\nLinks: none"), judge, [Case("a")])).Single().Runs.Single();

            run.Grade.Failures.Should().ContainSingle().Which.Should().Be("unsupported claim: led a team of 12");
            run.Grounding!.Unsupported.Should().Equal("led a team of 12");
        }

        [Fact]
        public async Task A_grounded_answer_still_passes()
        {
            var run = (await RunJudged(new ScriptedModel(_ => "Jack works at SPIE.\nLinks: none"), new ScriptedJudge(_ => []), [Case("a")])).Single().Runs.Single();

            run.Grade.Passed.Should().BeTrue();
            run.Grounding!.InputTokens.Should().Be(5000);
        }

        // nothing a visitor sees comes from the model when the filter blocks it, and a failed call has no answer
        [Fact]
        public async Task Filtered_and_failed_answers_arent_judged()
        {
            var judge = new ScriptedJudge(_ => ["anything"]);

            await RunJudged(new FilteringModel(), judge, [Case("a")]);
            await RunJudged(new ScriptedModel(_ => throw new HttpRequestException("429")), judge, [Case("b")]);

            judge.Judged.Should().BeEmpty();
        }

        // the judge can be throttled or refuse too; that says nothing about the answer, so the run is only marked unjudged
        [Fact]
        public async Task A_judge_that_fails_or_gives_no_verdict_leaves_the_run_unjudged_not_failed()
        {
            var throttled = new ScriptedJudge(_ => throw new HttpRequestException("429", null, HttpStatusCode.TooManyRequests));
            var declined = new ScriptedJudge(_ => null);

            var first = (await RunJudged(new ScriptedModel(_ => "Jack works at SPIE.\nLinks: none"), throttled, [Case("a")])).Single().Runs.Single();
            var second = (await RunJudged(new ScriptedModel(_ => "Jack works at SPIE.\nLinks: none"), declined, [Case("a")])).Single().Runs.Single();

            first.Grade.Passed.Should().BeTrue();
            first.Grounding!.Unsupported.Should().BeNull();
            first.Grounding.NoVerdictReason.Should().Be("the judge's call failed (429)");
            second.Grade.Passed.Should().BeTrue();
            second.Grounding!.Unsupported.Should().BeNull();
        }

        // the judge is slower than the model; unlimited, its calls piled up and were throttled (78 unjudged runs on 2026-10-21)
        [Fact]
        public async Task Judge_calls_are_limited_to_the_same_parallelism_as_model_calls()
        {
            var judge = new SlowJudge();
            EvalCase[] cases = [.. Enumerable.Range(0, 8).Select(index => Case($"case-{index}"))];

            await new EvalRunner(new ScriptedModel(_ => "Jack works at SPIE.\nLinks: none"), Knowledge, Grader, judge: judge)
                .RunAsync(cases, runs: 1, parallelism: 2, TestContext.Current.CancellationToken);

            judge.MostAtOnce.Should().BeLessThanOrEqualTo(2);
        }

        [Fact]
        public async Task Without_a_judge_no_run_has_a_grounding_verdict() =>
            (await Run(new ScriptedModel(_ => "Jack works at SPIE.\nLinks: none"), [Case("a")], runs: 1)).Single().Runs.Single().Grounding.Should().BeNull();
    }

    /// <summary>
    /// A judge that takes a moment over each answer and records the most calls it had at once.
    /// </summary>
    internal sealed class SlowJudge : IGroundingJudge
    {
        private int atOnce;
        private int mostAtOnce;

        public int MostAtOnce => mostAtOnce;

        public string Deployment => "slow-judge";

        public async Task<GroundingVerdict> JudgeAsync(string question, string answer, CancellationToken cancellationToken)
        {
            var now = Interlocked.Increment(ref atOnce);
            InterlockedMax(ref mostAtOnce, now);
            await Task.Delay(50, cancellationToken);
            Interlocked.Decrement(ref atOnce);
            return new GroundingVerdict([], 0, 0);
        }

        private static void InterlockedMax(ref int target, int value)
        {
            int current;
            while (value > (current = Volatile.Read(ref target)) && Interlocked.CompareExchange(ref target, value, current) != current)
            {
            }
        }
    }

    /// <summary>
    /// A judge that returns scripted unsupported claims for each answer and records what it was asked.
    /// </summary>
    internal sealed class ScriptedJudge(Func<string, IReadOnlyList<string>?> unsupported) : IGroundingJudge
    {
        public ConcurrentBag<(string Question, string Answer)> Judged { get; } = [];

        public string Deployment => "scripted-judge";

        public Task<GroundingVerdict> JudgeAsync(string question, string answer, CancellationToken cancellationToken)
        {
            Judged.Add((question, answer));
            return Task.FromResult(new GroundingVerdict(unsupported(answer), 5000, 20));
        }
    }
}
