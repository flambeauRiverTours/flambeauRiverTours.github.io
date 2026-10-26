using System.Net;
using System.Text;
using System.Text.Json;
using Azure.Communication.Email;
using Azure.Core.Pipeline;
using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    public class AcsEmailSenderTests
    {
        private static readonly SummaryEmail Email = new("Assistant, 2026-10-25: 2 questions", "2 questions, 0 mid-conversation");

        // the service accepts a send (202) and the client polls its status until it settles
        private static (AcsEmailSender Sender, EmailServiceStub Service) Create(string finalStatus)
        {
            var service = new EmailServiceStub(finalStatus);
            var options = new EmailClientOptions { Transport = new HttpClientTransport(new HttpClient(service)) };
            var client = new EmailClient(new Uri("https://acs-test.europe.communication.azure.com/"), new FixedTokenCredential(), options);
            return (new AcsEmailSender(client, "DoNotReply@example.azurecomm.net", "owner@example.com"), service);
        }

        [Fact]
        public async Task The_email_goes_from_the_sender_to_the_owner_as_plain_text()
        {
            var (sender, service) = Create("Succeeded");

            await sender.SendAsync(Email, TestContext.Current.CancellationToken);

            var body = JsonDocument.Parse(service.SendBodies.Single()).RootElement;
            body.GetProperty("senderAddress").GetString().Should().Be("DoNotReply@example.azurecomm.net");
            body.GetProperty("recipients").GetProperty("to")[0].GetProperty("address").GetString().Should().Be("owner@example.com");
            body.GetProperty("content").GetProperty("subject").GetString().Should().Be(Email.Subject);
            body.GetProperty("content").GetProperty("plainText").GetString().Should().Be(Email.Text);
            body.GetProperty("content").TryGetProperty("html", out _).Should().BeFalse();
        }

        // the run fails, so the host logs it and the day isn't marked sent
        [Fact]
        public async Task A_send_the_service_reports_failed_throws() =>
            await FluentActions.Awaiting(() => Create("Failed").Sender.SendAsync(Email, TestContext.Current.CancellationToken))
                .Should().ThrowAsync<Exception>();

        /// <summary>
        /// Accepts one send and reports the given status when polled.
        /// </summary>
        private sealed class EmailServiceStub(string finalStatus) : HttpMessageHandler
        {
            public List<string> SendBodies { get; } = [];

            protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                if (request.Method == HttpMethod.Post)
                {
                    SendBodies.Add(await request.Content!.ReadAsStringAsync(cancellationToken));
                    var accepted = Json(HttpStatusCode.Accepted, """{"id":"op-1","status":"Running"}""");
                    accepted.Headers.Add("Operation-Location", "https://acs-test.europe.communication.azure.com/emails/operations/op-1?api-version=2023-03-31");
                    accepted.Headers.Add("Retry-After", "0");
                    return accepted;
                }

                var error = finalStatus == "Failed" ? ""","error":{"code":"Denied","message":"Sender not allowed."}""" : "";
                return Json(HttpStatusCode.OK, $$"""{"id":"op-1","status":"{{finalStatus}}"{{error}}}""");
            }

            private static HttpResponseMessage Json(HttpStatusCode status, string body) =>
                new(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
        }
    }
}
