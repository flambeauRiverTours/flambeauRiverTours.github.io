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

        private static QuestionLogEntry For(AskOutcome outcome) =>
            QuestionLogEntry.For(outcome, "trace-1", Now, TimeSpan.FromMilliseconds(1234.6), "claude-haiku-5-5", "5b0f371dd542");

        [Fact]
        public void An_answer_logs_the_question_the_history_length_the_reply_its_link_ids_and_the_tokens()
        {
            var answered = new AskOutcome.Answered(Ask, new ModelAnswer("Epic.\nLinks: experience-spie", 900, 12), new AnswerWithLinks("Epic.", [Spie]));

            For(answered).Should().BeEquivalentTo(new QuestionLogEntry(Now, "trace-1", "ok", "claude-haiku-5-5", "5b0f371dd542", LatencyMs: 1235)
            {
                Question = "And before?",
                HistoryTurns = 2,
                Answer = "Epic.",
                Links = ["experience-spie"],
                InputTokens = 900,
                OutputTokens = 12,
            });
        }

        [Fact]
        public void A_filtered_answer_is_logged_as_filtered()
        {
            var filtered = new AskOutcome.Answered(Ask, new ModelAnswer(ModelAnswer.FilteredReply, 88, 0, Filtered: true), new AnswerWithLinks("Sorry.", []));

            var entry = For(filtered);

            entry.Outcome.Should().Be("filtered");
            entry.Question.Should().Be("And before?");
            entry.Answer.Should().Be("Sorry.");
        }

        [Fact]
        public void A_model_error_logs_the_question_but_no_answer_or_tokens()
        {
            var entry = For(new AskOutcome.ModelError(Ask));

            entry.Outcome.Should().Be("model_error");
            entry.Question.Should().Be("And before?");
            entry.HistoryTurns.Should().Be(2);
            entry.Answer.Should().BeNull();
            entry.Links.Should().BeNull();
            entry.InputTokens.Should().BeNull();
        }

        public static TheoryData<AskOutcome, string> Refusals => new()
        {
            { new AskOutcome.Invalid("question is required."), "invalid" },
            { new AskOutcome.RateLimited(55), "rate_limited" },
        };

        [Theory]
        [MemberData(nameof(Refusals))]
        public void A_turned_away_request_logs_only_its_outcome_and_timing(AskOutcome outcome, string logged) =>
            For(outcome).Should().BeEquivalentTo(new QuestionLogEntry(Now, "trace-1", logged, "claude-haiku-5-5", "5b0f371dd542", LatencyMs: 1235));

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

            var line = For(answered).ToJsonLine();

            line.Should().NotContain("\n").And.Contain("Jack's at SPIE.\\nSince 2024 – in Berlin.");
            JsonDocument.Parse(line).RootElement.EnumerateObject().Select(property => property.Name).Should().Equal(
                "timestamp", "requestId", "outcome", "deployment", "promptVersion", "latencyMs", "question", "historyTurns", "answer", "links", "inputTokens", "outputTokens");
            JsonDocument.Parse(For(new AskOutcome.RateLimited(55)).ToJsonLine()).RootElement.EnumerateObject().Should().HaveCount(6);
        }
    }
}
