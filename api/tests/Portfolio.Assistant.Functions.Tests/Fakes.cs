using System.Net;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
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
    /// Keeps what would have been written to the blob.
    /// </summary>
    internal sealed class RecordingQuestionLog : IQuestionLog
    {
        public List<QuestionLogEntry> Entries { get; } = [];

        public Task WriteAsync(QuestionLogEntry entry, CancellationToken cancellationToken)
        {
            Entries.Add(entry);
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Fails every write, as storage does when it is down or the role is missing.
    /// </summary>
    internal sealed class FailingQuestionLog : IQuestionLog
    {
        public Task WriteAsync(QuestionLogEntry entry, CancellationToken cancellationToken) =>
            Task.FromException(new InvalidOperationException("Storage is down."));
    }

    /// <summary>
    /// Keeps each day's count with a version that changes on every write, as a blob's ETag does.
    /// </summary>
    internal sealed class MemoryDailyCountStore : IDailyCountStore
    {
        private readonly Dictionary<DateOnly, DailyCount> counts = [];
        private int writes;

        public int Count(DateOnly day) => counts.GetValueOrDefault(day)?.Count ?? 0;

        /// <summary>Another instance's write, which makes this one's version stale.</summary>
        public void WriteElsewhere(DateOnly day, int count) => counts[day] = new DailyCount(count, $"v{++writes}");

        public Task<DailyCount> ReadAsync(DateOnly day) => Task.FromResult(counts.GetValueOrDefault(day) ?? new DailyCount(0, Version: null));

        public Task<DailyCount?> TryWriteAsync(DateOnly day, int count, string? expectedVersion)
        {
            if (counts.GetValueOrDefault(day)?.Version != expectedVersion)
            {
                return Task.FromResult<DailyCount?>(null);
            }

            WriteElsewhere(day, count);
            return Task.FromResult<DailyCount?>(counts[day]);
        }
    }

    /// <summary>
    /// Fails every read and write, as storage does when it is down or the role is missing.
    /// </summary>
    internal sealed class FailingDailyCountStore : IDailyCountStore
    {
        public Task<DailyCount> ReadAsync(DateOnly day) => Task.FromException<DailyCount>(new InvalidOperationException("Storage is down."));

        public Task<DailyCount?> TryWriteAsync(DateOnly day, int count, string? expectedVersion) =>
            Task.FromException<DailyCount?>(new InvalidOperationException("Storage is down."));
    }

    /// <summary>
    /// Keeps each log message with its level.
    /// </summary>
    internal sealed class RecordingLogger<T> : ILogger<T>
    {
        public List<(LogLevel Level, string Message)> Entries { get; } = [];

        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
            Entries.Add((logLevel, formatter(state, exception)));
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
