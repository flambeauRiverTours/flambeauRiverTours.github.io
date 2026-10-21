using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Foundry.Tests
{
    public class FoundryRegistrationTests
    {
        private const string Endpoint = "https://my-resource.services.ai.azure.com";

        private static ServiceProvider Services(CountingCredential credential, params (string Key, string Value)[] settings)
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(settings.Select(setting => KeyValuePair.Create<string, string?>(setting.Key, setting.Value)))
                .Build();
            return new ServiceCollection()
                .AddSingleton<IConfiguration>(configuration)
                .AddClaudeAnswerModel(credential)
                .BuildServiceProvider();
        }

        private static Action Starting(params (string Key, string Value)[] settings) =>
            () => Services(new CountingCredential(), settings).GetRequiredService<IStartupValidator>().Validate();

        [Fact]
        public void The_settings_name_the_claude_deployment_to_ask()
        {
            var credential = new CountingCredential();
            using var services = Services(credential, ("Foundry:Endpoint", Endpoint), ("Foundry:Deployment", "my-deployment"));

            services.GetRequiredService<IAnswerModel>().Should().BeOfType<ClaudeAnswerModel>().Which.Deployment.Should().Be("my-deployment");
            credential.Calls.Should().Be(0, "signing in waits for the first question");
        }

        [Fact]
        public void Only_the_endpoint_is_required()
        {
            using var services = Services(new CountingCredential(), ("Foundry:Endpoint", Endpoint));

            var options = services.GetRequiredService<IOptions<FoundryOptions>>().Value;

            options.Should().BeEquivalentTo(new FoundryOptions { Endpoint = new Uri(Endpoint), Deployment = "claude-haiku-5-5", MaxRetries = 1, TimeoutSeconds = 12 });
            Starting(("Foundry:Endpoint", Endpoint)).Should().NotThrow();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("http://my-resource.services.ai.azure.com")]
        [InlineData("my-resource")]
        public void Startup_fails_without_an_https_endpoint(string? endpoint) =>
            Starting(endpoint is null ? [] : [("Foundry:Endpoint", endpoint)]).Should().Throw<OptionsValidationException>().WithMessage("*Foundry:Endpoint*");

        [Fact]
        public void Startup_fails_when_retries_could_keep_a_visitor_waiting_over_30_seconds() =>
            Starting(("Foundry:Endpoint", Endpoint), ("Foundry:MaxRetries", "2"), ("Foundry:TimeoutSeconds", "12")).Should().Throw<OptionsValidationException>().WithMessage("*30 seconds*");

        [Theory]
        [InlineData("Foundry:MaxRetries", "3")]
        [InlineData("Foundry:MaxRetries", "-1")]
        [InlineData("Foundry:TimeoutSeconds", "0")]
        public void Startup_fails_on_out_of_range_numbers(string key, string value) =>
            Starting(("Foundry:Endpoint", Endpoint), (key, value)).Should().Throw<OptionsValidationException>();
    }
}
