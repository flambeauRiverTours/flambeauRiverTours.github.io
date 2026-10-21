using FluentAssertions;

namespace Portfolio.Assistant.Core.Tests
{
    public class LinkExtractorTests
    {
        private static readonly LinkTarget About = new("about", "About");
        private static readonly LinkTarget Spie = new("experience-spie", "Experience › Senior Software Engineer");
        private static readonly LinkTarget EpicLead = new("experience-epic-lead", "Experience › Software Developer Team Lead");
        private static readonly LinkTarget Projects = new("projects", "Projects");
        private static readonly LinkTarget[] KnownLinks = [About, Spie, EpicLead, Projects];

        private static AnswerWithLinks Extract(string modelText) => LinkExtractor.Extract(modelText, KnownLinks);

        private static void ShouldGive(string modelText, string expectedText, params LinkTarget[] expectedLinks)
        {
            var answer = Extract(modelText);
            answer.Text.Should().Be(expectedText);
            answer.Links.Should().Equal(expectedLinks);
        }

        [Fact]
        public void A_links_line_becomes_labelled_links_and_leaves_the_answer() =>
            ShouldGive("Jack works at SPIE.\nLinks: experience-spie, about", "Jack works at SPIE.", Spie, About);

        [Fact]
        public void Links_none_gives_no_links() =>
            ShouldGive("Sorry, I can only answer questions about Jack.\nLinks: none", "Sorry, I can only answer questions about Jack.");

        [Fact]
        public void A_links_line_ending_the_last_sentence_is_found() =>
            ShouldGive("Jack works at SPIE. Links: experience-spie", "Jack works at SPIE.", Spie);

        [Fact]
        public void Ids_are_trimmed_lowercased_and_deduplicated() =>
            Extract("Jack works at SPIE.\nLinks:  Experience-SPIE ,about,experience-spie").Links.Should().Equal(Spie, About);

        [Fact]
        public void Ids_not_on_the_page_are_dropped() =>
            Extract("Jack is job hunting.\nLinks: job-search, about").Links.Should().Equal(About);

        [Fact]
        public void At_most_three_links_are_kept_in_their_order() =>
            Extract("Jack's career.\nLinks: projects, about, experience-epic-lead, experience-spie").Links.Should().Equal(Projects, About, EpicLead);

        [Fact]
        public void A_garbled_links_line_gives_no_links_but_is_still_removed() =>
            ShouldGive("Jack works at SPIE.\nLinks: the experience section", "Jack works at SPIE.");

        [Fact]
        public void The_links_line_is_found_whatever_its_case() =>
            Extract("Jack works at SPIE.\nlinks: experience-spie").Links.Should().Equal(Spie);

        [Fact]
        public void An_answer_without_a_links_line_is_unchanged() =>
            ShouldGive("Jack works at SPIE.", "Jack works at SPIE.");

        [Fact]
        public void Links_mentioned_inside_a_sentence_are_not_a_links_line() =>
            ShouldGive("The Links: about section is on the page. Jack works at SPIE.", "The Links: about section is on the page. Jack works at SPIE.");

        // the model sometimes runs on after its reply, for example into the prompt's examples
        [Fact]
        public void Text_after_the_first_links_line_is_dropped() =>
            ShouldGive("Jack works at SPIE.\nLinks: experience-spie\n\nQuestion: Where did he study?\nAnswer: Wake Forest.\nLinks: about", "Jack works at SPIE.", Spie);

        [Fact]
        public void Windows_line_endings_are_handled() =>
            ShouldGive("Jack works at SPIE.\r\nLinks: experience-spie\r\n", "Jack works at SPIE.", Spie);

        [Fact]
        public void A_markdown_link_keeps_its_text_and_loses_its_address() =>
            Extract("See [his projects](https://jacktreadwell.com/#projects) for more.\nLinks: projects").Text.Should().Be("See his projects for more.");

        [Theory]
        [InlineData("More is at https://jacktreadwell.com/#projects on the page.", "More is at on the page.")]
        [InlineData("More is at www.jacktreadwell.com on the page.", "More is at on the page.")]
        public void Bare_web_addresses_are_removed(string answer, string expected) =>
            Extract($"{answer}\nLinks: none").Text.Should().Be(expected);

        [Fact]
        public void Email_addresses_and_the_linkedin_handle_are_kept() =>
            Extract("Email jack.treadwell.dev@gmail.com or find him at linkedin.com/in/john-treadwell.\nLinks: about").Text
                .Should().Be("Email jack.treadwell.dev@gmail.com or find him at linkedin.com/in/john-treadwell.");
    }
}
