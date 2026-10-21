using FluentAssertions;

namespace Portfolio.Assistant.Core.Tests
{
    public class PromptBuilderTests
    {
        private static readonly KnowledgeBase Knowledge = KnowledgeBase.Create("Rules.", "Site", "FAQ", []);

        [Fact]
        public void The_system_message_comes_from_the_knowledge_base() =>
            PromptBuilder.Build(Knowledge, [], "Hi").System.Should().Be(Knowledge.SystemMessage);

        [Fact]
        public void A_first_question_is_the_only_message()
        {
            PromptBuilder.Build(Knowledge, [], "Where does Jack work?").Messages
                .Should().Equal(new ChatMessage(ChatRole.User, "Where does Jack work?"));
        }

        [Fact]
        public void The_question_follows_the_earlier_turns_in_order()
        {
            ChatMessage[] history = [new(ChatRole.User, "Where does Jack work?"), new(ChatRole.Assistant, "SPIE.")];

            PromptBuilder.Build(Knowledge, history, "And before that?").Messages
                .Should().Equal(history[0], history[1], new ChatMessage(ChatRole.User, "And before that?"));
        }
    }
}
