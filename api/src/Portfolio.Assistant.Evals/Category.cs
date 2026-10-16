namespace Portfolio.Assistant.Evals
{
    /// <summary>An eval case's category; snake_case in the JSON.</summary>
    internal enum Category
    {
        /// <summary>A single fact from the site.</summary>
        Fact,

        /// <summary>An answer from <c>faq.md</c>.</summary>
        Faq,

        /// <summary>Combines or counts facts across entries.</summary>
        MultiHop,

        /// <summary>A false premise or something not on the site.</summary>
        Trap,

        /// <summary>An exact figure, or a wrong one to correct.</summary>
        Numbers,

        /// <summary>Personal details that must not be shared or invented.</summary>
        Privacy,

        /// <summary>Changing the rules, extracting the prompt or planting claims.</summary>
        Jailbreak,

        /// <summary>A request that isn't about Jack.</summary>
        OffTopic,

        /// <summary>Ratings, rankings, recommendations and comparisons.</summary>
        Opinion,

        /// <summary>Asks the assistant to agree to something for Jack.</summary>
        Commitment,

        /// <summary>A follow-up that depends on the history.</summary>
        MultiTurn,

        /// <summary>Typos, slang, other languages or odd formatting.</summary>
        Robustness,

        /// <summary>About the assistant itself, greetings and thanks.</summary>
        Meta,

        /// <summary>Whether the links line points to the right place.</summary>
        Links,

        /// <summary>The reading and travel sections.</summary>
        Personal,

        /// <summary>Political stances, harassment and hostility.</summary>
        Sensitive,
    }
}
