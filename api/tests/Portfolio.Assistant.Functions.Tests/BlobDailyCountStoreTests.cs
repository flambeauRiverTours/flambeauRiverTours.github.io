using System.Net.Sockets;
using Azure.Storage.Blobs;
using FluentAssertions;

namespace Portfolio.Assistant.Functions.Tests
{
    // runs against Azurite: skipped locally when it isn't running, and CI starts it
    public sealed class BlobDailyCountStoreTests : IAsyncDisposable
    {
        private static readonly DateOnly Day = new(2026, 10, 21);

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
        public async Task A_day_with_no_count_yet_reads_as_zero_and_its_first_write_creates_it()
        {
            await SkipUnlessAzuriteRunsAsync();
            var store = new BlobDailyCountStore(container);

            var unread = await store.ReadAsync(Day, Token);
            var written = await store.TryWriteAsync(Day, 1, unread.Version, Token);

            unread.Should().Be(new DailyCount(0, Version: null));
            written!.Count.Should().Be(1);
            (await store.ReadAsync(Day, Token)).Should().Be(written);
            (await container.GetBlobClient("2026-10-21.txt").DownloadContentAsync(Token)).Value.Content.ToString().Should().Be("1");
        }

        [Fact]
        public async Task A_write_from_a_stale_read_is_refused()
        {
            await SkipUnlessAzuriteRunsAsync();
            var store = new BlobDailyCountStore(container);
            var first = await store.TryWriteAsync(Day, 1, expectedVersion: null, Token);

            await store.TryWriteAsync(Day, 2, first!.Version, Token);

            (await store.TryWriteAsync(Day, 2, first.Version, Token)).Should().BeNull();
            (await store.TryWriteAsync(Day, 5, expectedVersion: null, Token)).Should().BeNull();
            (await store.ReadAsync(Day, Token)).Count.Should().Be(2);
        }

        [Fact]
        public async Task Each_utc_day_has_its_own_count()
        {
            await SkipUnlessAzuriteRunsAsync();
            var store = new BlobDailyCountStore(container);

            await store.TryWriteAsync(Day, 3, expectedVersion: null, Token);

            (await store.ReadAsync(Day.AddDays(1), Token)).Count.Should().Be(0);
        }

        private static CancellationToken Token => TestContext.Current.CancellationToken;
    }
}
