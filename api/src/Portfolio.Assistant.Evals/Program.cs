using Azure.Identity;
using Portfolio.Assistant.Core;
using Portfolio.Assistant.Evals;
using Portfolio.Assistant.Foundry;

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

var (knowledge, cases) = LoadInputs(api, options);
var model = CreateModel(options, cases);
if (model is null)
{
    Console.Error.WriteLine("Set FOUNDRY_ENDPOINT to the Foundry resource's address (https://<resource>.services.ai.azure.com), or run with --self-test.");
    return 2;
}

using var cancellation = new CancellationTokenSource();
Console.CancelKeyPress += (_, press) =>
{
    press.Cancel = true;
    cancellation.Cancel();
};

Console.WriteLine($"Running {cases.Count} cases × {options.Runs} runs against {model.Deployment} (prompt {knowledge.PromptVersion})...");
var grader = new Grader(knowledge.Links.Select(link => link.Id).ToHashSet());
var results = await new EvalRunner(model, knowledge, grader, Console.Out).RunAsync(cases, options.Runs, options.Parallelism, cancellation.Token);
var bar = LaunchBar.Evaluate(results);

var context = new ReportContext(TimeProvider.System.GetUtcNow(), model.Deployment, knowledge.PromptVersion, options.Runs);
var reportPath = WriteReport(Path.Combine(api, "evals", "results"), options.SelfTest, context, ReportWriter.Write(results, bar, context));

Console.WriteLine($"{results.Count(result => result.Passed)} / {results.Count} cases passed. Launch bar {(bar.Met ? "met" : "not met")}.");
Console.WriteLine($"Report: {Path.GetRelativePath(Directory.GetCurrentDirectory(), reportPath)}");
return bar.Met ? 0 : 1;

static (KnowledgeBase Knowledge, List<EvalCase> Cases) LoadInputs(string api, EvalOptions options)
{
    var knowledge = KnowledgeBase.Load(fileName => File.ReadAllText(Path.Combine(api, "knowledge", fileName)));
    var cases = EvalCaseReader.Parse(File.ReadAllText(Path.Combine(api, "evals", "questions.jsonl")))
        .Where(options.Selects)
        .Where(evalCase => !options.SelfTest || evalCase.PassExample is not null)
        .ToList();
    return (knowledge, cases);
}

// real runs sign in as your az login, which azure/login also sets up in CI; DefaultAzureCredential picked up a
// different signed-in account (401). The endpoint comes from the environment so it stays out of the repo
static IAnswerModel? CreateModel(EvalOptions options, IReadOnlyList<EvalCase> cases)
{
    if (options.SelfTest)
    {
        return new PassExampleModel(cases);
    }

    var endpoint = Environment.GetEnvironmentVariable("FOUNDRY_ENDPOINT");
    if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri))
    {
        return null;
    }

    // a full run hits the deployment's rate limit constantly, so allow more retries than a visitor's request would get
    return ClaudeAnswerModel.ForFoundry(uri, options.Deployment, new AzureCliCredential(), maxRetries: 7, attemptTimeout: TimeSpan.FromSeconds(30));
}

// self-test reports go to one git-ignored file so they don't pile up next to real results; real reports are never replaced
static string WriteReport(string folder, bool selfTest, ReportContext context, string report)
{
    Directory.CreateDirectory(folder);
    var fileName = selfTest ? "self-test.md" : ReportWriter.UnusedFileName(ReportWriter.FileName(context), name => File.Exists(Path.Combine(folder, name)));
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
