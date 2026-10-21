using Azure.Core;
using Azure.Identity;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Picks how the Function signs in to Foundry and Storage.</summary>
    internal static class AzureCredential
    {
        /// <summary>The managed identity where Azure provides one, otherwise your <c>az login</c>.</summary>
        /// <param name="identityEndpoint">The <c>IDENTITY_ENDPOINT</c> setting, which Azure sets wherever a managed identity exists.</param>
        /// <remarks>Not a chain: off Azure, the managed-identity probe retried for 100 seconds and then threw instead of falling through.</remarks>
        public static TokenCredential For(string? identityEndpoint) =>
            string.IsNullOrEmpty(identityEndpoint) ? new AzureCliCredential() : new ManagedIdentityCredential(ManagedIdentityId.SystemAssigned);
    }
}
