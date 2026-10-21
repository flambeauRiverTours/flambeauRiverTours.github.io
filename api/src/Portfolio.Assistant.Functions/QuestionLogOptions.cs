namespace Portfolio.Assistant.Functions
{
    /// <summary>Where the question log goes, from the <c>QuestionLog</c> settings; exactly one is set.</summary>
    internal sealed record QuestionLogOptions
    {
        /// <summary>The storage account's blob address in Azure, reached with the Function's identity.</summary>
        public Uri? BlobServiceUri { get; init; }

        /// <summary><c>UseDevelopmentStorage=true</c> locally, for Azurite.</summary>
        public string? ConnectionString { get; init; }
    }
}
