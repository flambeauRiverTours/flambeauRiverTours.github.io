using System.Text.Json;
using System.Text.Json.Serialization;

namespace Portfolio.Assistant.Evals
{
    /// <summary>Reads the eval set.</summary>
    internal static class EvalCaseReader
    {
        private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
        {
            Converters = { new JsonStringEnumConverter(EvalNames.Policy, allowIntegerValues: false) },
        };

        /// <summary>Parses JSON Lines; a misspelled category or expectation throws.</summary>
        public static IReadOnlyList<EvalCase> Parse(string jsonLines) =>
            [.. jsonLines.Split('\n').Where(line => line.Trim().Length > 0).Select(Case)];

        // Deserialize returns null only for a line that is literally "null", and npm test rejects that line
        private static EvalCase Case(string line) => JsonSerializer.Deserialize<EvalCase>(line, Options)!;
    }
}
