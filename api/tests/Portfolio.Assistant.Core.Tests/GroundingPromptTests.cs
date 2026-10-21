using FluentAssertions;

namespace Portfolio.Assistant.Core.Tests
{
    public class GroundingPromptTests
    {
        [Fact]
        public void The_judge_gets_the_site_and_the_faq_as_its_knowledge()
        {
            var system = GroundingPrompt.System("Jack works at SPIE.", "Jack can start in January.");

            system.Should().Contain("<knowledge>\nJack works at SPIE.\n\nJack can start in January.\n</knowledge>");
        }

        // a correct denial repeats the false claim it denies; that must not count as making it
        [Fact]
        public void The_judge_is_told_a_denial_isnt_a_claim_and_to_quote_its_evidence()
        {
            var system = GroundingPrompt.System("Site.", "FAQ.");

            system.Should().Contain("denies").And.Contain("\"evidence\"").And.Contain("\"supported\"");
        }

        [Fact]
        public void The_question_and_answer_are_marked_off_so_neither_reads_as_instructions() =>
            GroundingPrompt.User("Is Jack AWS certified?", "No, the site doesn't mention AWS.")
                .Should().Be("<question>\nIs Jack AWS certified?\n</question>\n<answer>\nNo, the site doesn't mention AWS.\n</answer>");
    }
}
