using System.Net;
using System.Text.Json;
using Anthropic;
using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Foundry.Tests
{
    public class ClaudeGroundingJudgeTests
    {
        private const string System = "Judge rules.\n<knowledge>\nJack works at SPIE.\n</knowledge>";

        private static string Reply(string json, string stopReason = "end_turn") => $$$"""
            {"id":"msg_1","type":"message","role":"assistant","model":"claude-sonnet-5-5",
             "content":[{"type":"text","text":{{{JsonSerializer.Serialize(json)}}}}],
             "stop_reason":"{{{stopReason}}}","stop_sequence":null,
             "usage":{"input_tokens":60,"cache_read_input_tokens":5400,"cache_creation_input_tokens":0,"output_tokens":30}}
            """;

        private static (ClaudeGroundingJudge Judge, ScriptedHandler Handler) Create(params Func<CancellationToken, Task<HttpResponseMessage>>[] responses)
        {
            var handler = new ScriptedHandler(responses);
            var client = new AnthropicClient { ApiKey = "test-key", BaseUrl = "https://example.test", HttpClient = new HttpClient(handler), MaxRetries = 0 };
            return (new ClaudeGroundingJudge(client, "sonnet-test", System), handler);
        }

        private static Task<GroundingVerdict> Judge(ClaudeGroundingJudge judge) =>
            judge.JudgeAsync("Does Jack know Go?", "Jack has 3 years of Go at SPIE.", TestContext.Current.CancellationToken);

        [Fact]
        public void A_judge_for_a_foundry_resource_reports_its_deployment_and_signs_in_only_when_it_calls()
        {
            var credential = new CountingCredential();

            var judge = ClaudeGroundingJudge.ForFoundry(new Uri("https://my-resource.services.ai.azure.com"), "claude-sonnet-5-5", credential, "Knowledge.", maxRetries: 2, attemptTimeout: TimeSpan.FromSeconds(30));

            judge.Deployment.Should().Be("claude-sonnet-5-5");
            credential.Calls.Should().Be(0);
        }

        [Fact]
        public async Task It_sends_the_cached_knowledge_as_the_system_prompt_and_the_answer_as_the_user_turn()
        {
            var (judge, handler) = Create(ScriptedHandler.Respond(HttpStatusCode.OK, Reply("""{"claims":[]}""")));

            await Judge(judge);

            var body = JsonDocument.Parse(handler.Sent.Single().Body).RootElement;
            body.GetProperty("model").GetString().Should().Be("sonnet-test");
            var system = body.GetProperty("system").EnumerateArray().Should().ContainSingle().Subject;
            system.GetProperty("text").GetString().Should().Be(System);
            system.GetProperty("cache_control").GetProperty("type").GetString().Should().Be("ephemeral");
            body.GetProperty("messages")[0].GetProperty("content").GetString().Should().Be(GroundingPrompt.User("Does Jack know Go?", "Jack has 3 years of Go at SPIE."));
        }

        // a schema the API enforces means the verdict always parses; Sonnet 5.5 rejects forced tool use, so no tool is used
        [Fact]
        public async Task It_asks_for_each_claim_with_its_evidence_in_a_fixed_shape_with_thinking_off()
        {
            var (judge, handler) = Create(ScriptedHandler.Respond(HttpStatusCode.OK, Reply("""{"claims":[]}""")));

            await Judge(judge);

            var body = JsonDocument.Parse(handler.Sent.Single().Body).RootElement;
            body.GetProperty("thinking").GetProperty("type").GetString().Should().Be("between_tools");
            var format = body.GetProperty("output_config").GetProperty("format");
            format.GetProperty("type").GetString().Should().Be("json_schema");
            var schema = format.GetProperty("schema");
            schema.GetProperty("required").EnumerateArray().Select(item => item.GetString()).Should().Equal("claims");
            schema.GetProperty("additionalProperties").GetBoolean().Should().BeFalse();
            var claim = schema.GetProperty("properties").GetProperty("claims").GetProperty("items");
            claim.GetProperty("required").EnumerateArray().Select(item => item.GetString()).Should().Equal("claim", "evidence", "supported");
            claim.GetProperty("additionalProperties").GetBoolean().Should().BeFalse();
        }

        // the judge must quote the sentence that supports each claim, or mark it unsupported: looking it up is the point
        [Fact]
        public async Task It_returns_the_claims_it_found_no_evidence_for_and_the_tokens_used()
        {
            var (judge, _) = Create(ScriptedHandler.Respond(HttpStatusCode.OK, Reply("""
                {"claims":[
                  {"claim":"works at SPIE","evidence":"Senior Software Engineer at SPIE","supported":true},
                  {"claim":"3 years of Go","evidence":"","supported":false},
                  {"claim":"Go at SPIE","evidence":"","supported":false}]}
                """)));

            var verdict = await Judge(judge);

            verdict.Unsupported.Should().Equal("3 years of Go", "Go at SPIE");
            verdict.Should().BeEquivalentTo(new { InputTokens = 5460, OutputTokens = 30, CacheReadTokens = 5400, CacheWriteTokens = 0 });
        }

        // the judge's own safety classifier, or a cut-off reply, leaves no verdict: the run isn't failed for it
        [Theory]
        [InlineData("refusal", "", "the judge refused")]
        [InlineData("max_tokens", """{"unsupported":["3 ye""", "the judge was cut off")]
        public async Task No_verdict_when_the_judge_refuses_or_is_cut_off_and_the_reason_is_kept(string stopReason, string text, string reason)
        {
            var (judge, _) = Create(ScriptedHandler.Respond(HttpStatusCode.OK, Reply(text, stopReason)));

            var verdict = await Judge(judge);

            verdict.Unsupported.Should().BeNull();
            verdict.NoVerdictReason.Should().Be(reason);
        }

        [Fact]
        public async Task An_api_error_becomes_an_http_request_exception_with_its_status_code()
        {
            var (judge, _) = Create(ScriptedHandler.Respond(HttpStatusCode.TooManyRequests, """{"type":"error","error":{"type":"rate_limit_error","message":"Slow down."}}"""));

            (await FluentActions.Awaiting(() => Judge(judge)).Should().ThrowAsync<HttpRequestException>()).Which.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        }
    }
}
