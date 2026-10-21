namespace Portfolio.Assistant.Evals
{
    /// <summary>Which cases to run: the set the prompt was tuned on, or the held-out set that is never tuned on.</summary>
    internal enum EvalSet
    {
        /// <summary><c>questions.jsonl</c>: tuned against over 15 rounds, so its score is optimistic.</summary>
        Tuned,

        /// <summary><c>heldout.jsonl</c>: written blind and only ever measured, never tuned on.</summary>
        HeldOut,
    }
}
