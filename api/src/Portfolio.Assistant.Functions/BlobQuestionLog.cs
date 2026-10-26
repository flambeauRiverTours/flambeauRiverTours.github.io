using System.Text;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Specialized;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Appends each entry as a JSON line to its UTC day's append blob.</summary>
    /// <remarks>Each append is atomic, so concurrent requests never interleave within a line.</remarks>
    internal sealed class BlobQuestionLog(BlobContainerClient container) : IQuestionLog, IQuestionLogReader
    {
        /// <summary>The container <c>main.bicep</c> creates, whose lifecycle rule deletes logs after 90 days.</summary>
        public const string ContainerName = "assistant-logs";

        // the day whose blob is known to exist; a race between two requests only repeats the create
        private string? createdPath;

        /// <inheritdoc />
        public async Task WriteAsync(QuestionLogEntry entry, CancellationToken cancellationToken)
        {
            var path = QuestionLogEntry.BlobPath(entry.Timestamp);
            var blob = container.GetAppendBlobClient(path);
            if (path != createdPath)
            {
                // the container is there in Azure; this creates it in a fresh Azurite
                await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
                await blob.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
                createdPath = path;
            }

            using var line = new MemoryStream(Encoding.UTF8.GetBytes(entry.ToJsonLine() + "\n"));
            await blob.AppendBlockAsync(line, cancellationToken: cancellationToken);
        }

        /// <inheritdoc />
        public string StorageAccount => container.AccountName;

        /// <inheritdoc />
        public async Task<IReadOnlyList<string>> ReadDayAsync(DateOnly day, CancellationToken cancellationToken)
        {
            try
            {
                var content = await container.GetBlobClient(QuestionLogEntry.BlobPath(day)).DownloadContentAsync(cancellationToken);
                return content.Value.Content.ToString().Split('\n', StringSplitOptions.RemoveEmptyEntries);
            }
            catch (RequestFailedException error) when (error.Status == 404)
            {
                return [];
            }
        }
    }
}
