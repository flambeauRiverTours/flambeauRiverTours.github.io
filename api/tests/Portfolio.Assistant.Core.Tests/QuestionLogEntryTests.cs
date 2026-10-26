using System.Text.Json;
using FluentAssertions;

namespace Portfolio.Assistant.Core.Tests
{
    public class QuestionLogEntryTests
    {
        private static readonly DateTimeOffset Now = new(2026, 10, 21, 14, 0, 0, TimeSpan.Zero);
        private static readonly LinkTarget Spie = new("experience-spie", "Experience › Senior Software Engineer");

        private static readonly AskValidation.Valid Ask = new(
            "And before?",
            [new ChatMessage(ChatRole.User, "Where does Jack work?"), new ChatMessage(ChatRole.Assistant, "SPIE.")]);

        private static QuestionLogEntry? For(AskOutcome outcome) =>
            QuestionLogEntry.For(outcome, "trace-1", Now, TimeSpan.FromMilliseconds(1234.6), "claude-haiku-5-5", "5b0f371dd542");

        [Fact]
        public void An_answer_logs_the_question_the_history_length_the_reply_its_link_ids_and_the_tokens()
        {
            var answer = new ModelAnswer("Epic.\nLinks: experience-spie", 900, 12) { CacheReadTokens = 850, CacheWriteTokens = 0 };
            var answered = new AskOutcome.Answered(Ask, answer, new AnswerWithLinks("Epic.", [Spie]));

            For(answered).Should().BeEquivalentTo(new QuestionLogEntry(Now, "trace-1", "ok", "claude-haiku-5-5", "5b0f371dd542", LatencyMs: 1235)
            {
                Question = "And before?",
                HistoryTurns = 2,
                Answer = "Epic.",
                Links = ["experience-spie"],
                InputTokens = 900,
                CacheReadTokens = 850,
                CacheWriteTokens = 0,
                OutputTokens = 12,
            });
        }

        [Fact]
        public void An_answer_cut_off_at_the_token_limit_is_logged_as_truncated()
        {
            var truncated = new AskOutcome.Answered(Ask, new ModelAnswer("Jack has", 900, 400) { Truncated = true }, new AnswerWithLinks("Jack has…", []));

            var entry = For(truncated);

            entry!.Outcome.Should().Be("truncated");
            entry.Answer.Should().Be("Jack has…");
        }

        [Fact]
        public void A_question_the_visitor_left_before_the_answer_is_logged_as_cancelled()
        {
            var entry = For(new AskOutcome.Cancelled(Ask));

            entry!.Outcome.Should().Be("cancelled");
            entry.Question.Should().Be("And before?");
            entry.Answer.Should().BeNull();
        }

        [Fact]
        public void A_filtered_answer_is_logged_as_filtered()
        {
            var filtered = new AskOutcome.Answered(Ask, new ModelAnswer(ModelAnswer.FilteredReply, 88, 0, Filtered: true), new AnswerWithLinks("Sorry.", []));

            var entry = For(filtered);

            entry!.Outcome.Should().Be("filtered");
            entry.Question.Should().Be("And before?");
            entry.Answer.Should().Be("Sorry.");
        }

        [Fact]
        public void A_model_error_logs_the_question_but_no_answer_or_tokens()
        {
            var entry = For(new AskOutcome.ModelError(Ask));

            entry!.Outcome.Should().Be("model_error");
            entry.Question.Should().Be("And before?");
            entry.HistoryTurns.Should().Be(2);
            entry.Answer.Should().BeNull();
            entry.Links.Should().BeNull();
            entry.InputTokens.Should().BeNull();
        }

        public static TheoryData<AskOutcome> TurnedAway => new()
        {
            new AskOutcome.Invalid("question is required."),
            new AskOutcome.RateLimited(55),
            new AskOutcome.CountFailed(),
        };

        // they carry no question, and a flood of them would fill the day's append blob (50,000 blocks);
        // App Insights already records each as a request with its status code
        [Theory]
        [MemberData(nameof(TurnedAway))]
        public void A_request_turned_away_before_the_model_isnt_logged(AskOutcome outcome) =>
            For(outcome).Should().BeNull();

        [Theory]
        [InlineData("2026-10-21T14:00:00+00:00", "2026/10/21.jsonl")]
        [InlineData("2026-10-21T23:30:00-05:00", "2026/10/22.jsonl")]
        [InlineData("2026-01-02T00:00:00+00:00", "2026/01/02.jsonl")]
        public void Each_utc_day_has_its_own_blob(string timestamp, string path) =>
            QuestionLogEntry.BlobPath(DateTimeOffset.Parse(timestamp, System.Globalization.CultureInfo.InvariantCulture)).Should().Be(path);

        [Fact]
        public void An_entry_is_one_line_of_camel_case_json_without_empty_fields()
        {
            var answered = new AskOutcome.Answered(Ask, new ModelAnswer("x", 900, 12), new AnswerWithLinks("Jack's at SPIE.\nSince 2024 – in Berlin.", [Spie]));

            var line = For(answered)!.ToJsonLine();

            line.Should().NotContain("\n").And.Contain("Jack's at SPIE.\\nSince 2024 – in Berlin.");
            JsonDocument.Parse(line).RootElement.EnumerateObject().Select(property => property.Name).Should().Equal(
                "timestamp", "requestId", "outcome", "deployment", "promptVersion", "latencyMs", "question", "historyTurns", "answer", "links",
                "inputTokens", "cacheReadTokens", "cacheWriteTokens", "outputTokens");
            JsonDocument.Parse(For(new AskOutcome.ModelError(Ask))!.ToJsonLine()).RootElement.EnumerateObject().Should().HaveCount(8);
        }

        [Fact]
        public void A_line_reads_back_as_the_entry_that_wrote_it()
        {
            var answered = For(new AskOutcome.Answered(Ask, new ModelAnswer("x", 900, 12) { CacheReadTokens = 850 }, new AnswerWithLinks("Epic.", [Spie])))!;
            var failed = For(new AskOutcome.ModelError(Ask))!;

            QuestionLogEntry.FromJsonLine(answered.ToJsonLine()).Should().BeEquivalentTo(answered);
            QuestionLogEntry.FromJsonLine(failed.ToJsonLine()).Should().BeEquivalentTo(failed);
        }

        // one damaged line shouldn't hide the rest of the day
        [Theory]
        [InlineData("")]
        [InlineData("not json")]
        [InlineData("{\"timestamp\":\"2026-10-21T14:00:00+00:00\"")]
        [InlineData("{\"requestId\":\"trace-1\"}")]
        [InlineData("[1,2]")]
        public void A_line_that_isnt_a_whole_entry_reads_as_null(string line) =>
            QuestionLogEntry.FromJsonLine(line).Should().BeNull();

        [Fact]
        public void A_utc_day_names_the_same_blob_as_any_moment_in_it() =>
            QuestionLogEntry.BlobPath(new DateOnly(2026, 10, 21)).Should().Be(QuestionLogEntry.BlobPath(Now));
    }
}
