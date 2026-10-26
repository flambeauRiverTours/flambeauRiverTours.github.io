using FluentAssertions;
using Microsoft.Extensions.Logging;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    public class LoggingEmailSenderTests
    {
        [Fact]
        public async Task The_email_is_written_to_the_log_with_its_subject_and_text()
        {
            var logger = new RecordingLogger<LoggingEmailSender>();

            await new LoggingEmailSender(logger).SendAsync(new SummaryEmail("Assistant, 2026-10-25: 1 question", "1 questions, 0 mid-conversation"), TestContext.Current.CancellationToken);

            logger.Entries.Should().ContainSingle().Which.Should().Match<(LogLevel Level, string Message)>(entry =>
                entry.Level == LogLevel.Information && entry.Message.Contains("Assistant, 2026-10-25: 1 question") && entry.Message.Contains("1 questions, 0 mid-conversation"));
        }
    }
}
