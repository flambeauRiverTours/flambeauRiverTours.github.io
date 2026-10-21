using Azure.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Foundry
{
    /// <summary>Registers the Foundry project's services.</summary>
    public static class ServiceCollectionExtensions
    {
        /// <summary>Registers <see cref="IAnswerModel"/> as the Claude deployment named in the <c>Foundry</c> settings.</summary>
        /// <param name="credential">Signs in to Foundry: the Function's managed identity in Azure.</param>
        /// <remarks>Bad settings stop the app starting rather than failing a visitor's question.</remarks>
        public static IServiceCollection AddClaudeAnswerModel(this IServiceCollection services, TokenCredential credential)
        {
            services.AddOptions<FoundryOptions>()
                .BindConfiguration(FoundryOptions.SectionName)
                .ValidateDataAnnotations()
                .Validate(options => options.Endpoint is { IsAbsoluteUri: true, Scheme: "https" }, "Foundry:Endpoint must be the resource's https address.")
                .Validate(
                    options => (options.MaxRetries + 1) * options.TimeoutSeconds <= FoundryOptions.MaxWaitSeconds,
                    $"Foundry:MaxRetries and Foundry:TimeoutSeconds together could keep a visitor waiting over {FoundryOptions.MaxWaitSeconds} seconds.")
                .ValidateOnStart();

            return services.AddSingleton<IAnswerModel>(provider =>
            {
                var options = provider.GetRequiredService<IOptions<FoundryOptions>>().Value;
                // the endpoint was checked by the validation above before any service is resolved
                return ClaudeAnswerModel.ForFoundry(options.Endpoint!, options.Deployment, credential, options.MaxRetries, TimeSpan.FromSeconds(options.TimeoutSeconds));
            });
        }
    }
}
