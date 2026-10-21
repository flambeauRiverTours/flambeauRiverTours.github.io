using System.Net;
using System.Text.Json;
using Anthropic;
using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Foundry.Tests
{
    public class ClaudeAnswerModelTests
    {
        private const string Success = """
            {"id":"msg_1","type":"message","role":"assistant","model":"claude-haiku-5-5",
             "content":[{"type":"text","text":"Jack works at SPIE.\nLinks: experience-spie"}],
             "stop_reason":"end_turn","stop_sequence":null,"usage":{"input_tokens":3900,"output_tokens":20}}
            """;

        private static readonly Prompt Prompt = new("Rules and knowledge.", [new(ChatRole.User, "Where does Jack work?"), new(ChatRole.Assistant, "SPIE."), new(ChatRole.User, "And before?")]);

        private static (ClaudeAnswerModel Model, ScriptedHandler Handler) Create(params Func<CancellationToken, Task<HttpResponseMessage>>[] responses)
        {
            var handler = new ScriptedHandler(responses);
            var client = new AnthropicClient { ApiKey = "test-key", BaseUrl = "https://example.test", HttpClient = new HttpClient(handler), MaxRetries = 0 };
            return (new ClaudeAnswerModel(client, "haiku-test"), handler);
        }

        private static Task<ModelAnswer> Ask(ClaudeAnswerModel model) => model.AnswerAsync(Prompt, TestContext.Current.CancellationToken);

        [Fact]
        public async Task It_sends_the_rules_as_a_system_message_and_the_conversation_as_turns()
        {
            var (model, handler) = Create(ScriptedHandler.Respond(HttpStatusCode.OK, Success));

            await Ask(model);

            var body = JsonDocument.Parse(handler.Sent.Single().Body).RootElement;
            body.GetProperty("model").GetString().Should().Be("haiku-test");
            body.GetProperty("system").ToString().Should().Contain("Rules and knowledge.");
            body.GetProperty("messages").EnumerateArray().Select(message => message.GetProperty("role").GetString()).Should().Equal("user", "assistant", "user");
            body.GetProperty("messages")[2].ToString().Should().Contain("And before?");
        }

        [Fact]
        public async Task It_turns_thinking_off_uses_low_effort_and_sets_no_sampling_parameters()
        {
            // Haiku 5.5 thinks by default, and rejects non-default temperature, top_p and top_k with a 400
            var (model, handler) = Create(ScriptedHandler.Respond(HttpStatusCode.OK, Success));

            await Ask(model);

            var body = JsonDocument.Parse(handler.Sent.Single().Body).RootElement;
            body.GetProperty("thinking").GetProperty("type").GetString().Should().Be("disabled");
            body.GetProperty("output_config").GetProperty("effort").GetString().Should().Be("low");
            body.GetProperty("max_tokens").GetInt32().Should().Be(400);
            body.TryGetProperty("temperature", out _).Should().BeFalse();
            body.TryGetProperty("top_p", out _).Should().BeFalse();
        }

        [Fact]
        public async Task The_reply_text_token_counts_and_deployment_are_returned()
        {
            var (model, _) = Create(ScriptedHandler.Respond(HttpStatusCode.OK, Success));

            (await Ask(model)).Should().Be(new ModelAnswer("Jack works at SPIE.\nLinks: experience-spie", 3900, 20));
        }

        [Fact]
        public void A_model_for_a_foundry_resource_reports_its_deployment_and_signs_in_only_when_it_calls()
        {
            // hosts pass an endpoint and an Azure credential, so no Anthropic SDK type leaves this project
            var credential = new CountingCredential();

            var model = ClaudeAnswerModel.ForFoundry(new Uri("https://my-resource.services.ai.azure.com"), "claude-haiku-5-5", credential, maxRetries: 2, attemptTimeout: TimeSpan.FromSeconds(10));

            model.Deployment.Should().Be("claude-haiku-5-5");
            credential.Calls.Should().Be(0);
        }

        [Fact]
        public async Task A_refusal_gets_the_filtered_reply()
        {
            var (model, _) = Create(ScriptedHandler.Respond(HttpStatusCode.OK, """
                {"id":"msg_2","type":"message","role":"assistant","model":"claude-haiku-5-5","content":[],
                 "stop_reason":"refusal","stop_sequence":null,"usage":{"input_tokens":3900,"output_tokens":0}}
                """));

            (await Ask(model)).Should().Be(new ModelAnswer(ModelAnswer.FilteredReply, 3900, 0, Filtered: true));
        }

        [Theory]
        [InlineData(HttpStatusCode.TooManyRequests)]
        [InlineData(HttpStatusCode.InternalServerError)]
        [InlineData(HttpStatusCode.Unauthorized)]
        [InlineData(HttpStatusCode.NotFound)]
        public async Task An_api_error_becomes_an_http_request_exception_with_its_status_code(HttpStatusCode status)
        {
            // the eval runner decides from the status code whether a failure is temporary
            var (model, _) = Create(ScriptedHandler.Respond(status, """{"type":"error","error":{"type":"x","message":"nope"}}"""));

            (await FluentActions.Awaiting(() => Ask(model)).Should().ThrowAsync<HttpRequestException>()).Which.StatusCode.Should().Be(status);
        }
    }
}
