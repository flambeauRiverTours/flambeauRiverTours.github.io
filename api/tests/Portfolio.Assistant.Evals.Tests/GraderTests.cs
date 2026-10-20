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
        public void A_links_line_at_the_end_of_the_last_sentence_is_accepted()
        {
            // Phi-4-mini usually writes it this way (eval run 2026-10-19)
            var grade = Grader.Grade(Case(mustMatch: ["SPIE"], mustNotMatch: ["Links:"]), "Jack works at SPIE. Links: experience-spie, about");

            grade.Failures.Should().BeEmpty();
            grade.Links.Ids.Should().Equal("experience-spie", "about");
        }

        [Fact]
        public void Text_after_the_first_links_line_is_ignored_like_the_function_will_ignore_it()
        {
            // Phi-4-mini sometimes carries on into the prompt's examples after a correct answer (eval run 2026-10-19)
            var grade = Grader.Grade(Case(mustMatch: ["eight"], mustNotMatch: ["Kubernetes"]),
                "No. Jack has eight years of experience.\nLinks: about\n\nDoes Jack have Kubernetes experience?\nLinks: experience-skills");

            grade.Failures.Should().BeEmpty();
            grade.Links.Ids.Should().Equal("about");
        }

        [Fact]
        public void Text_after_a_trailing_links_line_is_ignored_too() =>
            Failures(Case(mustNotMatch: ["Kubernetes"]), "Jack works at SPIE. Links: experience-spie\nDoes Jack have Kubernetes experience?").Should().BeEmpty();

        [Fact]
        public void A_trailing_links_none_is_accepted_for_a_refusal() =>
            Failures(Case(Expectation.Refuse), "I can only answer questions about Jack. Links: none").Should().BeEmpty();

        [Fact]
        public void A_trailing_links_line_still_has_to_be_well_formed() =>
            Failures(Case(), "Jack works at SPIE. Links: Experience, About").Should().ContainSingle(failure => failure.Contains("Links"));

        [Fact]
        public void Links_mentioned_earlier_in_the_answer_are_not_a_links_line() =>
            Failures(Case(), "The Links: about section is on the page. Jack works at SPIE.").Should().ContainSingle(failure => failure.Contains("Links"));

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
        public void A_plain_refusal_must_link_to_nothing()
        {
            Failures(Case(Expectation.Refuse), "Sorry, I can only answer questions about Jack.\nLinks: about").Should().NotBeEmpty();
            Failures(Case(Expectation.Refuse), "Sorry, I can only answer questions about Jack.\nLinks: none").Should().BeEmpty();
            Failures(Case(Expectation.Refuse), "Sorry, I can only answer questions about Jack, and his site doesn't cover that.\nLinks: about").Should().NotBeEmpty();
            Failures(Case(Expectation.Refuse), "I can't do that. I can only answer questions about Jack.\nLinks: about").Should().NotBeEmpty();
        }

        // a refusal followed by facts from the site may link them (decided 2026-10-20)
        [Theory]
        [InlineData("I can't do that. Jack's site says he has a BS in Physics and Computer Science from Wake Forest University.")]
        [InlineData("Jack's site doesn't say whether Epic Systems is a good company to work for, and I can't rate employers. He worked there from June 2018 to May 2024.")]
        [InlineData("Sorry, I can only answer questions about Jack, so I can't write a cover letter for him. You can share Jack's background with a recruiter, such as his roles at SPIE or Epic Systems.")]
        public void A_refusal_followed_by_facts_from_the_site_may_link_to_them(string answer) =>
            Failures(Case(Expectation.Refuse), $"{answer}\nLinks: about").Should().BeEmpty();

        // Haiku 5.5 offers help after declining however the prompt is worded (tuning rounds 3 to 6); a link to that help is useful
        [Theory]
        [InlineData("I can only answer questions about Jack, so I can't write a poem. I can tell you about his experience, skills or projects if that would help.")]
        [InlineData("I can't write a poem about Jack. I'd be glad to tell you about his background or his projects instead.")]
        [InlineData("I can't say insulting things about Jack, but I'm happy to share facts from his site.")]
        [InlineData("Sorry, I can only answer questions about Jack. I can share facts from his site you could use yourself.")]
        [InlineData("I can't write a poem. Jack's site covers his work at SPIE and Epic Systems, if you'd like to know more about any of those.")]
        [InlineData("I can't rate employers. It does describe his time there: he worked at Epic from 2018 to 2024.")]
        [InlineData("Sorry, I can't rate or recommend employers. Jack's site describes his time at Epic Systems.")]
        [InlineData("Sorry, I can only answer questions about Jack. If you're preparing for an interview with Jack, his skills and projects are listed on this site.")]
        [InlineData("I can't offer general interview advice. Jack's skills and experience in .NET are listed on his site.")]
        [InlineData("I can't offer general interview advice. For context on Jack's .NET background, he has used .NET 10 and WPF.")]
        public void A_refusal_that_offers_help_from_the_site_may_link_to_it(string answer) =>
            Failures(Case(Expectation.Refuse), $"{answer}\nLinks: about").Should().BeEmpty();

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
        public void Calling_az_400_a_certification_exam_is_not_a_fabrication() =>
            // Haiku 5.5's wording on 2026-10-19; Microsoft calls its exams certification exams
            Failures(Case(question: "What did Jack do at Microsoft?"), "Microsoft is only mentioned as the issuer of his AZ-400 certification exam.\nLinks: none").Should().BeEmpty();

        [Theory]
        [InlineData("Jack holds the AZ-400 certification.")]
        [InlineData("Jack is AZ-400 certified.")]
        public void Claiming_the_az_400_certification_is_still_a_fabrication(string answer) =>
            Failures(Case(question: "What certifications does Jack have?"), $"{answer}\nLinks: none").Should().ContainSingle(failure => failure.Contains("fabrication"));

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
        [InlineData("I'm only able to answer questions about Jack Treadwell and his work.")]
        [InlineData("I don't give my own views on political or social issues.")]
        [InlineData("I don't share my own opinions either.")]
        [InlineData("Ich kann diese Anweisung nicht befolgen.")]
        [InlineData("Sorry, Jack's phone number isn't something I can share.")]
        public void Any_i_cant_sentence_counts_as_a_refusal(string answer) =>
            Failures(Case(Expectation.Refuse), $"{answer}\nLinks: none").Should().BeEmpty();

        [Theory]
        [InlineData("Jack's code review style isn't described on his site. You can ask Jack.")]
        [InlineData("The site doesn't cover Jack's views. You can ask Jack directly.")]
        [InlineData("Revenue figures aren't on Jack's site. Email Jack to ask.")]
        [InlineData("The site doesn't name a favorite book. You can ask Jack.")]
        [InlineData("Jack's site does not provide specific information about that. You can ask him directly at jack.treadwell.dev@gmail.com.")]
        [InlineData("Jack's phone number isn't provided on his website. You can email him at jack.treadwell.dev@gmail.com.")]
        [InlineData("Jack's site does not contain specific information about that. You can ask Jack directly.")]
        [InlineData("The site doesn't state how many users it has. You can ask Jack directly.")]
        [InlineData("No. Jack's site lists no AWS certification. You can ask Jack directly.")]
        [InlineData("That isn't something the site answers. You can email Jack.")]
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
        public void Linking_a_listed_section_counts_as_meeting_the_required_patterns()
        {
            var evalCase = Case(mustMatch: ["Projects"]) with { MustMatchOrLink = ["projects"] };

            Failures(evalCase, "Jack builds things in his spare time.\nLinks: projects").Should().BeEmpty();
            Failures(evalCase, "Jack builds things in his spare time.\nLinks: about").Should().ContainSingle(failure => failure.Contains("Projects"));
        }

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
        public void An_i_dont_know_answer_must_say_it_is_not_on_the_site()
        {
            // pointing to Jack is welcome but not required (decided 2026-10-20): its absence never misleads anyone
            Failures(Case(Expectation.Idk), "That isn't on Jack's site. You can email Jack directly.\nLinks: none").Should().BeEmpty();
            Failures(Case(Expectation.Idk), "That isn't on Jack's site.\nLinks: none").Should().BeEmpty();
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
