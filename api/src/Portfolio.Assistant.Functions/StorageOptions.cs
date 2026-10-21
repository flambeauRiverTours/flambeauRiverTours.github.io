namespace Portfolio.Assistant.Functions
{
    /// <summary>The storage account for the question log and the global count, from the <c>Storage</c> settings; exactly one is set.</summary>
    internal sealed record StorageOptions
    {
        /// <summary>The storage account's blob address in Azure, reached with the Function's identity.</summary>
        public Uri? BlobServiceUri { get; init; }

        /// <summary><c>UseDevelopmentStorage=true</c> locally, for Azurite.</summary>
        public string? ConnectionString { get; init; }
    }
}
