using System.Text.Json;
using FluentAssertions;

namespace Portfolio.Assistant.Evals.Tests
{
    public class EvalCaseReaderTests
    {
        [Fact]
        public void Snake_case_names_load_as_enums()
        {
            var evalCase = EvalCaseReader.Parse("""{"id":"a","category":"multi_hop","question":"Q?","expect":"idk"}""").Single();

            evalCase.Category.Should().Be(Category.MultiHop);
            evalCase.Expect.Should().Be(Expectation.Idk);
        }

        [Theory]
        [InlineData("""{"id":"a","category":"fact","question":"Q?","expect":"refused"}""")]
        [InlineData("""{"id":"a","category":"facts","question":"Q?","expect":"answer"}""")]
        [InlineData("""{"id":"a","category":"fact","question":"Q?","expect":2}""")]
        public void A_misspelled_category_or_expectation_fails_to_load(string line) =>
            FluentActions.Invoking(() => EvalCaseReader.Parse(line)).Should().Throw<JsonException>();

        [Fact]
        public void Blank_lines_and_windows_line_endings_are_ignored() =>
            EvalCaseReader.Parse("{\"id\":\"a\",\"category\":\"fact\",\"question\":\"Q?\",\"expect\":\"answer\"}\r\n\r\n").Should().ContainSingle();
    }
}
