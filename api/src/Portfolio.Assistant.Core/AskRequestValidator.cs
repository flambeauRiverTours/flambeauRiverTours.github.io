using System.Globalization;

namespace Portfolio.Assistant.Core
{
    /// <summary>Checks an ask request against the limits the Function accepts.</summary>
    public static class AskRequestValidator
    {
        private const int MaxQuestionLength = 500;
        private const int MaxHistoryTurns = 4;
        private const int MaxMessageLength = 1_500;

        /// <summary>Turns a request into a question for the model, or says what is wrong with it.</summary>
        /// <param name="request">Null when the body isn't JSON of the right shape.</param>
        public static AskValidation Validate(AskRequest? request)
        {
            if (request?.Question?.Trim() is not { Length: > 0 } question)
            {
                return Invalid("question is required.");
            }

            if (question.Length > MaxQuestionLength)
            {
                return Invalid($"question is longer than {MaxQuestionLength} characters.");
            }

            var history = request.History ?? [];
            // a turn is a question and its answer
            if (history.Count > 2 * MaxHistoryTurns)
            {
                return Invalid($"history has more than {MaxHistoryTurns} turns.");
            }

            var problem = history.Select(ProblemWith).Concat(history.Select(OutOfTurn)).FirstOrDefault(found => found is not null)
                ?? (history.Count % 2 == 1 ? "history must end with an assistant message." : null);
            return problem is null ? new AskValidation.Valid(question, [.. history.Select(ToChatMessage)]) : Invalid(problem);
        }

        // the API is stateless, so assistant turns are whatever the client sends; only the drawer's alternating
        // shape is accepted, so a run of forged answers can't read to the model as its own words
        private static string? OutOfTurn(AskRequestMessage message, int index)
        {
            var expected = index % 2 == 0 ? "user" : "assistant";
            return message.Role == expected ? null : $"history[{index}].role must be \"{expected}\": messages alternate, starting with a question.";
        }

        private static string? ProblemWith(AskRequestMessage message, int index)
        {
            if (message.Role is not ("user" or "assistant"))
            {
                return $"history[{index}].role must be \"user\" or \"assistant\".";
            }

            if (string.IsNullOrWhiteSpace(message.Content))
            {
                return $"history[{index}].content is required.";
            }

            return message.Content.Length > MaxMessageLength
                ? string.Create(CultureInfo.InvariantCulture, $"history[{index}].content is longer than {MaxMessageLength:N0} characters.")
                : null;
        }

        // only called once every message has passed ProblemWith, so the content is there
        private static ChatMessage ToChatMessage(AskRequestMessage message) =>
            new(message.Role == "user" ? ChatRole.User : ChatRole.Assistant, message.Content!);

        private static AskValidation.Invalid Invalid(string detail) => new(detail);
    }
}
