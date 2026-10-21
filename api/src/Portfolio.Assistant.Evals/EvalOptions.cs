using System.Globalization;

namespace Portfolio.Assistant.Evals
{
    /// <summary>The runner's command-line options.</summary>
    /// <param name="SelfTest">Answer with each case's passExample instead of a model.</param>
    /// <param name="Deployment">The Claude deployment in the Foundry resource.</param>
    /// <param name="Runs">How many times to ask each question.</param>
    /// <param name="Parallelism">How many calls to make at once.</param>
    /// <param name="Categories">Only these categories; null runs all.</param>
    /// <param name="Ids">Only these cases; null runs all.</param>
    /// <param name="Set">Which file of cases to run.</param>
    /// <param name="JudgeDeployment">A stronger Claude deployment that lists claims the knowledge doesn't support; null skips the check.</param>
    /// <param name="JudgeCheck">Run only the judge, over the hand-labelled answers, instead of the eval.</param>
    internal sealed record EvalOptions(
        bool SelfTest = false,
        string Deployment = "claude-haiku-5-5",
        int Runs = 3,
        int Parallelism = 3,
        IReadOnlyList<Category>? Categories = null,
        IReadOnlyList<string>? Ids = null,
        EvalSet Set = EvalSet.Tuned,
        string? JudgeDeployment = null,
        bool JudgeCheck = false)
    {
        /// <summary>Printed after any bad option.</summary>
        public const string Usage = """
            Usage: dotnet run --project api/src/Portfolio.Assistant.Evals -- [options]

              --self-test            Answer with each case's passExample instead of calling a model (free; checks the pipeline)
              --deployment <name>    Claude deployment to evaluate (default: claude-haiku-5-5)
              --runs <n>             Times to ask each question; a case passes only if every run passes (default: 3)
              --parallel <n>         Calls at once; keep low for the deployment's rate limit (default: 3)
              --category <a,b>       Only these categories, e.g. trap,privacy
              --id <a,b>             Only these case ids
              --set <tuned|heldout>  questions.jsonl (default), or heldout.jsonl, which is never tuned on
              --judge <name>         Claude deployment that checks every answer's claims against the knowledge, e.g. claude-sonnet-5-5
              --judge-check          With --judge: check the judge alone against the labelled answers in judge-checks.jsonl
            """;

        /// <summary>The cases' file in <c>api/evals/</c>.</summary>
        public static string FileFor(EvalSet set) => set == EvalSet.HeldOut ? "heldout.jsonl" : "questions.jsonl";

        /// <summary>Reads the options in order; throws <see cref="UsageException"/> naming the first bad one.</summary>
        public static EvalOptions Parse(IReadOnlyList<string> args)
        {
            var options = new EvalOptions();
            var remaining = new Queue<string>(args);
            while (remaining.TryDequeue(out var name))
            {
                options = name switch
                {
                    "--self-test" => options with { SelfTest = true },
                    "--deployment" => options with { Deployment = Value(remaining, name) },
                    "--runs" => options with { Runs = PositiveInt(remaining, name) },
                    "--parallel" => options with { Parallelism = PositiveInt(remaining, name) },
                    "--category" => options with { Categories = [.. List(Value(remaining, name)).Select(CategoryNamed)] },
                    "--id" => options with { Ids = List(Value(remaining, name)) },
                    "--set" => options with { Set = SetNamed(Value(remaining, name)) },
                    "--judge" => options with { JudgeDeployment = Value(remaining, name) },
                    "--judge-check" => options with { JudgeCheck = true },
                    _ => throw new UsageException($"Unknown option: {name}"),
                };
            }

            return options;
        }

        /// <summary>Whether the category and id filters select a case.</summary>
        public bool Selects(EvalCase evalCase) =>
            (Categories is null || Categories.Contains(evalCase.Category)) && (Ids is null || Ids.Contains(evalCase.Id));

        private static string Value(Queue<string> remaining, string name) =>
            remaining.TryDequeue(out var value) ? value : throw new UsageException($"{name} needs a value");

        private static int PositiveInt(Queue<string> remaining, string name) =>
            int.TryParse(Value(remaining, name), NumberStyles.None, CultureInfo.InvariantCulture, out var number) && number >= 1
                ? number
                : throw new UsageException($"{name} needs a whole number of at least 1");

        private static EvalSet SetNamed(string name) => name switch
        {
            "tuned" => EvalSet.Tuned,
            "heldout" => EvalSet.HeldOut,
            _ => throw new UsageException($"Unknown set: {name} (tuned or heldout)"),
        };

        private static Category CategoryNamed(string name) => EvalNames.Parse<Category>(name) ?? throw new UsageException($"Unknown category: {name}");

        private static string[] List(string value) => value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }
}
