using System.Text.Json;
using FluentAssertions;

namespace Portfolio.Assistant.Core.Tests
{
    public class DailySummaryTests
    {
        private static readonly DateOnly Day = new(2026, 10, 25);
        private static readonly DateTimeOffset Morning = new(2026, 10, 25, 9, 0, 0, TimeSpan.Zero);

        private static QuestionLogEntry Entry(string requestId, string outcome = "ok", long latencyMs = 2000, string promptVersion = "3479c80c4da0") =>
            new(Morning, requestId, outcome, "claude-haiku-5-5", promptVersion, latencyMs)
            {
                Question = $"Question {requestId}?",
                HistoryTurns = 0,
                Answer = outcome == "ok" ? $"Answer {requestId}." : null,
            };

        private static QuestionLogEntry Answered(string requestId, int input, int cacheRead, int cacheWrite, int output) =>
            Entry(requestId) with { InputTokens = input, CacheReadTokens = cacheRead, CacheWriteTokens = cacheWrite, OutputTokens = output };

        private static DailySummary Summarise(params QuestionLogEntry[] entries) => DailySummary.From(Day, entries.Select(entry => entry.ToJsonLine()));

        [Fact]
        public void Each_outcome_is_counted_most_common_first()
        {
            var summary = Summarise(Entry("a"), Entry("b"), Entry("c", "filtered"), Entry("d", "ok"), Entry("e", "model_error"), Entry("f", "filtered"));

            summary.Questions.Should().Be(6);
            summary.Outcomes.Should().Equal(new DailySummary.OutcomeCount("ok", 3), new DailySummary.OutcomeCount("filtered", 2), new DailySummary.OutcomeCount("model_error", 1));
        }

        [Fact]
        public void Every_entry_that_isnt_ok_needs_a_look_in_the_order_it_was_logged()
        {
            var summary = Summarise(Entry("a"), Entry("b", "truncated", 5000), Entry("c"), Entry("d", "cancelled", 900));

            summary.NeedsALook.Should().Equal(new DailySummary.Request("b", "truncated", 5000), new DailySummary.Request("d", "cancelled", 900));
        }

        [Fact]
        public void Questions_asked_mid_conversation_are_counted() =>
            Summarise(Entry("a"), Entry("b") with { HistoryTurns = 2 }, Entry("c") with { HistoryTurns = 4 }).MidConversation.Should().Be(2);

        [Fact]
        public void Tokens_are_totalled_and_priced_at_haikus_rates()
        {
            var summary = Summarise(Answered("a", 600_000, 500_000, 0, 60_000), Answered("b", 400_000, 300_000, 100_000, 40_000), Entry("c", "model_error"));

            summary.Tokens.Should().Be(new TokenUsage(1_000_000, 800_000, 100_000, 100_000));
            summary.EstimatedCost.Should().Be(0.0805m);
        }

        [Fact]
        public void The_median_and_the_three_slowest_requests_are_reported()
        {
            var summary = Summarise(Entry("a", latencyMs: 1000), Entry("b", latencyMs: 9000), Entry("c", latencyMs: 3000), Entry("d", latencyMs: 7000), Entry("e", latencyMs: 2000));

            summary.MedianLatencyMs.Should().Be(3000);
            summary.Slowest.Select(request => request.RequestId).Should().Equal("b", "d", "c");
        }

        [Fact]
        public void An_even_day_takes_the_middle_two_latencies_mean() =>
            Summarise(Entry("a", latencyMs: 1000), Entry("b", latencyMs: 2000), Entry("c", latencyMs: 4000), Entry("d", latencyMs: 9000)).MedianLatencyMs.Should().Be(3000);

        // a deploy during the day shows two
        [Fact]
        public void Each_prompt_version_seen_is_listed_once_in_the_order_seen() =>
            Summarise(Entry("a", promptVersion: "old"), Entry("b", promptVersion: "new"), Entry("c", promptVersion: "old"))
                .PromptVersions.Should().Equal("old", "new");

        [Fact]
        public void A_line_that_cant_be_read_is_counted_and_needs_a_look_without_hiding_the_rest()
        {
            var summary = DailySummary.From(Day, [Entry("a").ToJsonLine(), "{broken", "", Entry("b").ToJsonLine()]);

            summary.Questions.Should().Be(2);
            summary.Unreadable.Should().Be(1);
            DailySummaryEmail.For(summary, "stexample").Subject.Should().Contain("1 needs a look");
        }

        [Fact]
        public void The_subject_gives_the_day_the_count_and_how_many_need_a_look()
        {
            DailySummaryEmail.For(Summarise(Entry("a"), Entry("b", "filtered"), Entry("c")), "stexample").Subject
                .Should().Be("Assistant, 2026-10-25: 3 questions (1 needs a look)");
            DailySummaryEmail.For(Summarise(Entry("a")), "stexample").Subject.Should().Be("Assistant, 2026-10-25: 1 question");
        }

        [Fact]
        public void The_email_says_how_to_read_the_days_questions_in_the_portal_and_from_the_command_line() =>
            DailySummaryEmail.For(Summarise(Entry("a")), "stexample").Text.Should()
                .Contain("Containers → assistant-logs → 2026/10/25.jsonl")
                .And.Contain("az storage blob download --auth-mode login --account-name stexample -c assistant-logs -n 2026/10/25.jsonl -f 2026-10-25.jsonl");

        [Fact]
        public void The_email_reports_the_numbers()
        {
            var text = DailySummaryEmail.For(Summarise(Answered("a", 600_000, 500_000, 0, 60_000), Entry("b", "filtered", 12_345) with { HistoryTurns = 2 }), "stexample").Text;

            text.Should().Contain("2 questions, 1 mid-conversation")
                .And.Contain("Outcomes: filtered 1, ok 1")
                .And.Contain("filtered  b  12,345 ms")
                .And.Contain("600,000 input (500,000 read from the cache, 0 written to it), 60,000 output")
                .And.Contain("$0.0450")
                .And.Contain("3479c80c4da0");
        }

        // the privacy page promises visitors' text stays in the 90-day log, so the email and everything it's built from carry none of it
        [Fact]
        public void No_question_or_answer_text_reaches_the_summary_or_its_email()
        {
            var entries = new[]
            {
                Entry("a") with { Question = "QUESTION-MARKER-1", Answer = "ANSWER-MARKER-1" },
                Entry("b", "filtered") with { Question = "QUESTION-MARKER-2", Answer = "ANSWER-MARKER-2" },
                Entry("c", "model_error") with { Question = "QUESTION-MARKER-3" },
            };

            var summary = Summarise(entries);
            var email = DailySummaryEmail.For(summary, "stexample");

            foreach (var text in new[] { email.Subject, email.Text, JsonSerializer.Serialize(summary) })
            {
                text.Should().NotContain("MARKER");
            }
        }
    }
}
