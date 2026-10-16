using System.Text.Json;
using Portfolio.Assistant.Core;
using Portfolio.Assistant.Evals;

// Runs api/evals/questions.jsonl against a model and writes a report to api/evals/results/.
// Exit codes: 0 launch bar met, 1 not met, 2 bad options or setup.

EvalOptions options;
try
{
    options = EvalOptions.Parse(args);
}
catch (UsageException error)
{
    Console.Error.WriteLine($"{error.Message}\n\n{EvalOptions.Usage}");
    return 2;
}

var api = FindApiFolder(Directory.GetCurrentDirectory());
if (api is null)
{
    Console.Error.WriteLine("Couldn't find the api folder (with evals/questions.jsonl). Run from inside the repository.");
    return 2;
}

if (!options.SelfTest)
{
    Console.Error.WriteLine("The Foundry client is task 1.4 and isn't built yet. Until then, run with --self-test.");
    return 2;
}

var (knowledge, cases) = LoadInputs(api, options);
IAnswerModel model = new PassExampleModel(cases);
using var cancellation = new CancellationTokenSource();
Console.CancelKeyPress += (_, press) =>
{
    press.Cancel = true;
    cancellation.Cancel();
};

Console.WriteLine($"Running {cases.Count} cases × {options.Runs} runs against {model.Deployment} (prompt {knowledge.PromptVersion})...");
var grader = new Grader(knowledge.Links.Select(link => link.Id).ToHashSet());
var results = await new EvalRunner(model, knowledge, grader).RunAsync(cases, options.Runs, options.Parallelism, cancellation.Token);
var bar = LaunchBar.Evaluate(results);

var context = new ReportContext(TimeProvider.System.GetUtcNow(), model.Deployment, knowledge.PromptVersion, options.Runs);
// self-test reports go to one git-ignored file so they don't pile up next to real results
var reportName = options.SelfTest ? "self-test.md" : ReportWriter.FileName(context);
var reportPath = WriteReport(api, reportName, ReportWriter.Write(results, bar, context));

Console.WriteLine($"{results.Count(result => result.Passed)} / {results.Count} cases passed. Launch bar {(bar.Met ? "met" : "not met")}.");
Console.WriteLine($"Report: {Path.GetRelativePath(Directory.GetCurrentDirectory(), reportPath)}");
return bar.Met ? 0 : 1;

static (KnowledgeBase Knowledge, List<EvalCase> Cases) LoadInputs(string api, EvalOptions options)
{
    string Read(string relativePath) => File.ReadAllText(Path.Combine(api, relativePath));

    // links.json is generated as a JSON array, never the literal null
    var links = JsonSerializer.Deserialize<List<LinkTarget>>(Read("knowledge/links.json"), JsonSerializerOptions.Web)!;
    var knowledge = KnowledgeBase.Create(Read("knowledge/system-prompt.md"), Read("knowledge/site.md"), Read("knowledge/faq.md"), links);
    var cases = EvalCaseReader.Parse(Read("evals/questions.jsonl"))
        .Where(options.Selects)
        .Where(evalCase => !options.SelfTest || evalCase.PassExample is not null)
        .ToList();
    return (knowledge, cases);
}

static string WriteReport(string api, string fileName, string report)
{
    var folder = Path.Combine(api, "evals", "results");
    Directory.CreateDirectory(folder);
    var path = Path.Combine(folder, fileName);
    File.WriteAllText(path, report);
    return path;
}

// the runner can be started from the repository root, the api folder or anywhere below it
static string? FindApiFolder(string start)
{
    for (var folder = new DirectoryInfo(start); folder is not null; folder = folder.Parent)
    {
        var candidate = new[] { folder.FullName, Path.Combine(folder.FullName, "api") }
            .FirstOrDefault(path => File.Exists(Path.Combine(path, "evals", "questions.jsonl")));
        if (candidate is not null)
        {
            return candidate;
        }
    }

    return null;
}
