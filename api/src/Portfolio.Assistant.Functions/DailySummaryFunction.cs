using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Emails the owner yesterday's numbers at 06:00 UTC.</summary>
    /// <remarks>
    /// UTC because Flex Consumption doesn't support <c>WEBSITE_TIME_ZONE</c>. A run missed while the app was down
    /// catches up late (<see cref="TimerInfo.IsPastDue"/>) and still covers the day before.
    /// </remarks>
    internal sealed class DailySummaryFunction(
        TimeProvider clock, IQuestionLogReader log, ISentSummaries sent, IEmailSender email, ILogger<DailySummaryFunction> logger)
    {
        /// <summary>Sends yesterday's summary unless it was sent already or nobody asked anything.</summary>
        [Function("DailySummary")]
        public async Task Run([TimerTrigger("0 0 6 * * *")] TimerInfo timer, CancellationToken cancellationToken)
        {
            var day = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime).AddDays(-1);
            if (await sent.WasSentAsync(day, cancellationToken))
            {
                logger.LogInformation("The summary for {Day:yyyy-MM-dd} was already sent (past due: {PastDue}).", day, timer.IsPastDue);
                return;
            }

            var lines = await log.ReadDayAsync(day, cancellationToken);
            if (lines.Count == 0)
            {
                logger.LogInformation("No questions on {Day:yyyy-MM-dd}, so no summary.", day);
                return;
            }

            await email.SendAsync(DailySummaryEmail.For(DailySummary.From(day, lines), log.StorageAccount), cancellationToken);
            await sent.MarkSentAsync(day, cancellationToken);
        }
    }
}
