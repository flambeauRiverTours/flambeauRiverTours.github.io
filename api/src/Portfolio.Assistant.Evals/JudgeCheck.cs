using System.Globalization;
using System.Text;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Evals
{
    /// <summary>Runs the grounding judge alone over hand-labelled answers, so a change to its prompt is measured before a full run.</summary>
    internal static class JudgeCheck
    {
        private static readonly CultureInfo Invariant = CultureInfo.InvariantCulture;

        /// <summary>Judges every answer once, a few at a time; results keep the cases' order.</summary>
        public static async Task<IReadOnlyList<JudgeCheckResult>> RunAsync(IGroundingJudge judge, IReadOnlyList<JudgeCheckCase> cases, int parallelism, CancellationToken cancellationToken)
        {
            using var gate = new SemaphoreSlim(parallelism);
            return await Task.WhenAll(cases.Select(async check =>
            {
                await gate.WaitAsync(cancellationToken);
                try
                {
                    return new JudgeCheckResult(check, await judge.JudgeAsync(check.Question, check.Answer, cancellationToken));
                }
                finally
                {
                    gate.Release();
                }
            }));
        }

        /// <summary>The agreement count, then each false positive, miss and unjudged answer with the judge's words and the label's reason.</summary>
        public static string Write(IReadOnlyList<JudgeCheckResult> results, string judgeDeployment)
        {
            var report = new StringBuilder()
                .AppendLine(Invariant, $"# Judge check: {judgeDeployment}")
                .AppendLine()
                .AppendLine(Invariant, $"- Agreed: {results.Count(result => result.Agrees)} of {results.Count}")
                .AppendLine();
            Section(report, "False positives", results.Where(result => result.Verdict.Unsupported is { Count: > 0 } && !result.Case.Unsupported));
            Section(report, "Missed", results.Where(result => result.Verdict.Unsupported is { Count: 0 } && result.Case.Unsupported));
            Section(report, "Not judged", results.Where(result => result.Verdict.Unsupported is null));
            return report.ToString();
        }

        private static void Section(StringBuilder report, string title, IEnumerable<JudgeCheckResult> results)
        {
            var listed = results.ToList();
            report.AppendLine(Invariant, $"## {title} ({listed.Count})").AppendLine();
            foreach (var result in listed)
            {
                var judged = result.Verdict.Unsupported is { } claims ? string.Join("; ", claims) : result.Verdict.NoVerdictReason ?? "no reason given";
                report.AppendLine(Invariant, $"- **{result.Case.Id}**: judge: {judged}. Label: {result.Case.Note}.");
            }

            report.AppendLine();
        }
    }

    /// <summary>The judge's verdict on one labelled answer.</summary>
    internal sealed record JudgeCheckResult(JudgeCheckCase Case, GroundingVerdict Verdict)
    {
        /// <summary>The judge gave a verdict, and it flagged the answer exactly when the label says it should.</summary>
        public bool Agrees => Verdict.Unsupported is { } claims && claims.Count > 0 == Case.Unsupported;
    }
}
