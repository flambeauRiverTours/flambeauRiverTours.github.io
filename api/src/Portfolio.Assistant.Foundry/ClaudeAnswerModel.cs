using Anthropic;
using Anthropic.Exceptions;
using Anthropic.Foundry;
using Anthropic.Models.Messages;
using Azure.Core;
using Portfolio.Assistant.Core;
using ChatRole = Portfolio.Assistant.Core.ChatRole;

namespace Portfolio.Assistant.Foundry
{
    /// <summary>Answers prompts with a Claude deployment through the Anthropic SDK.</summary>
    /// <remarks>
    /// Thinking is off and effort low: answers are short lookups, and Haiku 5.5 would otherwise think by default.
    /// No temperature is sent because Haiku 5.5 rejects non-default sampling parameters.
    /// The system prompt (rules and knowledge, about 5,400 tokens) is the same on every call and comes first, so it is cached:
    /// a write costs about 1.25 times the input price and each read within 5 minutes about a tenth.
    /// </remarks>
    public sealed class ClaudeAnswerModel : IAnswerModel
    {
        private const int MaxTokens = 400;

        private readonly IAnthropicClient client;

        /// <param name="client">An <c>AnthropicFoundryClient</c> in production; any client in tests.</param>
        /// <param name="deployment">The Foundry deployment name, sent as the model.</param>
        internal ClaudeAnswerModel(IAnthropicClient client, string deployment)
        {
            this.client = client;
            Deployment = deployment;
        }

        /// <inheritdoc />
        public string Deployment { get; }

        /// <summary>A model for a Claude deployment in a Foundry resource, signed in with an Azure credential.</summary>
        /// <param name="endpoint">The resource's <c>services.ai.azure.com</c> address.</param>
        /// <param name="maxRetries">Retries for 408, 429 and 5xx.</param>
        /// <param name="attemptTimeout">How long one attempt may take before it is abandoned or retried.</param>
        public static ClaudeAnswerModel ForFoundry(Uri endpoint, string deployment, TokenCredential credential, int maxRetries, TimeSpan attemptTimeout)
        {
            // the Anthropic Foundry client builds its address from the resource name, the first part of the host
            var resource = endpoint.Host.Split('.')[0];
            var client = new AnthropicFoundryClient(new AnthropicFoundryIdentityTokenCredentials(credential, resource)) { MaxRetries = maxRetries, Timeout = attemptTimeout };
            return new ClaudeAnswerModel(client, deployment);
        }

        /// <summary>Answers one prompt; API errors are rethrown as <see cref="HttpRequestException"/> with their status code.</summary>
        public async Task<ModelAnswer> AnswerAsync(Prompt prompt, CancellationToken cancellationToken)
        {
            Message message;
            try
            {
                message = await client.Messages.Create(Request(prompt), cancellationToken);
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

            return Answer(message);
        }

        private MessageCreateParams Request(Prompt prompt) => new()
        {
            Model = Deployment,
            MaxTokens = MaxTokens,
            System = new List<TextBlockParam> { new() { Text = prompt.System, CacheControl = new CacheControlEphemeral() } },
            Messages = [.. prompt.Messages.Select(message => new MessageParam { Role = message.Role == ChatRole.User ? Role.User : Role.Assistant, Content = message.Content })],
            Thinking = new ThinkingConfigDisabled(),
            OutputConfig = new OutputConfig { Effort = Effort.Low },
        };

        private static ModelAnswer Answer(Message message)
        {
            // the API's input_tokens leaves out the cached tokens, which are billed too
            var cacheRead = (int)(message.Usage.CacheReadInputTokens ?? 0);
            var cacheWrite = (int)(message.Usage.CacheCreationInputTokens ?? 0);
            var input = (int)message.Usage.InputTokens + cacheRead + cacheWrite;
            var output = (int)message.Usage.OutputTokens;
            if (message.StopReason == StopReason.Refusal)
            {
                return new ModelAnswer(ModelAnswer.FilteredReply, input, output, Filtered: true) { CacheReadTokens = cacheRead, CacheWriteTokens = cacheWrite };
            }

            var text = string.Concat(message.Content.Select(block => block.TryPickText(out var textBlock) ? textBlock.Text : ""));
            return new ModelAnswer(text, input, output)
            {
                Truncated = message.StopReason == StopReason.MaxTokens,
                CacheReadTokens = cacheRead,
                CacheWriteTokens = cacheWrite,
            };
        }
    }
}
