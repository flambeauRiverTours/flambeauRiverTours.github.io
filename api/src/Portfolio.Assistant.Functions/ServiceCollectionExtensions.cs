using Azure.Communication.Email;
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
        // well inside the drawer's 35 s wait; a storage attempt that hangs uses 3 s of it, so its retry gets only what's left
        // (about 1.8 s), and the deadline, not the retry policy, decides when a hung admit gives up
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

        /// <summary>Registers <see cref="BlobQuestionLog"/> in <see cref="AddStorage"/>'s account, to write and read back.</summary>
        public static IServiceCollection AddQuestionLog(this IServiceCollection services) =>
            services.AddSingleton(provider =>
                    new BlobQuestionLog(provider.GetRequiredService<BlobServiceClient>().GetBlobContainerClient(BlobQuestionLog.ContainerName)))
                .AddSingleton<IQuestionLog>(provider => provider.GetRequiredService<BlobQuestionLog>())
                .AddSingleton<IQuestionLogReader>(provider => provider.GetRequiredService<BlobQuestionLog>());

        /// <summary>Registers the daily summary's sender and sent markers; needs <see cref="AddQuestionLog"/>.</summary>
        /// <param name="credential">Signs in to the email service named by <c>Email__Endpoint</c>.</param>
        /// <param name="inAzure">Requires the <c>Email</c> settings; locally, without them, the summary is logged.</param>
        public static IServiceCollection AddDailySummary(this IServiceCollection services, TokenCredential credential, bool inAzure)
        {
            AddEmailOptions(services, inAzure);
            services.TryAddSingleton(TimeProvider.System);
            services.TryAddSingleton<ISentSummaries>(provider =>
                new BlobSentSummaries(provider.GetRequiredService<BlobServiceClient>().GetBlobContainerClient(BlobDailyCountStore.ContainerName)));
            return services.AddSingleton(provider => EmailSender(provider, credential));
        }

        // in Azure a missing setting would log every summary unnoticed, so there it stops startup
        private static void AddEmailOptions(IServiceCollection services, bool inAzure) =>
            services.AddOptions<EmailOptions>()
                .BindConfiguration("Email")
                .Validate(
                    options => options.Endpoint is null
                        ? !inAzure
                        : !string.IsNullOrWhiteSpace(options.Sender) && !string.IsNullOrWhiteSpace(options.Recipient),
                    inAzure
                        ? "Set Email:Endpoint, Email:Sender and Email:Recipient for the daily summary."
                        : "With Email:Endpoint set, also set Email:Sender and Email:Recipient (or leave all three out to log the summary).")
                .ValidateOnStart();

        private static IEmailSender EmailSender(IServiceProvider provider, TokenCredential credential)
        {
            var options = provider.GetRequiredService<IOptions<EmailOptions>>().Value;
            // the validation guarantees a sender and recipient whenever there's an endpoint
            return options.Endpoint is { } endpoint
                ? new AcsEmailSender(new EmailClient(endpoint, credential), options.Sender!, options.Recipient!)
                : ActivatorUtilities.CreateInstance<LoggingEmailSender>(provider);
        }

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
