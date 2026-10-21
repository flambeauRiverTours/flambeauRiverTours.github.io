using Anthropic;
using Anthropic.Exceptions;
using Anthropic.Foundry;
using Anthropic.Models.Messages;
using Azure.Core;

namespace Portfolio.Assistant.Foundry
{
    /// <summary>What the answer model and the grounding judge share: the Foundry client, the call and what a reply cost.</summary>
    internal static class ClaudeCalls
    {
        /// <summary>A client for a Foundry resource, signed in with an Azure credential.</summary>
        /// <param name="endpoint">The resource's <c>services.ai.azure.com</c> address.</param>
        /// <param name="maxRetries">Retries for 408, 429 and 5xx.</param>
        /// <param name="attemptTimeout">How long one attempt may take before it is abandoned or retried.</param>
        public static IAnthropicClient ForFoundry(Uri endpoint, TokenCredential credential, int maxRetries, TimeSpan attemptTimeout)
        {
            // the Anthropic Foundry client builds its address from the resource name, the first part of the host
            var resource = endpoint.Host.Split('.')[0];
            return new AnthropicFoundryClient(new AnthropicFoundryIdentityTokenCredentials(credential, resource)) { MaxRetries = maxRetries, Timeout = attemptTimeout };
        }

        /// <summary>Sends one request; API errors are rethrown as <see cref="HttpRequestException"/> with their status code.</summary>
        public static async Task<Message> CreateAsync(IAnthropicClient client, MessageCreateParams request, CancellationToken cancellationToken)
        {
            try
            {
                return await client.Messages.Create(request, cancellationToken);
            }
            catch (AnthropicApiException error)
            {
                // the eval runner and the Function decide from the status code whether a failure is temporary
                throw new HttpRequestException(error.Message, error, error.StatusCode);
            }
            catch (AnthropicIOException error)
            {
                throw new HttpRequestException(error.Message, error);
            }
        }

        /// <summary>The reply's tokens; <see cref="TokenCounts.Input"/> includes the cached ones, which the API's <c>input_tokens</c> leaves out but bills.</summary>
        public static TokenCounts Tokens(Message message)
        {
            var cacheRead = (int)(message.Usage.CacheReadInputTokens ?? 0);
            var cacheWrite = (int)(message.Usage.CacheCreationInputTokens ?? 0);
            return new TokenCounts((int)message.Usage.InputTokens + cacheRead + cacheWrite, cacheRead, cacheWrite, (int)message.Usage.OutputTokens);
        }

        /// <summary>The reply's text blocks, joined.</summary>
        public static string Text(Message message) =>
            string.Concat(message.Content.Select(block => block.TryPickText(out var textBlock) ? textBlock.Text : ""));
    }

    /// <summary>A reply's tokens.</summary>
    /// <param name="Input">All prompt tokens, including those written to or read from the cache.</param>
    internal readonly record struct TokenCounts(int Input, int CacheRead, int CacheWrite, int Output);
}
