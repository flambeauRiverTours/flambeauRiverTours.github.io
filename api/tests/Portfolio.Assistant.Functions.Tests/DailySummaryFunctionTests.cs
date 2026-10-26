using FluentAssertions;
using Microsoft.Azure.Functions.Worker;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    public class DailySummaryFunctionTests
    {
        private static readonly DateTimeOffset SixInTheMorning = new(2026, 10, 26, 6, 0, 0, TimeSpan.Zero);
        private static readonly DateOnly Yesterday = new(2026, 10, 25);

        private readonly ManualTimeProvider clock = new(SixInTheMorning);
        private readonly MemoryQuestionLogReader log = new();
        private readonly MemorySentSummaries sent = new();
        private readonly RecordingEmailSender email = new();
        private readonly RecordingLogger<DailySummaryFunction> logger = new();

        private DailySummaryFunction Function(IEmailSender? sender = null) => new(clock, log, sent, sender ?? email, logger);

        private static string Line(string requestId, string outcome = "ok") =>
            new QuestionLogEntry(new DateTimeOffset(2026, 10, 25, 9, 0, 0, TimeSpan.Zero), requestId, outcome, "claude-haiku-5-5", "3479c80c4da0", 2000)
            {
                Question = "Where does Jack work?",
            }.ToJsonLine();

        private Task Run() => Function().Run(new TimerInfo(), TestContext.Current.CancellationToken);

        [Fact]
        public async Task Yesterdays_questions_are_summarised_emailed_and_the_day_marked_sent()
        {
            log.Days[Yesterday] = [Line("a"), Line("b", "filtered")];

            await Run();

            email.Sent.Should().ContainSingle().Which.Subject.Should().Be("Assistant, 2026-10-25: 2 questions (1 needs a look)");
            email.Sent[0].Text.Should().Contain($"--account-name {MemoryQuestionLogReader.Account}");
            sent.Days.Should().Equal(Yesterday);
        }

        [Fact]
        public async Task A_day_with_no_questions_sends_nothing()
        {
            await Run();

            email.Sent.Should().BeEmpty();
            sent.Days.Should().BeEmpty();
        }

        // a retry or a catch-up run after a restart mustn't send the same day twice
        [Fact]
        public async Task A_day_already_sent_isnt_sent_again()
        {
            log.Days[Yesterday] = [Line("a")];
            sent.Days.Add(Yesterday);

            await Run();

            email.Sent.Should().BeEmpty();
        }

        // a missed 06:00 run catches up later in the day, and still covers the day before
        [Fact]
        public async Task A_late_run_summarises_the_day_before_the_one_it_runs_on()
        {
            clock.Now = SixInTheMorning.AddHours(17);
            log.Days[Yesterday] = [Line("a")];

            await Run();

            email.Sent.Should().ContainSingle().Which.Subject.Should().StartWith("Assistant, 2026-10-25:");
        }

        // the failure reaches the host, which logs it as an exception; the day stays unsent
        [Fact]
        public async Task A_failed_send_isnt_marked_sent_and_fails_the_run()
        {
            log.Days[Yesterday] = [Line("a")];

            await FluentActions.Awaiting(() => Function(new FailingEmailSender()).Run(new TimerInfo(), TestContext.Current.CancellationToken))
                .Should().ThrowAsync<InvalidOperationException>();

            sent.Days.Should().BeEmpty();
        }
    }

    /// <summary>
    /// Holds each day's log lines in memory.
    /// </summary>
    internal sealed class MemoryQuestionLogReader : IQuestionLogReader
    {
        public const string Account = "stexample";

        public Dictionary<DateOnly, IReadOnlyList<string>> Days { get; } = [];

        public string StorageAccount => Account;

        public Task<IReadOnlyList<string>> ReadDayAsync(DateOnly day, CancellationToken cancellationToken) =>
            Task.FromResult(Days.GetValueOrDefault(day) ?? []);
    }

    /// <summary>
    /// Remembers which days were marked sent.
    /// </summary>
    internal sealed class MemorySentSummaries : ISentSummaries
    {
        public List<DateOnly> Days { get; } = [];

        public Task<bool> WasSentAsync(DateOnly day, CancellationToken cancellationToken) => Task.FromResult(Days.Contains(day));

        public Task MarkSentAsync(DateOnly day, CancellationToken cancellationToken)
        {
            Days.Add(day);
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Keeps every email instead of sending it.
    /// </summary>
    internal sealed class RecordingEmailSender : IEmailSender
    {
        public List<SummaryEmail> Sent { get; } = [];

        public Task SendAsync(SummaryEmail email, CancellationToken cancellationToken)
        {
            Sent.Add(email);
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Fails every send, as the email service does when it's down or the role is missing.
    /// </summary>
    internal sealed class FailingEmailSender : IEmailSender
    {
        public Task SendAsync(SummaryEmail email, CancellationToken cancellationToken) =>
            Task.FromException(new InvalidOperationException("The email service is down."));
    }
}
