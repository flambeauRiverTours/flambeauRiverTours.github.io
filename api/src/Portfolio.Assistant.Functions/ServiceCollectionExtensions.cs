using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Registers the Function's own services.</summary>
    internal static class ServiceCollectionExtensions
    {
        /// <summary>Loads the knowledge files now and shares them as one <see cref="KnowledgeBase"/>.</summary>
        /// <param name="folder">Holds <c>system-prompt.md</c>, <c>site.md</c>, <c>faq.md</c> and <c>links.json</c>.</param>
        /// <remarks>Loading here rather than on first use makes a bad file stop the app starting instead of failing every question.</remarks>
        public static IServiceCollection AddKnowledgeBase(this IServiceCollection services, string folder) =>
            services.AddSingleton(KnowledgeBase.Load(fileName => File.ReadAllText(Path.Combine(folder, fileName))));

        /// <summary>Registers <see cref="InMemoryRateLimiter"/> with the limits from the <c>Limits</c> settings (<c>Limits__PerMinute</c> and so on).</summary>
        /// <remarks>Limits below one stop the app starting; missing ones keep the agreed defaults.</remarks>
        public static IServiceCollection AddRateLimiting(this IServiceCollection services)
        {
            services.AddOptions<RateLimits>()
                .BindConfiguration("Limits")
                .Validate(limits => limits is { PerMinute: > 0, PerDay: > 0, GlobalPerDay: > 0 }, "Limits:PerMinute, Limits:PerDay and Limits:GlobalPerDay must each be at least 1.")
                .ValidateOnStart();
            services.TryAddSingleton(TimeProvider.System);

            return services.AddSingleton(provider =>
                new InMemoryRateLimiter(provider.GetRequiredService<IOptions<RateLimits>>().Value, provider.GetRequiredService<TimeProvider>()));
        }
    }
}
