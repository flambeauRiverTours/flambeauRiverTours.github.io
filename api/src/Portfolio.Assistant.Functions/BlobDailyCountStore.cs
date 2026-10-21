using System.Globalization;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Keeps each UTC day's global count as a tiny blob, <c>yyyy-MM-dd.txt</c>, written only if its ETag is unchanged.</summary>
    internal sealed class BlobDailyCountStore(BlobContainerClient container) : IDailyCountStore
    {
        /// <summary>The container <c>main.bicep</c> creates, whose lifecycle rule deletes counts after 7 days.</summary>
        public const string ContainerName = "rate-limits";

        private bool containerChecked;

        /// <inheritdoc />
        public async Task<DailyCount> ReadAsync(DateOnly day, CancellationToken cancellationToken)
        {
            try
            {
                var content = await Blob(day).DownloadContentAsync(cancellationToken);
                return new DailyCount(int.Parse(content.Value.Content.ToString(), CultureInfo.InvariantCulture), content.Value.Details.ETag.ToString());
            }
            catch (RequestFailedException error) when (error.Status == 404)
            {
                return new DailyCount(0, Version: null);
            }
        }

        /// <inheritdoc />
        public async Task<DailyCount?> TryWriteAsync(DateOnly day, int count, string? expectedVersion, CancellationToken cancellationToken)
        {
            if (!containerChecked)
            {
                // the container is there in Azure; this creates it in a fresh Azurite
                await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
                containerChecked = true;
            }

            var conditions = expectedVersion is null
                ? new BlobRequestConditions { IfNoneMatch = ETag.All }
                : new BlobRequestConditions { IfMatch = new ETag(expectedVersion) };
            try
            {
                var written = await Blob(day).UploadAsync(BinaryData.FromString(count.ToString(CultureInfo.InvariantCulture)), new BlobUploadOptions { Conditions = conditions }, cancellationToken);
                return new DailyCount(count, written.Value.ETag.ToString());
            }
            catch (RequestFailedException error) when (error.Status is 409 or 412)
            {
                return null;
            }
        }

        private BlobClient Blob(DateOnly day) => container.GetBlobClient(day.ToString("yyyy-MM-dd'.txt'", CultureInfo.InvariantCulture));
    }
}
