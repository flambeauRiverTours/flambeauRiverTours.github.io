namespace Portfolio.Assistant.Core
{
    /// <summary>List prices in dollars per million tokens; Foundry's pricing page is authoritative.</summary>
    public sealed record ModelPrice(decimal Input, decimal Output)
    {
        // a cache read costs a tenth of the input price, a five-minute cache write a quarter more
        private const decimal CacheReadFactor = 0.1m;
        private const decimal CacheWriteFactor = 1.25m;

        /// <summary>Claude Haiku 5.5, which answers visitors.</summary>
        public static ModelPrice ClaudeHaiku55 { get; } = new(0.10m, 0.50m);

        /// <summary>Claude Sonnet 5.5, the evals' grounding judge.</summary>
        public static ModelPrice ClaudeSonnet55 { get; } = new(2.00m, 10.00m);

        /// <summary>The estimated cost in dollars.</summary>
        public decimal Cost(TokenUsage tokens)
        {
            var input = tokens.Input - tokens.CacheRead - tokens.CacheWrite + (tokens.CacheRead * CacheReadFactor) + (tokens.CacheWrite * CacheWriteFactor);
            return ((input * Input) + (tokens.Output * Output)) / 1_000_000;
        }
    }
}
