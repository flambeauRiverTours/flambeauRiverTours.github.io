using System.Security.Cryptography;
using System.Text;

namespace Portfolio.Assistant.Core
{
    /// <summary>The rules and knowledge as one system message; build it with <see cref="Create"/>.</summary>
    /// <param name="SystemMessage">Sent with every question.</param>
    /// <param name="PromptVersion">12 hex characters of the message's SHA-256, logged with every answer.</param>
    /// <param name="Links">The anchors answers may link to.</param>
    public sealed record KnowledgeBase(string SystemMessage, string PromptVersion, IReadOnlyList<LinkTarget> Links)
    {
        /// <summary>Assembles the message from the knowledge files.</summary>
        /// <param name="systemPrompt">The rules, from <c>system-prompt.md</c>.</param>
        /// <param name="site">The page content, from <c>site.md</c>.</param>
        /// <param name="faq">The answers that aren't on the page, from <c>faq.md</c>.</param>
        /// <remarks>
        /// Line endings are normalized, so a Windows checkout and the Linux CI
        /// runner produce the same message and the same prompt version.
        /// </remarks>
        public static KnowledgeBase Create(string systemPrompt, string site, string faq, IReadOnlyList<LinkTarget> links)
        {
            var message = $"{Clean(systemPrompt)}\n\n<knowledge>\n{Clean(site)}\n\n{Clean(faq)}\n</knowledge>\n";
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(message));
            return new KnowledgeBase(message, Convert.ToHexStringLower(hash)[..12], links);
        }

        private static string Clean(string text) => text.Replace("\r\n", "\n").TrimEnd();
    }
}
