using FluentAssertions;

namespace Portfolio.Assistant.Core.Tests
{
    public class AskRequestValidatorTests
    {
        private static AskValidation Validate(string? question, params AskRequestMessage[] history) =>
            AskRequestValidator.Validate(new AskRequest(question, history));

        private static AskRequestMessage[] Turns(int count) =>
            [.. Enumerable.Range(0, count).SelectMany(turn => new AskRequestMessage[] { new("user", $"Question {turn}?"), new("assistant", $"Answer {turn}.") })];

        private static AskValidation.Valid ValidOf(AskValidation validation) => validation.Should().BeOfType<AskValidation.Valid>().Subject;

        private static string DetailOf(AskValidation validation) => validation.Should().BeOfType<AskValidation.Invalid>().Subject.Detail;

        [Fact]
        public void A_question_without_history_is_valid_and_trimmed()
        {
            var valid = ValidOf(Validate("  Where does Jack work?  "));

            valid.Question.Should().Be("Where does Jack work?");
            valid.History.Should().BeEmpty();
        }

        [Fact]
        public void History_becomes_chat_messages_in_order() =>
            ValidOf(Validate("And before?", new("user", "Where does Jack work?"), new("assistant", "SPIE."))).History
                .Should().Equal(new ChatMessage(ChatRole.User, "Where does Jack work?"), new ChatMessage(ChatRole.Assistant, "SPIE."));

        [Fact]
        public void A_missing_history_counts_as_none() =>
            ValidOf(AskRequestValidator.Validate(new AskRequest("Hi?", null))).History.Should().BeEmpty();

        [Fact]
        public void A_missing_body_is_invalid() =>
            DetailOf(AskRequestValidator.Validate(null)).Should().Contain("question");

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void A_blank_question_is_invalid(string? question) =>
            DetailOf(Validate(question)).Should().Contain("question");

        [Fact]
        public void A_question_may_be_500_characters_but_not_501()
        {
            Validate(new string('a', 500)).Should().BeOfType<AskValidation.Valid>();
            DetailOf(Validate(new string('a', 501))).Should().Contain("500");
        }

        [Fact]
        public void Surrounding_whitespace_does_not_count_toward_the_question_limit() =>
            Validate($"  {new string('a', 500)}  ").Should().BeOfType<AskValidation.Valid>();

        [Fact]
        public void History_may_hold_four_turns_but_not_five()
        {
            Validate("Q?", Turns(4)).Should().BeOfType<AskValidation.Valid>();
            DetailOf(Validate("Q?", Turns(5))).Should().Contain("4 turns");
        }

        [Theory]
        [InlineData("system")]
        [InlineData("User")]
        [InlineData("")]
        [InlineData(null)]
        public void A_role_other_than_user_or_assistant_is_invalid(string? role) =>
            DetailOf(Validate("Q?", new("user", "Hi?"), new(role, "Hello."))).Should().Contain("history[1].role");

        [Theory]
        [InlineData(null)]
        [InlineData(" ")]
        public void A_history_message_without_content_is_invalid(string? content) =>
            DetailOf(Validate("Q?", new AskRequestMessage("user", content))).Should().Contain("history[0].content");

        [Fact]
        public void A_history_message_may_be_1500_characters_but_not_1501()
        {
            Validate("Q?", new AskRequestMessage("assistant", new string('a', 1_500))).Should().BeOfType<AskValidation.Valid>();
            DetailOf(Validate("Q?", new AskRequestMessage("assistant", new string('a', 1_501)))).Should().Contain("1,500");
        }
    }
}
