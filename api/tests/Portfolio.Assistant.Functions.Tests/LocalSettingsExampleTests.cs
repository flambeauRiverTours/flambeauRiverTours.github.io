using System.Text.Json;
using FluentAssertions;

namespace Portfolio.Assistant.Functions.Tests
{
    // the example is what a new checkout copies to run locally, so it must name everything startup checks
    public class LocalSettingsExampleTests
    {
        private static readonly JsonElement Example =
            JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "local.settings.example.json"))).RootElement;

        [Fact]
        public void The_example_sets_the_worker_runtime_and_every_setting_startup_requires()
        {
            var values = Example.GetProperty("Values");

            values.GetProperty("FUNCTIONS_WORKER_RUNTIME").GetString().Should().Be("dotnet-isolated");
            values.GetProperty("Foundry__Endpoint").GetString().Should().StartWith("https://");
            values.GetProperty("Storage__ConnectionString").GetString().Should().Be("UseDevelopmentStorage=true");
        }

        [Fact]
        public void The_example_spells_out_the_default_limits() =>
            Example.GetProperty("Values").EnumerateObject().Where(setting => setting.Name.StartsWith("Limits__", StringComparison.Ordinal))
                .Select(setting => (setting.Name, setting.Value.GetString()))
                .Should().BeEquivalentTo([("Limits__PerMinute", "5"), ("Limits__PerDay", "30"), ("Limits__GlobalPerDay", "300")]);

        [Fact]
        public void The_example_lets_the_vite_dev_server_call_the_api() =>
            Example.GetProperty("Host").GetProperty("CORS").GetString().Should().Be("http://localhost:5173");
    }
}
