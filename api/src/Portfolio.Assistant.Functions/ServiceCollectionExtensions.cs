using Azure.Core;
using Azure.Storage.Blobs;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Registers the Function's own services.</summary>
    internal static class ServiceCollectionExtensions
    {
        // well inside the drawer's 35 s wait, and a few storage attempts with StorageClientOptions' 3 s timeout
        private static readonly TimeSpan AdmitDeadline = TimeSpan.FromSeconds(5);

        /// <summary>Loads the knowledge files now and shares them as one <see cref="KnowledgeBase"/>.</summary>
        /// <param name="folder">Holds <c>system-prompt.md</c>, <c>site.md</c>, <c>faq.md</c> and <c>links.json</c>.</param>
        /// <remarks>Loading here rather than on first use makes a bad file stop the app starting instead of failing every question.</remarks>
        public static IServiceCollection AddKnowledgeBase(this IServiceCollection services, string folder) =>
            services.AddSingleton(KnowledgeBase.Load(fileName => File.ReadAllText(Path.Combine(folder, fileName))));

        /// <summary>Registers <see cref="RateLimiter"/> with the limits from the <c>Limits</c> settings (<c>Limits__PerMinute</c> and so on).</summary>
        /// <remarks>Limits below one stop the app starting; missing ones keep the agreed defaults. The global count goes to <see cref="AddStorage"/>'s account.</remarks>
        public static IServiceCollection AddRateLimiting(this IServiceCollection services)
        {
            services.AddOptions<RateLimits>()
                .BindConfiguration("Limits")
                .Validate(limits => limits is { PerMinute: > 0, PerDay: > 0, GlobalPerDay: > 0 }, "Limits:PerMinute, Limits:PerDay and Limits:GlobalPerDay must each be at least 1.")
                .ValidateOnStart();
            services.TryAddSingleton(TimeProvider.System);
            services.TryAddSingleton<IDailyCountStore>(provider =>
                new BlobDailyCountStore(provider.GetRequiredService<BlobServiceClient>().GetBlobContainerClient(BlobDailyCountStore.ContainerName)));

            return services.AddSingleton(provider => new RateLimiter(
                provider.GetRequiredService<IOptions<RateLimits>>().Value, provider.GetRequiredService<TimeProvider>(), provider.GetRequiredService<IDailyCountStore>(), AdmitDeadline));
        }

        /// <summary>Storage calls that give up within seconds, for the question log and the global count.</summary>
        /// <remarks>Azure.Core's defaults (100 s an attempt, 3 retries) could hold a visitor, and the rate limiter's lock, for minutes.</remarks>
        public static BlobClientOptions StorageClientOptions() => new()
        {
            Retry = { NetworkTimeout = TimeSpan.FromSeconds(3), MaxRetries = 1, Delay = TimeSpan.FromMilliseconds(200) },
        };

        /// <summary>Registers <see cref="BlobQuestionLog"/> in <see cref="AddStorage"/>'s account.</summary>
        public static IServiceCollection AddQuestionLog(this IServiceCollection services) =>
            services.AddSingleton<IQuestionLog>(provider =>
                new BlobQuestionLog(provider.GetRequiredService<BlobServiceClient>().GetBlobContainerClient(BlobQuestionLog.ContainerName)));

        /// <summary>Registers the storage account from the <c>Storage</c> settings, for the question log and the global count.</summary>
        /// <param name="credential">Signs in to the account named by <c>Storage__BlobServiceUri</c>.</param>
        public static IServiceCollection AddStorage(this IServiceCollection services, TokenCredential credential)
        {
            services.AddOptions<StorageOptions>()
                .BindConfiguration("Storage")
                .Validate(
                    options => (options.BlobServiceUri is null) != string.IsNullOrEmpty(options.ConnectionString),
                    "Set exactly one of Storage:BlobServiceUri (Azure) and Storage:ConnectionString (Azurite).")
                .ValidateOnStart();

            return services.AddSingleton(provider =>
            {
                var options = provider.GetRequiredService<IOptions<StorageOptions>>().Value;
                return options.BlobServiceUri is { } address
                    ? new BlobServiceClient(address, credential, StorageClientOptions())
                    : new BlobServiceClient(options.ConnectionString, StorageClientOptions());
            });
        }
    }
}
