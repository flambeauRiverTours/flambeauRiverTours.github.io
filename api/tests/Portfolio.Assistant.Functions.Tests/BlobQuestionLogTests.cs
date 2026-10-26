using System.Net.Sockets;
using Azure.Storage.Blobs;
using FluentAssertions;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    // runs against Azurite: skipped locally when it isn't running, and CI starts it
    public sealed class BlobQuestionLogTests : IAsyncDisposable
    {
        private readonly BlobContainerClient container = new("UseDevelopmentStorage=true", $"test-{Guid.NewGuid():N}");

        private static QuestionLogEntry Entry(DateTimeOffset timestamp, string outcome) => new(timestamp, "trace-1", outcome, "claude-haiku-5-5", "5b0f371dd542", 1200);

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
        public async Task Each_entry_is_appended_as_a_line_to_its_days_blob_creating_what_is_missing()
        {
            await SkipUnlessAzuriteRunsAsync();
            var log = new BlobQuestionLog(container);
            var lateEvening = new DateTimeOffset(2026, 10, 21, 23, 59, 0, TimeSpan.Zero);

            await log.WriteAsync(Entry(lateEvening, "ok"), TestContext.Current.CancellationToken);
            await log.WriteAsync(Entry(lateEvening, "invalid"), TestContext.Current.CancellationToken);
            await log.WriteAsync(Entry(lateEvening.AddMinutes(2), "rate_limited"), TestContext.Current.CancellationToken);

            (await Lines("2026/10/21.jsonl")).Should().Equal(Entry(lateEvening, "ok").ToJsonLine(), Entry(lateEvening, "invalid").ToJsonLine());
            (await Lines("2026/10/22.jsonl")).Should().Equal(Entry(lateEvening.AddMinutes(2), "rate_limited").ToJsonLine());
        }

        [Fact]
        public async Task A_day_reads_back_as_its_lines_in_the_order_written()
        {
            await SkipUnlessAzuriteRunsAsync();
            var log = new BlobQuestionLog(container);
            var morning = new DateTimeOffset(2026, 10, 25, 9, 0, 0, TimeSpan.Zero);
            await log.WriteAsync(Entry(morning, "ok"), TestContext.Current.CancellationToken);
            await log.WriteAsync(Entry(morning.AddHours(1), "filtered"), TestContext.Current.CancellationToken);

            (await log.ReadDayAsync(new DateOnly(2026, 10, 25), TestContext.Current.CancellationToken))
                .Should().Equal(Entry(morning, "ok").ToJsonLine(), Entry(morning.AddHours(1), "filtered").ToJsonLine());
        }

        [Fact]
        public async Task A_day_with_no_blob_reads_as_no_lines()
        {
            await SkipUnlessAzuriteRunsAsync();

            (await new BlobQuestionLog(container).ReadDayAsync(new DateOnly(2026, 10, 25), TestContext.Current.CancellationToken)).Should().BeEmpty();
        }

        [Fact]
        public void The_log_names_its_storage_account_for_the_summary_email() =>
            new BlobQuestionLog(container).StorageAccount.Should().Be("devstoreaccount1");

        private async Task<string[]> Lines(string path)
        {
            var content = await container.GetBlobClient(path).DownloadContentAsync(TestContext.Current.CancellationToken);
            var text = content.Value.Content.ToString();
            text.Should().EndWith("\n");
            return text.TrimEnd('\n').Split('\n');
        }
    }
}
