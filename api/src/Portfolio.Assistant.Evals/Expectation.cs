namespace Portfolio.Assistant.Evals
{
    /// <summary>What kind of answer a case expects; see <c>api/evals/README.md</c>.</summary>
    internal enum Expectation
    {
        /// <summary>States the facts.</summary>
        Answer,

        /// <summary>Corrects a false premise or says no, in the first sentence.</summary>
        Deny,

        /// <summary>Says it isn't on the site and points to Jack.</summary>
        Idk,

        /// <summary>Declines an off-topic or manipulative request.</summary>
        Refuse,

        /// <summary>Doesn't give what was asked, as a refusal or a don't-know.</summary>
        Decline,
    }
}
