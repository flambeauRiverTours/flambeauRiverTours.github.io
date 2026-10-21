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
    internal sealed class AskFunction(KnowledgeBase knowledge, IAnswerModel model, InMemoryRateLimiter rateLimiter, ILogger<AskFunction> logger)
    {
        private const int MaxBodyBytes = 16 * 1024;

        /// <summary>Validates, rate-limits, asks the model and returns the answer with its page links.</summary>
        [Function("Ask")]
        public async Task<IActionResult> Ask([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "ask")] HttpRequest request, CancellationToken cancellationToken)
        {
            Build.AddHeader(request.HttpContext.Response);

            var validation = await ReadAskAsync(request, cancellationToken);
            if (validation is AskValidation.Invalid invalid)
            {
                return new BadRequestObjectResult(new { error = "invalid", detail = invalid.Detail });
            }

            if (rateLimiter.Admit(VisitorAddress.Of(request)) is RateLimitDecision.Denied denied)
            {
                return TooManyRequests(request.HttpContext.Response, denied.RetryAfterSeconds);
            }

            var answer = await AskModelAsync((AskValidation.Valid)validation, cancellationToken);
            if (answer is null)
            {
                return new ObjectResult(new { error = "unavailable" }) { StatusCode = StatusCodes.Status503ServiceUnavailable };
            }

            var reply = LinkExtractor.Extract(answer.Text, knowledge.Links);
            return new OkObjectResult(new { answer = reply.Text, links = reply.Links });
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

        private static ObjectResult TooManyRequests(HttpResponse response, int retryAfterSeconds)
        {
            response.Headers.RetryAfter = retryAfterSeconds.ToString(CultureInfo.InvariantCulture);
            return new ObjectResult(new { error = "rate_limited", retryAfterSeconds }) { StatusCode = StatusCodes.Status429TooManyRequests };
        }
    }
}
