using Microsoft.Extensions.Logging;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Logs the email instead: a local run has no email service.</summary>
    internal sealed class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
    {
        /// <inheritdoc />
        public Task SendAsync(SummaryEmail email, CancellationToken cancellationToken)
        {
            logger.LogInformation("Not sent (no Email__Endpoint): {Subject}\n{Text}", email.Subject, email.Text);
            return Task.CompletedTask;
        }
    }
}
