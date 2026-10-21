namespace Portfolio.Assistant.Core
{
    /// <summary>A question ready for the model, or why the request was turned away.</summary>
    public abstract record AskValidation
    {
        private AskValidation()
        {
        }

        /// <summary>A question the model may be asked.</summary>
        /// <param name="Question">Trimmed.</param>
        public sealed record Valid(string Question, IReadOnlyList<ChatMessage> History) : AskValidation;

        /// <summary>A request answered with a 400.</summary>
        /// <param name="Detail">Names the field and the rule it broke, for the response body.</param>
        public sealed record Invalid(string Detail) : AskValidation;
    }
}
