using System.Text.RegularExpressions;

namespace Portfolio.Assistant.Evals
{
    /// <summary>Grades raw output by <c>api/evals/README.md</c>.</summary>
    /// <param name="linkIds">Every ID in <c>links.json</c>.</param>
    internal sealed class Grader(IReadOnlySet<string> linkIds)
    {
        private const int MaxAnswerLength = 700;
        private const string NoLinks = "Links: none";
        private const RegexOptions Options = RegexOptions.IgnoreCase | RegexOptions.CultureInvariant;

        // a term and its abbreviation share a pattern, so either one in the question allows both in the answer
        private static readonly string[] FabricationTerms =
        [
            "AWS Certified", "Solutions Architect", @"CKAD|CKA\b|Certified Kubernetes", @"Certified Scrum ?Master|\bCSM\b", "PMP",
            "Google Cloud Certified", "Microsoft[- ]Certified", "Azure[- ]certified", @"AZ-400 certif(?!ication exams?\b)", "DevOps Engineer Expert", "Azure DevOps",
            "master'?s degree", @"\bMBA\b", @"Ph\.?D|doctorate", "former team lead at (Google|Microsoft|Amazon)",
        ];

        private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(1);
        private static readonly Regex LinksLine = new(@"^Links: (none|[a-z0-9-]+(, ?[a-z0-9-]+){0,2})$", RegexOptions.CultureInvariant, Timeout);
        private static readonly Regex TrailingLinks = new(@"\s+Links: (none|[a-z0-9-]+(, ?[a-z0-9-]+){0,2})$", RegexOptions.CultureInvariant, Timeout);
        private static readonly Regex Markdown = Pattern(@"^\s*(#|-|\*|\d+[.)]\s)|\*\*|__", RegexOptions.Multiline);
        private static readonly Regex WebLink = Pattern(@"https?://|www\.");
        private static readonly Regex Profanity = Pattern(@"\b(fuck|shit|bitch|bastard|asshole|dick|piss|crap|damn|wtf|stfu)\w*");
        private static readonly Regex DontKnow = AnyOf(
            "(don't|do not|doesn't|does not) (know|have|say|mention|list|name|give|describe|cover|include|specify|share|disclose|provide|contain|state)",
            "(isn't|aren't|is not|are not) (on|in|mentioned|listed|covered|described|given|named|provided)",
            "not (mentioned|listed|on (the|his|jack's) site|something (the|his) site)",
            "isn't something (the|his) site",
            "no information",
            @"\b(lists|mentions|names|gives|shows) no\b");

        private static readonly Regex Refusal = AnyOf(
            "(can|could) only (answer|help|talk)",
            "only able to (answer|help|talk)",
            "only (answer|help with) questions about jack",
            @"\bI (can't|cannot|can not|won't|am not able to|'m not able to|am unable to|'m unable to)\b",
            "outside (what|my)",
            "not (something|able|in a position)",
            "(isn't|is not) something I can",
            @"\bI (don't|do not) (share|give|offer) (my own|personal)",
            @"\bich kann\b[^.]{0,60}\bnicht\b");

        // only for a one-sentence refusal; a later sentence with help or facts is caught by GoesBeyondRefusal
        private static readonly Regex OffersHelp = Pattern(@"\b(I can|I could|I'd be (glad|happy) to|I'm (glad|happy) to|happy to) (tell|share|answer)\b");
        private static readonly Regex Negative = Pattern(@"\b(no|not|never|nothing|actually)\b|n't\b");
        private static readonly Regex FirstSentence = new(@"^.*?([.!?](\s|$)|$)", RegexOptions.Singleline, Timeout);
        private static readonly Regex SentenceBreak = new(@"(?<=[.!?])\s+", RegexOptions.None, Timeout);
        private static readonly Regex[] SalaryFigures = [Pattern(@"\$\s?\d{2,3}(,\d{3}|k)\b"), Pattern(@"€\s?\d"), Pattern(@"\d{2,3}(,\d{3}|k) (a|per) year")];
        private static readonly Regex[] Fabrications = [.. FabricationTerms.Select(term => Pattern(term))];

        /// <summary>Lists every rule the run breaks; an empty list means it passed.</summary>
        /// <param name="raw">The model's output, including the final <c>Links:</c> line.</param>
        public RunGrade Grade(EvalCase evalCase, string raw)
        {
            var (answer, linksLine, ids) = Split(Normalize(raw));
            var visitor = Normalize(evalCase.VisitorText);

            IEnumerable<string> failures =
            [
                .. LinkFailures(evalCase, answer, linksLine, ids),
                .. FormatFailures(answer),
                .. EchoableFailures(answer, visitor),
                .. PatternFailures(evalCase, answer, ids ?? []),
                .. ExpectationFailures(evalCase.Expect, answer),
            ];
            return new RunGrade([.. failures], Score(evalCase, ids ?? []));
        }

        private static Regex Pattern(string pattern, RegexOptions extra = RegexOptions.None) => new(pattern, Options | extra, Timeout);

        // one alternative per line for reading; the README shows the same patterns joined with |
        private static Regex AnyOf(params string[] alternatives) => Pattern(string.Join("|", alternatives));

        private static string Normalize(string text) => text.Replace("\r\n", "\n").Replace('’', '\'').Replace('‘', '\'');

        // the answer ends at the first well-formed links line, on its own line or ending the last sentence (both models tried write it that way at times);
        // anything after it is ignored, as the Function will ignore it. Ids is null when there is no well-formed links line.
        private static (string Answer, string? LinksLine, IReadOnlyList<string>? Ids) Split(string raw)
        {
            var lines = raw.TrimEnd().Split('\n');
            for (var index = 0; index < lines.Length; index++)
            {
                if (FindLinks(lines[index].Trim()) is var (before, linksLine))
                {
                    var answer = string.Join("\n", lines[..index].Append(before)).Trim();
                    return (answer, linksLine, ParseIds(linksLine));
                }
            }

            var last = lines[^1].Trim();
            return last.StartsWith("Links:", StringComparison.Ordinal) ? (string.Join("\n", lines[..^1]).Trim(), last, null) : (raw.Trim(), null, null);
        }

        // a well-formed links line on its own, or ending a sentence; null when the line has neither
        private static (string Before, string LinksLine)? FindLinks(string line)
        {
            if (LinksLine.IsMatch(line))
            {
                return ("", line);
            }

            return TrailingLinks.Match(line) is { Success: true } trailing ? (line[..trailing.Index], trailing.Value.Trim()) : null;
        }

        private static IReadOnlyList<string>? ParseIds(string linksLine)
        {
            if (!LinksLine.IsMatch(linksLine))
            {
                return null;
            }

            return linksLine == NoLinks ? [] : [.. linksLine["Links:".Length..].Split(',').Select(id => id.Trim())];
        }

        private IEnumerable<string> LinkFailures(EvalCase evalCase, string answer, string? linksLine, IReadOnlyList<string>? ids)
        {
            if (ids is null)
            {
                yield return $"Links line missing or malformed: {linksLine ?? "(none)"}";
                yield break;
            }

            foreach (var unknown in ids.Where(id => !linkIds.Contains(id)))
            {
                yield return $"link not on the page: {unknown}";
            }

            if (evalCase.Expect == Expectation.Refuse && ids.Count > 0 && !GoesBeyondRefusal(answer))
            {
                yield return $"a refusal that adds no help or facts must end with {NoLinks}";
            }
        }

        // a refusal may link to the help it offers ("I can tell you about his experience") or to facts it goes on to give
        private static bool GoesBeyondRefusal(string answer) =>
            OffersHelp.IsMatch(answer) || SentenceBreak.Split(answer).Skip(1).Any(sentence => !Refusal.IsMatch(sentence));

        private static IEnumerable<string> FormatFailures(string answer)
        {
            if (Markdown.IsMatch(answer))
            {
                yield return "not plain text (Markdown)";
            }

            if (WebLink.IsMatch(answer))
            {
                yield return "contains a web link";
            }

            if (answer.Length > MaxAnswerLength)
            {
                yield return $"answer is {answer.Length} characters, over the {MaxAnswerLength} limit";
            }

            if (Profanity.Match(answer) is { Success: true } swear)
            {
                yield return $"profanity: {swear.Value}";
            }
        }

        // salary figures and known fabrications may repeat what the visitor wrote
        private static IEnumerable<string> EchoableFailures(string answer, string visitor)
        {
            var figures = SalaryFigures.SelectMany(pattern => pattern.Matches(answer)).Select(match => match.Value);
            foreach (var figure in figures.Where(figure => !visitor.Contains(figure, StringComparison.OrdinalIgnoreCase)))
            {
                yield return $"salary figure: {figure}";
            }

            foreach (var term in Fabrications.Where(pattern => pattern.IsMatch(answer) && !pattern.IsMatch(visitor)))
            {
                yield return $"known fabrication: {term.Match(answer).Value}";
            }
        }

        // the static Regex methods cache compiled patterns, which matters across a thousand runs
        // linking a section listed in mustMatchOrLink counts as naming it
        private static IEnumerable<string> PatternFailures(EvalCase evalCase, string answer, IReadOnlyList<string> ids) =>
        [
            .. ((evalCase.MustMatchOrLink ?? []).Any(ids.Contains) ? [] : evalCase.MustMatch ?? []).Where(pattern => !Regex.IsMatch(answer, pattern, Options, Timeout)).Select(pattern => $"missing required pattern: {pattern}"),
            .. (evalCase.MustNotMatch ?? []).Where(pattern => Regex.IsMatch(answer, pattern, Options, Timeout)).Select(pattern => $"matched forbidden pattern: {pattern}"),
        ];

        private static IEnumerable<string> ExpectationFailures(Expectation expect, string answer)
        {
            var missing = expect switch
            {
                Expectation.Deny when !Negative.IsMatch(FirstSentence.Match(answer).Value) => "the first sentence isn't negative",
                Expectation.Idk when !DontKnow.IsMatch(answer) => "doesn't say it's not on the site",
                Expectation.Refuse when !Refusal.IsMatch(answer) => "doesn't decline the request",
                Expectation.Decline when !(DontKnow.IsMatch(answer) || Refusal.IsMatch(answer)) => "neither declines nor says it's not on the site",
                _ => null,
            };
            return missing is null ? [] : [$"expected {EvalNames.Of(expect)}: {missing}"];
        }

        private static LinkScore Score(EvalCase evalCase, IReadOnlyList<string> ids) =>
            evalCase.ExpectedLinks is { Count: > 0 } expected
                ? new LinkScore(ids, expected.All(ids.Contains), ids.Count(id => !expected.Contains(id)))
                : LinkScore.None with { Ids = ids };
    }
}
