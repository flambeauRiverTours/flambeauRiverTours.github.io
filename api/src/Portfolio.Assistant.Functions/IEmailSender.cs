using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Sends the owner an email; throws if it isn't sent.</summary>
    internal interface IEmailSender
    {
        /// <summary>Sends the email and waits until the service has accepted or refused it.</summary>
        Task SendAsync(SummaryEmail email, CancellationToken cancellationToken);
    }
}
