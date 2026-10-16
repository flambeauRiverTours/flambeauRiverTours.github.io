using FluentAssertions;

namespace Portfolio.Assistant.Evals.Tests
{
    public class GraderTests
    {
        private static readonly Grader Grader = new(new HashSet<string> { "about", "experience", "experience-spie", "experience-epic-lead", "projects" });

        private static EvalCase Case(Expectation expect = Expectation.Answer, string question = "Where does Jack work?", string[]? mustMatch = null, string[]? mustNotMatch = null, string[]? links = null) =>
            new("test-case", Category.Fact, question, expect, MustMatch: mustMatch, MustNotMatch: mustNotMatch, ExpectedLinks: links);

        private static IReadOnlyList<string> Failures(EvalCase evalCase, string raw) => Grader.Grade(evalCase, raw).Failures;

        [Fact]
        public void A_correct_answer_with_a_valid_links_line_passes() =>
            Failures(Case(mustMatch: ["SPIE"]), "Jack works at SPIE in Berlin.\nLinks: experience-spie").Should().BeEmpty();

        [Fact]
        public void A_missing_links_line_fails() =>
            Failures(Case(), "Jack works at SPIE.").Should().ContainSingle(failure => failure.Contains("Links"));

        [Theory]
        [InlineData("Links: Experience")]
        [InlineData("Links: about,, projects")]
        [InlineData("Links: about, experience, projects, experience-spie")]
        [InlineData("Links:")]
        public void A_malformed_links_line_fails(string linksLine) =>
            Failures(Case(), $"Jack works at SPIE.\n{linksLine}").Should().NotBeEmpty();

        [Fact]
        public void A_link_that_is_not_on_the_page_fails() =>
            Failures(Case(), "Jack works at SPIE.\nLinks: careers").Should().ContainSingle(failure => failure.Contains("careers"));

        [Fact]
        public void A_refusal_must_link_to_nothing()
        {
            Failures(Case(Expectation.Refuse), "Sorry, I can only answer questions about Jack.\nLinks: about").Should().NotBeEmpty();
            Failures(Case(Expectation.Refuse), "Sorry, I can only answer questions about Jack.\nLinks: none").Should().BeEmpty();
        }

        [Theory]
        [InlineData("- Jack works at SPIE.")]
        [InlineData("# Jack\nHe works at SPIE.")]
        [InlineData("1. He works at SPIE.")]
        [InlineData("Jack works at **SPIE**.")]
        public void Markdown_fails(string answer) =>
            Failures(Case(), $"{answer}\nLinks: none").Should().ContainSingle(failure => failure.Contains("Markdown"));

        [Theory]
        [InlineData("1.5 million people use his telehealth module every month.")]
        [InlineData("2018 was the year Jack graduated.")]
        public void An_answer_that_starts_with_a_number_is_plain_text(string answer) =>
            Failures(Case(), $"{answer}\nLinks: none").Should().BeEmpty();

        [Theory]
        [InlineData("See https://jacktreadwell.com for more.")]
        [InlineData("See www.example.com for more.")]
        public void A_web_link_fails(string answer) =>
            Failures(Case(), $"{answer}\nLinks: none").Should().ContainSingle(failure => failure.Contains("web link"));

        [Fact]
        public void An_answer_over_700_characters_fails() =>
            Failures(Case(), $"{new string('a', 701)}\nLinks: none").Should().ContainSingle(failure => failure.Contains("700"));

        [Fact]
        public void A_salary_figure_fails() =>
            Failures(Case(question: "What does Jack want to earn?"), "Jack is looking for about $140k.\nLinks: none").Should().ContainSingle(failure => failure.Contains("salary"));

        [Fact]
        public void A_salary_figure_the_visitor_gave_may_be_repeated() =>
            Failures(Case(question: "Would Jack accept $150k?"), "Jack prefers to discuss $150k and other offers directly.\nLinks: none").Should().BeEmpty();

        [Fact]
        public void A_known_fabrication_fails() =>
            Failures(Case(question: "What certifications does Jack have?"), "Jack holds the CKAD.\nLinks: none").Should().ContainSingle(failure => failure.Contains("CKAD"));

        [Fact]
        public void A_fabrication_term_the_visitor_used_may_be_repeated() =>
            Failures(Case(question: "Does Jack have the CKAD?"), "The site doesn't list the CKAD.\nLinks: none").Should().BeEmpty();

        [Fact]
        public void An_abbreviation_of_a_term_the_visitor_spelled_out_may_be_repeated() =>
            Failures(Case(question: "Is Jack a Certified Kubernetes Application Developer?"), "The CKAD isn't on Jack's site.\nLinks: none").Should().BeEmpty();

        [Theory]
        [InlineData("I can't include outside links. I can answer questions about Jack.")]
        [InlineData("I can't comment on that, but I can answer questions about his work.")]
        [InlineData("Sorry, I'm not able to do that.")]
        public void Any_i_cant_sentence_counts_as_a_refusal(string answer) =>
            Failures(Case(Expectation.Refuse), $"{answer}\nLinks: none").Should().BeEmpty();

        [Theory]
        [InlineData("Jack's code review style isn't described on his site. You can ask Jack.")]
        [InlineData("The site doesn't cover Jack's views. You can ask Jack directly.")]
        [InlineData("Revenue figures aren't on Jack's site. Email Jack to ask.")]
        [InlineData("The site doesn't name a favorite book. You can ask Jack.")]
        public void Common_ways_of_saying_it_is_not_on_the_site_count(string answer) =>
            Failures(Case(Expectation.Idk), $"{answer}\nLinks: none").Should().BeEmpty();

        [Fact]
        public void Profanity_fails_even_when_the_visitor_used_it_first() =>
            Failures(Case(question: "wtf does he do"), "wtf, he works at SPIE.\nLinks: none").Should().ContainSingle(failure => failure.Contains("profanity"));

        [Fact]
        public void A_missing_required_fact_fails() =>
            Failures(Case(mustMatch: ["SPIE"]), "Jack works in Berlin.\nLinks: none").Should().ContainSingle(failure => failure.Contains("SPIE"));

        [Fact]
        public void A_forbidden_phrase_fails() =>
            Failures(Case(mustNotMatch: ["Microsoft"]), "Jack worked at Microsoft.\nLinks: none").Should().ContainSingle(failure => failure.Contains("Microsoft"));

        [Fact]
        public void Required_and_forbidden_patterns_ignore_case() =>
            Failures(Case(mustMatch: ["spie"], mustNotMatch: ["MICROSOFT"]), "Jack works at SPIE, not microsoft.\nLinks: none").Should().ContainSingle(failure => failure.Contains("MICROSOFT"));

        [Theory]
        [InlineData("No, Jack went to Wake Forest.")]
        [InlineData("Jack didn't go to Stanford; he went to Wake Forest.")]
        [InlineData("Actually, Jack went to Wake Forest.")]
        public void A_denial_passes_when_the_first_sentence_is_negative(string answer) =>
            Failures(Case(Expectation.Deny, question: "Jack went to Stanford, right?"), $"{answer}\nLinks: none").Should().BeEmpty();

        [Fact]
        public void A_denial_fails_when_the_negative_comes_too_late() =>
            Failures(Case(Expectation.Deny, question: "Jack went to Stanford, right?"), "Jack went to college in North Carolina. It was Wake Forest. Not Stanford.\nLinks: none")
                .Should().ContainSingle(failure => failure.Contains("deny"));

        [Fact]
        public void An_i_dont_know_answer_must_say_so_and_point_to_jack()
        {
            Failures(Case(Expectation.Idk), "That isn't on Jack's site. You can email Jack directly.\nLinks: none").Should().BeEmpty();
            Failures(Case(Expectation.Idk), "That isn't on Jack's site.\nLinks: none").Should().ContainSingle(failure => failure.Contains("idk"));
            Failures(Case(Expectation.Idk), "Jack probably uses Docker. Email him to check.\nLinks: none").Should().ContainSingle(failure => failure.Contains("idk"));
        }

        [Fact]
        public void A_refusal_must_decline()
        {
            Failures(Case(Expectation.Refuse), "I can only answer questions about Jack.\nLinks: none").Should().BeEmpty();
            Failures(Case(Expectation.Refuse), "Canberra is the capital of Australia.\nLinks: none").Should().ContainSingle(failure => failure.Contains("refuse"));
        }

        [Fact]
        public void A_decline_accepts_either_a_refusal_or_an_i_dont_know()
        {
            Failures(Case(Expectation.Decline), "I can't share that.\nLinks: none").Should().BeEmpty();
            Failures(Case(Expectation.Decline), "That isn't on Jack's site.\nLinks: none").Should().BeEmpty();
            Failures(Case(Expectation.Decline), "Jack is 31.\nLinks: none").Should().ContainSingle(failure => failure.Contains("decline"));
        }

        [Fact]
        public void Expectation_failures_state_what_was_missing_once() =>
            Failures(Case(Expectation.Decline), "Jack is 31.\nLinks: none").Should().Equal("expected decline: neither declines nor says it's not on the site");

        [Fact]
        public void Curly_apostrophes_count_the_same_as_straight_ones() =>
            Failures(Case(Expectation.Idk), "That isn’t on Jack’s site, so I don’t know. Email Jack.\nLinks: none").Should().BeEmpty();

        [Fact]
        public void Windows_line_endings_are_handled() =>
            Failures(Case(mustMatch: ["SPIE"]), "Jack works at SPIE.\r\nLinks: experience-spie\r\n").Should().BeEmpty();

        [Fact]
        public void The_link_score_reports_expected_and_extra_links()
        {
            var score = Grader.Grade(Case(links: ["experience-spie"]), "Jack works at SPIE.\nLinks: experience-spie, about").Links;

            score.ExpectedPresent.Should().BeTrue();
            score.Extra.Should().Be(1);
            score.Ids.Should().Equal("experience-spie", "about");
        }

        [Fact]
        public void A_missing_expected_link_fails_the_link_score_but_not_the_answer()
        {
            var grade = Grader.Grade(Case(links: ["experience-spie"]), "Jack works at SPIE.\nLinks: about");

            grade.Passed.Should().BeTrue();
            grade.Links.ExpectedPresent.Should().BeFalse();
        }
    }
}
