using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;
using Azure.Core;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Foundry
{
    /// <summary>Lists the claims in an answer the knowledge doesn't support, with a stronger Claude deployment.</summary>
    /// <remarks>
    /// Structured outputs fix the reply's shape, so every verdict parses; Sonnet 5.5 rejects forced tool use, so no tool is used.
    /// Thinking is off (<c>between_tools</c> with no tools) unless asked for, and the rules and knowledge are cached as the system prompt.
    /// </remarks>
    public sealed class ClaudeGroundingJudge : IGroundingJudge
    {
        private const int MaxTokens = 1024;

        // thinking counts toward max_tokens, so a thinking judge needs room for it as well as the verdict
        private const int MaxTokensWhenThinking = 8192;

        // each claim with the sentence that supports it: the judge flagged facts the FAQ states until it had to look them up
        private static readonly Dictionary<string, JsonElement> VerdictSchema = JsonDocument.Parse("""
            {"type":"object","properties":{"claims":{"type":"array","items":{"type":"object","properties":{
              "claim":{"type":"string"},"evidence":{"type":"string"},"supported":{"type":"boolean"}},
              "required":["claim","evidence","supported"],"additionalProperties":false}}},
             "required":["claims"],"additionalProperties":false}
            """).RootElement.EnumerateObject().ToDictionary(property => property.Name, property => property.Value.Clone());

        private readonly IAnthropicClient client;
        private readonly string system;
        private readonly bool think;

        /// <param name="client">An <c>AnthropicFoundryClient</c> in production; any client in tests.</param>
        /// <param name="system">From <see cref="GroundingPrompt.System"/>.</param>
        /// <param name="think">Adaptive thinking at medium effort, for the subtle mislabels the judge misses without it.</param>
        internal ClaudeGroundingJudge(IAnthropicClient client, string deployment, string system, bool think = false)
        {
            this.client = client;
            this.system = system;
            this.think = think;
            Deployment = deployment;
        }

        /// <inheritdoc />
        public string Deployment { get; }

        /// <summary>A judge for a Claude deployment in a Foundry resource, signed in with an Azure credential.</summary>
        /// <param name="endpoint">The resource's <c>services.ai.azure.com</c> address.</param>
        /// <param name="system">From <see cref="GroundingPrompt.System"/>.</param>
        /// <param name="think">Adaptive thinking at medium effort; off by default.</param>
        public static ClaudeGroundingJudge ForFoundry(Uri endpoint, string deployment, TokenCredential credential, string system, int maxRetries, TimeSpan attemptTimeout, bool think = false) =>
            new(ClaudeCalls.ForFoundry(endpoint, credential, maxRetries, attemptTimeout), deployment, system, think);

        /// <summary>API errors are rethrown as <see cref="HttpRequestException"/> with their status code, as for answers.</summary>
        public async Task<GroundingVerdict> JudgeAsync(string question, string answer, CancellationToken cancellationToken) =>
            Verdict(await ClaudeCalls.CreateAsync(client, Request(question, answer), cancellationToken));

        private MessageCreateParams Request(string question, string answer) => new()
        {
            Model = Deployment,
            MaxTokens = think ? MaxTokensWhenThinking : MaxTokens,
            System = new List<TextBlockParam> { new() { Text = system, CacheControl = new CacheControlEphemeral() } },
            Messages = [new UserMessageParam(GroundingPrompt.User(question, answer))],
            Thinking = think ? new ThinkingConfigAdaptive() : new ThinkingConfigBetweenTools(),
            OutputConfig = new OutputConfig { Effort = Effort.Medium, Format = new JsonOutputFormat { Schema = VerdictSchema } },
        };

        // a refusal or a reply cut off at the limit has no verdict to read
        private static GroundingVerdict Verdict(Message message)
        {
            var tokens = ClaudeCalls.Tokens(message);
            var unsupported = message.StopReason == StopReason.EndTurn ? Unsupported(ClaudeCalls.Text(message)) : null;
            return new GroundingVerdict(unsupported, tokens.Input, tokens.Output)
            {
                CacheReadTokens = tokens.CacheRead,
                CacheWriteTokens = tokens.CacheWrite,
                NoVerdictReason = unsupported is null ? NoVerdictReason(message) : null,
            };
        }

        private static string NoVerdictReason(Message message) =>
            message.StopReason == StopReason.Refusal ? "the judge refused"
                : message.StopReason == StopReason.MaxTokens ? "the judge was cut off"
                : $"the judge stopped early ({message.StopReason})";

        private static string[] Unsupported(string json)
        {
            using var verdict = JsonDocument.Parse(json);
            return [.. verdict.RootElement.GetProperty("claims").EnumerateArray()
                .Where(claim => !claim.GetProperty("supported").GetBoolean())
                .Select(claim => claim.GetProperty("claim").GetString() ?? "")];
        }
    }
}
