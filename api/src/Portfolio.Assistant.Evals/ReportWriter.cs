using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Portfolio.Assistant.Evals
{
    /// <summary>Writes the Markdown report committed to <c>api/evals/results/</c>.</summary>
    internal static class ReportWriter
    {
        // assumed Phi-4-mini prices; check Foundry's pricing page and edit these when the model changes
        private const decimal DollarsPerMillionInput = 0.10m;
        private const decimal DollarsPerMillionOutput = 0.40m;

        private static readonly CultureInfo Invariant = CultureInfo.InvariantCulture;

        // the same rule on every OS, unlike Path.GetInvalidFileNameChars
        private static readonly Regex UnsafeFileNameCharacters = new("[^A-Za-z0-9._-]+", RegexOptions.CultureInvariant, TimeSpan.FromSeconds(1));

        /// <summary>The file name: date, deployment and prompt version.</summary>
        public static string FileName(ReportContext context)
        {
            var date = context.Date.ToString("yyyy-MM-dd", Invariant);
            var deployment = UnsafeFileNameCharacters.Replace(context.Deployment, "-");
            return $"{date}-{deployment}-{context.PromptVersion}.md";
        }

        /// <summary>Renders the verdict, pass rates, links, cost and then each failure.</summary>
        public static string Write(IReadOnlyList<CaseResult> results, BarResult bar, ReportContext context)
        {
            var report = new StringBuilder();
            WriteHeader(report, results, bar, context);
            WriteCategories(report, results);
            WriteLinks(report, results);
            WriteCost(report, results);
            WriteFailures(report, results);
            return report.ToString();
        }

        private static void WriteHeader(StringBuilder report, IReadOnlyList<CaseResult> results, BarResult bar, ReportContext context)
        {
            var verdict = bar.Met ? "met" : "not met";
            var strictRates = string.Concat(bar.Strict.Select(rate => $", {EvalNames.Of(rate.Key)} {Percent(rate.Value)}"));
            report.AppendLine(Invariant, $"# Eval run: {context.Date.ToString("yyyy-MM-dd HH:mm", Invariant)} UTC, {context.Deployment}")
                .AppendLine()
                .AppendLine(Invariant, $"- Prompt version: `{context.PromptVersion}`")
                .AppendLine(Invariant, $"- {results.Count} cases × {context.Runs} runs; a case passes only if every run passes")
                .AppendLine(Invariant, $"- **Launch bar: {verdict}**: overall {Percent(bar.Overall)} (needs {Percent(LaunchBar.OverallMinimum)}){strictRates} (each needs 100%)")
                .AppendLine();
        }

        private static void WriteCategories(StringBuilder report, IReadOnlyList<CaseResult> results)
        {
            report.AppendLine("## Pass rate by category").AppendLine().AppendLine("| Category | Passed | Rate |").AppendLine("|---|---|---|");
            foreach (var category in results.GroupBy(result => EvalNames.Of(result.Case.Category)).OrderBy(group => group.Key, StringComparer.Ordinal))
            {
                var passed = category.Count(result => result.Passed);
                var total = category.Count();
                report.AppendLine(Invariant, $"| {category.Key} | {passed} / {total} | {Percent((double)passed / total)} |");
            }

            report.AppendLine();
        }

        private static void WriteLinks(StringBuilder report, IReadOnlyList<CaseResult> results)
        {
            var scored = results.SelectMany(result => result.Runs).Where(run => run.Grade.Links.ExpectedPresent is not null).ToList();
            var present = scored.Count(run => run.Grade.Links.ExpectedPresent == true);
            var extraPerAnswer = scored.Count == 0 ? 0 : scored.Average(run => run.Grade.Links.Extra);
            var refusalsWithLinks = results.Where(result => result.Case.Expect == Expectation.Refuse)
                .SelectMany(result => result.Runs)
                .Count(run => run.Grade.Links.Ids.Count > 0);

            report.AppendLine("## Links").AppendLine()
                .AppendLine(Invariant, $"- Expected links present: {present} / {scored.Count} runs")
                .AppendLine(Invariant, $"- Extra links per answer: {extraPerAnswer.ToString("0.0", Invariant)}")
                .AppendLine(Invariant, $"- Refusals with links: {refusalsWithLinks}")
                .AppendLine();
        }

        private static void WriteCost(StringBuilder report, IReadOnlyList<CaseResult> results)
        {
            var runs = results.SelectMany(result => result.Runs).ToList();
            long input = runs.Sum(run => run.InputTokens);
            long output = runs.Sum(run => run.OutputTokens);
            var cost = (input * DollarsPerMillionInput + output * DollarsPerMillionOutput) / 1_000_000;
            var prices = $"${DollarsPerMillionInput.ToString("0.00", Invariant)} / ${DollarsPerMillionOutput.ToString("0.00", Invariant)} per million tokens";

            report.AppendLine("## Tokens and cost").AppendLine()
                .AppendLine(Invariant, $"- {input.ToString("N0", Invariant)} input + {output.ToString("N0", Invariant)} output tokens")
                .AppendLine(Invariant, $"- About {cost.ToString("$0.00", Invariant)} at the assumed prices ({prices})")
                .AppendLine();
        }

        private static void WriteFailures(StringBuilder report, IReadOnlyList<CaseResult> results)
        {
            var failed = results.Where(result => !result.Passed).ToList();
            report.AppendLine(Invariant, $"## Failures ({failed.Count})").AppendLine();
            foreach (var result in failed)
            {
                WriteFailure(report, result);
            }
        }

        private static void WriteFailure(StringBuilder report, CaseResult result)
        {
            var evalCase = result.Case;
            report.AppendLine(Invariant, $"### {evalCase.Id} ({EvalNames.Of(evalCase.Category)}, expect {EvalNames.Of(evalCase.Expect)})").AppendLine()
                .AppendLine(Invariant, $"Question: {evalCase.Question}");
            if (evalCase.Note is not null)
            {
                report.AppendLine().AppendLine(Invariant, $"Note: {evalCase.Note}");
            }

            for (var index = 0; index < result.Runs.Count; index++)
            {
                var run = result.Runs[index];
                if (!run.Grade.Passed)
                {
                    report.AppendLine().AppendLine(Invariant, $"Run {index + 1}: {string.Join("; ", run.Grade.Failures)}").AppendLine().AppendLine(Quote(run.Raw));
                }
            }

            report.AppendLine();
        }

        private static string Quote(string text) => string.Join("\n", text.Replace("\r\n", "\n").Split('\n').Select(line => $"> {line}"));

        private static string Percent(double rate) => rate.ToString("0%", Invariant);
    }
}
