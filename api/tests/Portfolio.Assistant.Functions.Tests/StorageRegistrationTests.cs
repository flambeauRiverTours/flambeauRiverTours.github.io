using Azure.Storage.Blobs;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Portfolio.Assistant.Functions.Tests
{
    public class StorageRegistrationTests
    {
        // Azurite's published development key, not a secret
        private const string AzuriteKey = "Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==";

        private static ServiceProvider Services(params (string Key, string Value)[] settings)
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(settings.Select(setting => KeyValuePair.Create<string, string?>(setting.Key, setting.Value)))
                .Build();
            return new ServiceCollection()
                .AddSingleton<IConfiguration>(configuration)
                .AddStorage(new FixedTokenCredential())
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

        // Azure.Core's defaults (100 s an attempt, 3 retries) could hold a visitor's request, and the rate limiter's lock, for minutes.
        // Both ways AddStorage builds a client are pointed at a server that accepts connections and never answers
        [Theory]
        [InlineData("Storage:ConnectionString")]
        [InlineData("Storage:BlobServiceUri")]
        public async Task Storage_calls_from_the_registered_client_give_up_within_seconds(string key)
        {
            using var silent = new SilentServer();
            var setting = key == "Storage:ConnectionString"
                ? $"DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey={AzuriteKey};BlobEndpoint=http://127.0.0.1:{silent.Port}/devstoreaccount1;"
                : $"https://127.0.0.1:{silent.Port}/";
            using var services = Services((key, setting));
            var call = services.GetRequiredService<BlobServiceClient>().GetBlobContainerClient("any").ExistsAsync(TestContext.Current.CancellationToken);

            var finished = await Task.WhenAny(call, Task.Delay(TimeSpan.FromSeconds(15), TestContext.Current.CancellationToken));

            finished.Should().BeSameAs(call, "a 3 s timeout with one retry gives up in about 6 s");
            await FluentActions.Awaiting(() => call).Should().ThrowAsync<Exception>();
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
