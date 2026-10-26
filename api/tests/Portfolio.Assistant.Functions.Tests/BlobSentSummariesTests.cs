using System.Net.Sockets;
using Azure.Storage.Blobs;
using FluentAssertions;

namespace Portfolio.Assistant.Functions.Tests
{
    // runs against Azurite: skipped locally when it isn't running, and CI starts it
    public sealed class BlobSentSummariesTests : IAsyncDisposable
    {
        private static readonly DateOnly Day = new(2026, 10, 25);

        private readonly BlobContainerClient container = new("UseDevelopmentStorage=true", $"test-{Guid.NewGuid():N}");

        private bool azuriteRuns;

        private async Task SkipUnlessAzuriteRunsAsync()
        {
            if (Environment.GetEnvironmentVariable("CI") is null)
            {
                using var client = new TcpClient();
                try
                {
                    await client.ConnectAsync("127.0.0.1", 10000, TestContext.Current.CancellationToken);
                }
                catch (SocketException)
                {
                    Assert.Skip("Azurite isn't running (azurite-blob --skipApiVersionCheck).");
                }
            }

            azuriteRuns = true;
        }

        public async ValueTask DisposeAsync()
        {
            if (azuriteRuns)
            {
                await container.DeleteIfExistsAsync();
            }
        }

        [Fact]
        public async Task A_day_is_unsent_until_marked_and_its_marker_is_named_after_it()
        {
            await SkipUnlessAzuriteRunsAsync();
            var sent = new BlobSentSummaries(container);

            (await sent.WasSentAsync(Day, TestContext.Current.CancellationToken)).Should().BeFalse();
            await sent.MarkSentAsync(Day, TestContext.Current.CancellationToken);

            (await sent.WasSentAsync(Day, TestContext.Current.CancellationToken)).Should().BeTrue();
            (await sent.WasSentAsync(Day.AddDays(1), TestContext.Current.CancellationToken)).Should().BeFalse();
            (await container.GetBlobClient("daily-summary/2026-10-25.sent").ExistsAsync(TestContext.Current.CancellationToken)).Value.Should().BeTrue();
        }

        // a second run that sent anyway (a crash between sending and marking) mustn't fail on the existing marker
        [Fact]
        public async Task Marking_a_day_twice_is_harmless()
        {
            await SkipUnlessAzuriteRunsAsync();
            var sent = new BlobSentSummaries(container);

            await sent.MarkSentAsync(Day, TestContext.Current.CancellationToken);
            await sent.MarkSentAsync(Day, TestContext.Current.CancellationToken);

            (await sent.WasSentAsync(Day, TestContext.Current.CancellationToken)).Should().BeTrue();
        }
    }
}
