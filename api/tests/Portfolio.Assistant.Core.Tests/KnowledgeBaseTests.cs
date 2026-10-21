using FluentAssertions;

namespace Portfolio.Assistant.Core.Tests
{
    public class KnowledgeBaseTests
    {
        private static readonly LinkTarget[] Links = [new("about", "About")];

        private static KnowledgeBase Create(string rules = "Rules.", string site = "# [about] About\nJack.", string faq = "## FAQ") =>
            KnowledgeBase.Create(rules, site, faq, Links);

        [Fact]
        public void The_system_message_is_the_rules_followed_by_the_knowledge_in_tags() =>
            Create().SystemMessage.Should().Be("Rules.\n\n<knowledge>\n# [about] About\nJack.\n\n## FAQ\n</knowledge>\n");

        [Fact]
        public void Trailing_whitespace_in_the_files_does_not_leak_into_the_message() =>
            Create(rules: "Rules.\n\n", site: "Site\n", faq: "FAQ\r\n").SystemMessage.Should().Be("Rules.\n\n<knowledge>\nSite\n\nFAQ\n</knowledge>\n");

        [Fact]
        public void The_prompt_version_is_12_lowercase_hex_characters() =>
            Create().PromptVersion.Should().MatchRegex("^[0-9a-f]{12}$");

        [Fact]
        public void The_same_files_give_the_same_prompt_version() =>
            Create().PromptVersion.Should().Be(Create().PromptVersion);

        [Fact]
        public void Changing_any_file_changes_the_prompt_version()
        {
            var original = Create().PromptVersion;

            new[] { Create(rules: "Other rules.").PromptVersion, Create(site: "Other site").PromptVersion, Create(faq: "Other FAQ").PromptVersion }
                .Should().NotContain(original).And.OnlyHaveUniqueItems();
        }

        [Fact]
        public void Windows_line_endings_give_the_same_message_and_version_as_unix_ones()
        {
            var unix = Create(rules: "Rule 1.\nRule 2.", site: "A\nB", faq: "C\nD");
            var windows = Create(rules: "Rule 1.\r\nRule 2.", site: "A\r\nB", faq: "C\r\nD");

            windows.SystemMessage.Should().Be(unix.SystemMessage);
            windows.PromptVersion.Should().Be(unix.PromptVersion);
        }

        // a missing or emptied knowledge file must stop the Function starting, not let it answer from nothing
        [Fact]
        public void A_blank_knowledge_file_is_rejected_by_name()
        {
            FluentActions.Invoking(() => Create(rules: " \n")).Should().Throw<ArgumentException>().Which.ParamName.Should().Be("systemPrompt");
            FluentActions.Invoking(() => Create(site: "")).Should().Throw<ArgumentException>().Which.ParamName.Should().Be("site");
            FluentActions.Invoking(() => Create(faq: "\r\n")).Should().Throw<ArgumentException>().Which.ParamName.Should().Be("faq");
        }

        [Fact]
        public void The_links_are_kept() =>
            Create().Links.Should().Equal(Links);

        [Fact]
        public void Loading_reads_the_four_knowledge_files_by_name()
        {
            var files = new Dictionary<string, string>
            {
                ["system-prompt.md"] = "Rules.",
                ["site.md"] = "# [about] About\nJack.",
                ["faq.md"] = "## FAQ",
                ["links.json"] = """[{ "id": "about", "label": "About" }]""",
            };

            var loaded = KnowledgeBase.Load(fileName => files[fileName]);

            loaded.SystemMessage.Should().Be(Create().SystemMessage);
            loaded.Links.Should().Equal(Links);
        }

        [Theory]
        [InlineData("")]
        [InlineData("[]")]
        [InlineData("null")]
        public void Loading_a_links_file_without_links_is_rejected(string linksJson) =>
            FluentActions.Invoking(() => KnowledgeBase.Load(fileName => fileName == "links.json" ? linksJson : "Text."))
                .Should().Throw<InvalidDataException>().WithMessage("*links.json*");
    }
}
