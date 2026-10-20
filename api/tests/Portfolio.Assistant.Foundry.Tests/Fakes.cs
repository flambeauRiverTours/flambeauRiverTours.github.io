using System.Net;
using System.Text;
using Azure.Core;

namespace Portfolio.Assistant.Foundry.Tests
{
    /// <summary>
    /// Answers each request with the next scripted response and records what was sent.
    /// </summary>
    internal sealed class ScriptedHandler(params Func<CancellationToken, Task<HttpResponseMessage>>[] responses) : HttpMessageHandler
    {
        private readonly Queue<Func<CancellationToken, Task<HttpResponseMessage>>> remaining = new(responses);

        public List<(HttpRequestMessage Request, string Body)> Sent { get; } = [];

        public static Func<CancellationToken, Task<HttpResponseMessage>> Respond(HttpStatusCode status, string body) =>
            _ => Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") });

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Sent.Add((request, request.Content is null ? "" : await request.Content.ReadAsStringAsync(cancellationToken)));
            return await remaining.Dequeue()(cancellationToken);
        }
    }

    /// <summary>
    /// Hands out a fixed token and counts how often it was asked.
    /// </summary>
    internal sealed class CountingCredential : TokenCredential
    {
        public int Calls { get; private set; }

        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken) =>
            throw new NotSupportedException("the client must use the async path");

        public override ValueTask<AccessToken> GetTokenAsync(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            Calls++;
            return ValueTask.FromResult(new AccessToken("test-token", DateTimeOffset.UtcNow.AddHours(1)));
        }
    }
}
