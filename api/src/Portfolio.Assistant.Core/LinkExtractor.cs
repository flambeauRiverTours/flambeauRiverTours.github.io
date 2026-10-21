using System.Text.RegularExpressions;

namespace Portfolio.Assistant.Core
{
    /// <summary>Splits the model's reply into the answer text and its page links.</summary>
    public static class LinkExtractor
    {
        private const int MaxLinks = 3;
        private const RegexOptions Options = RegexOptions.IgnoreCase | RegexOptions.CultureInvariant;

        private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(1);

        // lenient on its own line, so a garbled line is still taken off the answer
        private static readonly Regex OwnLinksLine = new(@"^\s*Links:(?<ids>.*)$", Options, Timeout);

        // strict when it ends a sentence, so prose that mentions "Links:" is left alone
        private static readonly Regex TrailingLinks = new(@"\s+Links:\s*(?<ids>none|[a-z0-9-]+(\s*,\s*[a-z0-9-]+)*)\s*$", Options, Timeout);

        private static readonly Regex MarkdownLink = new(@"\[(?<text>[^\]]+)\]\([^)]*\)", Options, Timeout);
        private static readonly Regex WebAddress = new(@"(https?://|www\.)\S+", Options, Timeout);
        private static readonly Regex RepeatedSpaces = new(@"[ \t]{2,}", Options, Timeout);

        /// <summary>Takes the <c>Links:</c> line off the reply and keeps the IDs that are on the page.</summary>
        /// <param name="modelText">The raw reply, ending with a <c>Links:</c> line when the model followed the rules.</param>
        /// <param name="knownLinks">Every anchor on the page, from <c>links.json</c>.</param>
        public static AnswerWithLinks Extract(string modelText, IReadOnlyList<LinkTarget> knownLinks)
        {
            var (answer, ids) = SplitAtLinksLine(modelText.Replace("\r\n", "\n"));
            return new AnswerWithLinks(ToPlainText(answer), PickLinks(ids, knownLinks));
        }

        // the answer ends at the first links line; anything after it is the model running on
        private static (string Answer, string Ids) SplitAtLinksLine(string text)
        {
            var lines = text.Split('\n');
            for (var index = 0; index < lines.Length; index++)
            {
                if (OwnLinksLine.Match(lines[index]) is { Success: true } ownLine)
                {
                    return (string.Join('\n', lines[..index]), ownLine.Groups["ids"].Value);
                }

                if (TrailingLinks.Match(lines[index]) is { Success: true } trailing)
                {
                    return (string.Join('\n', lines[..index].Append(lines[index][..trailing.Index])), trailing.Groups["ids"].Value);
                }
            }

            return (text, "");
        }

        private static IReadOnlyList<LinkTarget> PickLinks(string ids, IReadOnlyList<LinkTarget> knownLinks) =>
        [
            .. ids.Split(',')
                .Select(id => id.Trim().ToLowerInvariant())
                .Distinct()
                .Select(id => knownLinks.FirstOrDefault(link => link.Id == id))
                .OfType<LinkTarget>()
                .Take(MaxLinks),
        ];

        // the drawer shows plain text and its own links, so addresses in the answer are noise or worse
        private static string ToPlainText(string answer)
        {
            var withoutMarkdownLinks = MarkdownLink.Replace(answer, "${text}");
            var withoutAddresses = WebAddress.Replace(withoutMarkdownLinks, "");
            return RepeatedSpaces.Replace(withoutAddresses, " ").Trim();
        }
    }
}
