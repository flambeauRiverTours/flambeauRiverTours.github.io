using System.Text.Json;

namespace Portfolio.Assistant.Evals
{
    /// <summary>The snake_case names enums use in the eval set, reports and options.</summary>
    internal static class EvalNames
    {
        /// <summary>The policy the JSON reader also uses, so every surface agrees.</summary>
        public static readonly JsonNamingPolicy Policy = JsonNamingPolicy.SnakeCaseLower;

        /// <summary>The value's name as written in <c>questions.jsonl</c>.</summary>
        public static string Of<T>(T value)
            where T : struct, Enum => Policy.ConvertName(value.ToString());

        /// <summary>The value with that name; null when none has it.</summary>
        public static T? Parse<T>(string name)
            where T : struct, Enum
        {
            foreach (var value in Enum.GetValues<T>())
            {
                if (Of(value) == name)
                {
                    return value;
                }
            }

            return null;
        }
    }
}
