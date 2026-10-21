using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    // each test gets its own copy of the real knowledge files, so it can delete or blank one
    public sealed class KnowledgeRegistrationTests : IDisposable
    {
        private static readonly string CopiedKnowledgeFolder = Path.Combine(AppContext.BaseDirectory, "knowledge");

        private readonly string folder = Directory.CreateTempSubdirectory("knowledge-").FullName;

        public KnowledgeRegistrationTests()
        {
            foreach (var file in Directory.GetFiles(CopiedKnowledgeFolder))
            {
                File.Copy(file, Path.Combine(folder, Path.GetFileName(file)));
            }
        }

        public void Dispose() => Directory.Delete(folder, recursive: true);

        private Action Registering() => () => new ServiceCollection().AddKnowledgeBase(folder);

        [Fact]
        public void The_knowledge_files_are_copied_next_to_the_app() =>
            Directory.GetFiles(CopiedKnowledgeFolder).Select(Path.GetFileName).Should().Contain(["system-prompt.md", "site.md", "faq.md", "links.json"]);

        [Fact]
        public void The_knowledge_is_loaded_once_and_shared()
        {
            using var services = new ServiceCollection().AddKnowledgeBase(folder).BuildServiceProvider();

            var knowledge = services.GetRequiredService<KnowledgeBase>();

            knowledge.Should().BeSameAs(services.GetRequiredService<KnowledgeBase>());
            knowledge.SystemMessage.Should().Contain("<knowledge>").And.Contain("Wake Forest");
            knowledge.Links.Should().Contain(new LinkTarget("experience-spie", "Experience › Senior Software Engineer"));
        }

        [Theory]
        [InlineData("system-prompt.md")]
        [InlineData("site.md")]
        [InlineData("faq.md")]
        [InlineData("links.json")]
        public void A_missing_knowledge_file_stops_startup(string fileName)
        {
            File.Delete(Path.Combine(folder, fileName));

            Registering().Should().Throw<FileNotFoundException>().WithMessage($"*{fileName}*");
        }

        [Theory]
        [InlineData("system-prompt.md", "systemPrompt")]
        [InlineData("site.md", "site")]
        [InlineData("faq.md", "faq")]
        public void A_blank_knowledge_file_stops_startup(string fileName, string parameterName)
        {
            File.WriteAllText(Path.Combine(folder, fileName), " \n");

            Registering().Should().Throw<ArgumentException>().Which.ParamName.Should().Be(parameterName);
        }

        // KnowledgeBaseTests covers every shape of linkless file; this checks the error reaches startup
        [Fact]
        public void A_links_file_without_links_stops_startup()
        {
            File.WriteAllText(Path.Combine(folder, "links.json"), "[]");

            Registering().Should().Throw<InvalidDataException>().WithMessage("*links.json*");
        }
    }
}
