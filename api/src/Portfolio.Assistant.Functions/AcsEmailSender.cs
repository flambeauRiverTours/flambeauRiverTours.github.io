using Azure;
using Azure.Communication.Email;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Sends through Azure Communication Services Email, signed in with the Function's identity.</summary>
    /// <remarks>The SDK retries transient failures itself; anything else fails the run.</remarks>
    internal sealed class AcsEmailSender(EmailClient client, string sender, string recipient) : IEmailSender
    {
        /// <inheritdoc />
        public async Task SendAsync(SummaryEmail email, CancellationToken cancellationToken)
        {
            var message = new EmailMessage(sender, recipient, new EmailContent(email.Subject) { PlainText = email.Text });
            var operation = await client.SendAsync(WaitUntil.Completed, message, cancellationToken);
            if (operation.Value.Status != EmailSendStatus.Succeeded)
            {
                throw new InvalidOperationException($"The email service didn't send the summary: {operation.Value.Status}.");
            }
        }
    }
}
