using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Answers a visitor's question about Jack: <c>POST /api/ask</c>.</summary>
    internal sealed class AskFunction(KnowledgeBase knowledge, IAnswerModel model, RateLimiter rateLimiter, IQuestionLog questionLog, TimeProvider clock, ILogger<AskFunction> logger)
    {
        /// <summary>The start of the warning logged for each question the global cap turns away; <c>main.bicep</c>'s alert searches for it.</summary>
        public const string GlobalCapReachedMessage = "The global daily cap is reached";

        // nginx's "client closed request": nobody reads it, but it keeps a closed drawer out of the failures
        private const int ClientClosedRequest = 499;

        private const int MaxBodyBytes = 16 * 1024;

        /// <summary>Validates, rate-limits, asks the model, logs how the request ended and returns the answer with its page links.</summary>
        [Function("Ask")]
        public async Task<IActionResult> Ask([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "ask")] HttpRequest request, CancellationToken cancellationToken)
        {
            var arrived = clock.GetUtcNow();
            Build.AddHeader(request.HttpContext.Response);

            AskOutcome outcome;
            try
            {
                outcome = await AnswerAsync(request, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                // the visitor left before their question reached the model, so there is nothing to log
                return new StatusCodeResult(ClientClosedRequest);
            }

            if (QuestionLogEntry.For(outcome, RequestId(request), arrived, clock.GetUtcNow() - arrived, model.Deployment, knowledge.PromptVersion) is { } entry)
            {
                await LogAsync(entry);
            }

            return Respond(outcome, request.HttpContext.Response);
        }

        private async Task<AskOutcome> AnswerAsync(HttpRequest request, CancellationToken cancellationToken)
        {
            var validation = await ReadAskAsync(request, cancellationToken);
            if (validation is AskValidation.Invalid invalid)
            {
                return new AskOutcome.Invalid(invalid.Detail);
            }

            var decision = await AdmitAsync(VisitorAddress.Of(request), cancellationToken);
            if (decision is null)
            {
                return new AskOutcome.CountFailed();
            }

            if (decision is RateLimitDecision.Denied denied)
            {
                if (denied.GlobalCapReached)
                {
                    logger.LogWarning(GlobalCapReachedMessage + ": everyone is turned away until midnight UTC");
                }

                return new AskOutcome.RateLimited(denied.RetryAfterSeconds);
            }

            var ask = (AskValidation.Valid)validation;
            try
            {
                var answer = await AskModelAsync(ask, cancellationToken);
                return answer is null ? new AskOutcome.ModelError(ask) : new AskOutcome.Answered(ask, answer, Reply(answer));
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new AskOutcome.Cancelled(ask);
            }
        }

        // the global count is the cost control, so a failure or timeout reading or saving it turns the question away (null);
        // the visitor leaving propagates, to the 499 with nothing counted or logged
        private async Task<RateLimitDecision?> AdmitAsync(string visitorAddress, CancellationToken cancellationToken)
        {
            try
            {
                return await rateLimiter.AdmitAsync(visitorAddress, cancellationToken);
            }
            catch (Exception error) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogError(error, "The global question count couldn't be read or saved, so the question was turned away");
                return null;
            }
        }

        // an answer cut off at the token limit ends with an ellipsis, so the visitor can tell
        private AnswerWithLinks Reply(ModelAnswer answer)
        {
            var reply = LinkExtractor.Extract(answer.Text, knowledge.Links);
            return answer.Truncated ? reply with { Text = reply.Text.TrimEnd() + "…" } : reply;
        }

        // reads one byte past the cap at most, so an oversized body is refused without being read in full
        private static async Task<AskValidation> ReadAskAsync(HttpRequest request, CancellationToken cancellationToken)
        {
            var body = new byte[MaxBodyBytes + 1];
            var length = await request.Body.ReadAtLeastAsync(body, body.Length, throwOnEndOfStream: false, cancellationToken);
            return length > MaxBodyBytes
                ? new AskValidation.Invalid("body is larger than 16 KB.")
                : AskRequestValidator.Validate(Parse(body.AsSpan(0, length)));
        }

        // a body that isn't JSON of the right shape is validated as a missing request
        private static AskRequest? Parse(ReadOnlySpan<byte> json)
        {
            try
            {
                return JsonSerializer.Deserialize<AskRequest>(json, JsonSerializerOptions.Web);
            }
            catch (JsonException)
            {
                return null;
            }
        }

        // any failure behind the model, sign-in included, is a 503 for the visitor and an error in the log;
        // the log names the deployment, never the question. Only the visitor's own cancellation propagates
        private async Task<ModelAnswer?> AskModelAsync(AskValidation.Valid ask, CancellationToken cancellationToken)
        {
            try
            {
                return await model.AnswerAsync(PromptBuilder.Build(knowledge, ask.History, ask.Question), cancellationToken);
            }
            catch (Exception error) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogError(error, "The model call to {Deployment} failed", model.Deployment);
                return null;
            }
        }

        // the trace ID finds the request's telemetry in App Insights; without telemetry (locally, in tests), ASP.NET's own ID stands in
        private static string RequestId(HttpRequest request) => Activity.Current?.TraceId.ToHexString() ?? request.HttpContext.TraceIdentifier;

        // the log is for review: a failed write costs a warning, never the visitor's answer.
        // It isn't cancelled with the request, so a question the visitor left is still kept
        private async Task LogAsync(QuestionLogEntry entry)
        {
            try
            {
                await questionLog.WriteAsync(entry, CancellationToken.None);
            }
            catch (Exception error)
            {
                logger.LogWarning(error, "The question log write for request {RequestId} failed", entry.RequestId);
            }
        }

        private static IActionResult Respond(AskOutcome outcome, HttpResponse response) => outcome switch
        {
            AskOutcome.Answered answered => new OkObjectResult(new { answer = answered.Reply.Text, links = answered.Reply.Links }),
            AskOutcome.Invalid invalid => new BadRequestObjectResult(new { error = "invalid", detail = invalid.Detail }),
            AskOutcome.RateLimited limited => TooManyRequests(response, limited.RetryAfterSeconds),
            AskOutcome.ModelError or AskOutcome.CountFailed => new ObjectResult(new { error = "unavailable" }) { StatusCode = StatusCodes.Status503ServiceUnavailable },
            AskOutcome.Cancelled => new StatusCodeResult(ClientClosedRequest),
            _ => throw new ArgumentOutOfRangeException(nameof(outcome), outcome, "Unknown outcome."),
        };

        private static ObjectResult TooManyRequests(HttpResponse response, int retryAfterSeconds)
        {
            response.Headers.RetryAfter = retryAfterSeconds.ToString(CultureInfo.InvariantCulture);
            return new ObjectResult(new { error = "rate_limited", retryAfterSeconds }) { StatusCode = StatusCodes.Status429TooManyRequests };
        }
    }
}
