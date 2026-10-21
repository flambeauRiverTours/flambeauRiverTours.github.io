using Azure.Identity;
using FluentAssertions;

namespace Portfolio.Assistant.Functions.Tests
{
    public class AzureCredentialTests
    {
        // Azure sets IDENTITY_ENDPOINT where a managed identity exists; on a laptop, probing for one took 100 s and then failed
        [Fact]
        public void In_azure_the_function_signs_in_as_its_managed_identity() =>
            AzureCredential.For(identityEndpoint: "http://localhost:8081/msi/token").Should().BeOfType<ManagedIdentityCredential>();

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void Locally_it_signs_in_as_your_az_login(string? identityEndpoint) =>
            AzureCredential.For(identityEndpoint).Should().BeOfType<AzureCliCredential>();
    }
}
