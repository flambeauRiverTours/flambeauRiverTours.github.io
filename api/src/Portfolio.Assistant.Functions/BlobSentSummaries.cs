using System.Globalization;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Portfolio.Assistant.Functions
{
    /// <summary>One empty blob per sent day: <c>daily-summary/yyyy-MM-dd.sent</c>.</summary>
    internal sealed class BlobSentSummaries(BlobContainerClient container) : ISentSummaries
    {
        /// <inheritdoc />
        public async Task<bool> WasSentAsync(DateOnly day, CancellationToken cancellationToken) =>
            (await Marker(day).ExistsAsync(cancellationToken)).Value;

        /// <inheritdoc />
        public async Task MarkSentAsync(DateOnly day, CancellationToken cancellationToken)
        {
            // the container is there in Azure; this creates it in a fresh Azurite
            await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
            try
            {
                await Marker(day).UploadAsync(BinaryData.Empty, new BlobUploadOptions { Conditions = new BlobRequestConditions { IfNoneMatch = ETag.All } }, cancellationToken);
            }
            catch (RequestFailedException error) when (error.Status == 409)
            {
                // a run that sent anyway, after a crash before marking
            }
        }

        private BlobClient Marker(DateOnly day) =>
            container.GetBlobClient(string.Create(CultureInfo.InvariantCulture, $"daily-summary/{day:yyyy-MM-dd}.sent"));
    }
}
