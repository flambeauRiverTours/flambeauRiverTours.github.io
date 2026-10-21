using System.Net;
using System.Text;
using Microsoft.AspNetCore.Http;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    /// <summary>
    /// Answers every prompt the same way and records what it was asked.
    /// </summary>
    internal sealed class ScriptedModel(Func<ModelAnswer> answer) : IAnswerModel
    {
        public List<Prompt> Prompts { get; } = [];

        public string Deployment => "test-deployment";

        public static ScriptedModel Replying(string text) => new(() => new ModelAnswer(text, 100, 10));

        public static ScriptedModel Throwing(Exception error) => new(() => throw error);

        public Task<ModelAnswer> AnswerAsync(Prompt prompt, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Prompts.Add(prompt);
            return Task.FromResult(answer());
        }
    }

    /// <summary>
    /// A clock that only moves when the test moves it.
    /// </summary>
    internal sealed class ManualTimeProvider(DateTimeOffset start) : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = start;

        public override DateTimeOffset GetUtcNow() => Now;
    }

    /// <summary>
    /// Builds requests as Azure's front end delivers them.
    /// </summary>
    internal static class TestRequests
    {
        public const string ConnectionAddress = "10.1.2.3";

        public static HttpRequest Post(string body, string? forwardedFor = "203.0.113.7:51234")
        {
            var context = new DefaultHttpContext();
            context.Request.Method = "POST";
            context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body));
            context.Connection.RemoteIpAddress = IPAddress.Parse(ConnectionAddress);
            if (forwardedFor is not null)
            {
                context.Request.Headers["X-Forwarded-For"] = forwardedFor;
            }

            return context.Request;
        }
    }
}
