using Anthropic;
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
        public static ClaudeAnswerModel ForFoundry(Uri endpoint, string deployment, TokenCredential credential, int maxRetries, TimeSpan attemptTimeout) =>
            new(ClaudeCalls.ForFoundry(endpoint, credential, maxRetries, attemptTimeout), deployment);

        /// <summary>Answers one prompt; API errors are rethrown as <see cref="HttpRequestException"/> with their status code.</summary>
        public async Task<ModelAnswer> AnswerAsync(Prompt prompt, CancellationToken cancellationToken) =>
            Answer(await ClaudeCalls.CreateAsync(client, Request(prompt), cancellationToken));

        private MessageCreateParams Request(Prompt prompt) => new()
        {
            Model = Deployment,
            MaxTokens = MaxTokens,
            System = new List<TextBlockParam> { new() { Text = prompt.System, CacheControl = new CacheControlEphemeral() } },
            Messages = [.. prompt.Messages.Select(message => message.Role == ChatRole.User ? (MessageParam)new UserMessageParam(message.Content) : new AssistantMessageParam(message.Content))],
            Thinking = new ThinkingConfigDisabled(),
            OutputConfig = new OutputConfig { Effort = Effort.Low },
        };

        private static ModelAnswer Answer(Message message)
        {
            var tokens = ClaudeCalls.Tokens(message);
            var filtered = message.StopReason == StopReason.Refusal;
            return new ModelAnswer(filtered ? ModelAnswer.FilteredReply : ClaudeCalls.Text(message), tokens.Input, tokens.Output, filtered)
            {
                Truncated = message.StopReason == StopReason.MaxTokens,
                CacheReadTokens = tokens.CacheRead,
                CacheWriteTokens = tokens.CacheWrite,
            };
        }
    }
}
