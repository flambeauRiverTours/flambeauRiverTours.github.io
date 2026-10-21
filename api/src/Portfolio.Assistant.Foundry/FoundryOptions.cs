using System.ComponentModel.DataAnnotations;

namespace Portfolio.Assistant.Foundry
{
    /// <summary>The Function's model settings, from the <c>Foundry</c> section (<c>Foundry__Endpoint</c> and so on).</summary>
    public sealed record FoundryOptions
    {
        /// <summary>The settings section these bind from.</summary>
        public const string SectionName = "Foundry";

        /// <summary>The longest a visitor may wait for an answer, retries included.</summary>
        public const int MaxWaitSeconds = 30;

        /// <summary>The resource's <c>https://&lt;resource&gt;.services.ai.azure.com</c> address.</summary>
        public Uri? Endpoint { get; init; }

        /// <summary>The Claude deployment in that resource.</summary>
        [Required]
        public string Deployment { get; init; } = "claude-haiku-5-5";

        /// <summary>Retries for 408, 429 and 5xx responses.</summary>
        [Range(0, 2)]
        public int MaxRetries { get; init; } = 1;

        /// <summary>How long one attempt may take.</summary>
        [Range(1, MaxWaitSeconds)]
        public int TimeoutSeconds { get; init; } = 12;
    }
}
