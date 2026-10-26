namespace Portfolio.Assistant.Functions
{
    /// <summary>The daily summary's email service, from the <c>Email</c> settings.</summary>
    internal sealed record EmailOptions
    {
        /// <summary>The Communication Services resource's address.</summary>
        public Uri? Endpoint { get; init; }

        /// <summary>The sender address on its linked domain, <c>DoNotReply@…</c>.</summary>
        public string? Sender { get; init; }

        /// <summary>The owner's address.</summary>
        public string? Recipient { get; init; }
    }
}
