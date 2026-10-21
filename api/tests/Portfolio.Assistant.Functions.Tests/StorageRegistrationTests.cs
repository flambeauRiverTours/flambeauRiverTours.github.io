using Azure.Identity;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Portfolio.Assistant.Functions.Tests
{
    public class StorageRegistrationTests
    {
        private static ServiceProvider Services(params (string Key, string Value)[] settings)
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(settings.Select(setting => KeyValuePair.Create<string, string?>(setting.Key, setting.Value)))
                .Build();
            return new ServiceCollection()
                .AddSingleton<IConfiguration>(configuration)
                .AddStorage(new AzureCliCredential())
                .AddQuestionLog()
                .AddRateLimiting()
                .BuildServiceProvider();
        }

        [Theory]
        [InlineData("Storage:BlobServiceUri", "https://stexample.blob.core.windows.net/")]
        [InlineData("Storage:ConnectionString", "UseDevelopmentStorage=true")]
        public void The_log_and_the_global_count_use_azure_by_address_or_azurite_by_connection_string(string key, string value)
        {
            using var services = Services((key, value));

            services.GetRequiredService<IStartupValidator>().Validate();
            services.GetRequiredService<IQuestionLog>().Should().BeOfType<BlobQuestionLog>();
            services.GetRequiredService<IDailyCountStore>().Should().BeOfType<BlobDailyCountStore>();
        }

        // Azure.Core's defaults (100 s an attempt, 3 retries) could hold a visitor's request, and the rate limiter's lock, for minutes
        [Fact]
        public void Storage_calls_give_up_within_seconds()
        {
            var retry = ServiceCollectionExtensions.StorageClientOptions().Retry;

            retry.NetworkTimeout.Should().BeLessThanOrEqualTo(TimeSpan.FromSeconds(3));
            retry.MaxRetries.Should().BeLessThanOrEqualTo(1);
        }

        public static TheoryData<(string, string)[]> NeitherOrBoth => new()
        {
            Array.Empty<(string, string)>(),
            new[] { ("Storage:BlobServiceUri", "https://stexample.blob.core.windows.net/"), ("Storage:ConnectionString", "UseDevelopmentStorage=true") },
        };

        [Theory]
        [MemberData(nameof(NeitherOrBoth))]
        public void Startup_stops_unless_exactly_one_storage_account_is_set((string, string)[] settings)
        {
            using var services = Services(settings);

            FluentActions.Invoking(() => services.GetRequiredService<IStartupValidator>().Validate()).Should().Throw<OptionsValidationException>().WithMessage("*Storage*");
        }
    }
}
