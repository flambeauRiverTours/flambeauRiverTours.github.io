using Azure.Identity;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Portfolio.Assistant.Functions.Tests
{
    public class QuestionLogRegistrationTests
    {
        private static ServiceProvider Services(params (string Key, string Value)[] settings)
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(settings.Select(setting => KeyValuePair.Create<string, string?>(setting.Key, setting.Value)))
                .Build();
            return new ServiceCollection().AddSingleton<IConfiguration>(configuration).AddQuestionLog(new AzureCliCredential()).BuildServiceProvider();
        }

        [Theory]
        [InlineData("QuestionLog:BlobServiceUri", "https://stexample.blob.core.windows.net/")]
        [InlineData("QuestionLog:ConnectionString", "UseDevelopmentStorage=true")]
        public void The_log_is_written_to_azure_by_address_or_to_azurite_by_connection_string(string key, string value)
        {
            using var services = Services((key, value));

            services.GetRequiredService<IStartupValidator>().Validate();
            services.GetRequiredService<IQuestionLog>().Should().BeOfType<BlobQuestionLog>();
        }

        public static TheoryData<(string, string)[]> NeitherOrBoth => new()
        {
            Array.Empty<(string, string)>(),
            new[] { ("QuestionLog:BlobServiceUri", "https://stexample.blob.core.windows.net/"), ("QuestionLog:ConnectionString", "UseDevelopmentStorage=true") },
        };

        [Theory]
        [MemberData(nameof(NeitherOrBoth))]
        public void Startup_stops_unless_exactly_one_place_to_log_is_set((string, string)[] settings)
        {
            using var services = Services(settings);

            FluentActions.Invoking(() => services.GetRequiredService<IStartupValidator>().Validate()).Should().Throw<OptionsValidationException>().WithMessage("*QuestionLog*");
        }
    }
}
