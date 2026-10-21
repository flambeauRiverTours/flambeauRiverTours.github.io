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

if (options.JudgeCheck)
{
    return await RunJudgeCheckAsync(options, api);
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

var judge = CreateJudge(options, api);
if (options.JudgeDeployment is not null && judge is null)
{
    // otherwise a self-test without FOUNDRY_ENDPOINT would quietly run unjudged
    Console.Error.WriteLine("--judge needs FOUNDRY_ENDPOINT.");
    return 2;
}

var judgedBy = judge is null ? "" : $", judged by {judge.Deployment}";
Console.WriteLine($"Running {cases.Count} {EvalOptions.FileFor(options.Set)} cases × {options.Runs} runs against {model.Deployment} (prompt {knowledge.PromptVersion}){judgedBy}...");
var grader = new Grader(knowledge.Links.Select(link => link.Id).ToHashSet());
var results = await new EvalRunner(model, knowledge, grader, Console.Out, judge: judge).RunAsync(cases, options.Runs, options.Parallelism, cancellation.Token);
var bar = LaunchBar.Evaluate(results);

var context = new ReportContext(TimeProvider.System.GetUtcNow(), model.Deployment, knowledge.PromptVersion, options.Runs, options.Set, judge?.Deployment);
var reportPath = WriteReport(Path.Combine(api, "evals", "results"), options.SelfTest, context, ReportWriter.Write(results, bar, context));

Console.WriteLine($"{results.Count(result => result.Passed)} / {results.Count} cases passed. Launch bar {(bar.Met ? "met" : "not met")}.");
Console.WriteLine($"Report: {Path.GetRelativePath(Directory.GetCurrentDirectory(), reportPath)}");
return bar.Met ? 0 : 1;

static (KnowledgeBase Knowledge, List<EvalCase> Cases) LoadInputs(string api, EvalOptions options)
{
    var knowledge = KnowledgeBase.Load(fileName => File.ReadAllText(Path.Combine(api, "knowledge", fileName)));
    var cases = EvalCaseReader.Parse(File.ReadAllText(Path.Combine(api, "evals", EvalOptions.FileFor(options.Set))))
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

// the judge reads the site and the FAQ, not the assistant's rules: it checks facts, not behaviour. With --self-test it judges
// the passExamples, which are correct answers, so anything it flags there is a false positive: the judge's calibration run
static IGroundingJudge? CreateJudge(EvalOptions options, string api)
{
    if (options.JudgeDeployment is null || !Uri.TryCreate(Environment.GetEnvironmentVariable("FOUNDRY_ENDPOINT"), UriKind.Absolute, out var uri))
    {
        return null;
    }

    string Read(string fileName) => File.ReadAllText(Path.Combine(api, "knowledge", fileName));
    return ClaudeGroundingJudge.ForFoundry(uri, options.JudgeDeployment, new AzureCliCredential(), GroundingPrompt.System(Read("site.md"), Read("faq.md")), maxRetries: 7, attemptTimeout: TimeSpan.FromSeconds(60), think: options.JudgeThinking);
}

// checks the judge alone; its report goes to one git-ignored file, like the self-test's. Exit 0 only if it agrees with every label
static async Task<int> RunJudgeCheckAsync(EvalOptions options, string api)
{
    var judge = CreateJudge(options, api);
    if (judge is null)
    {
        Console.Error.WriteLine("--judge-check needs --judge <deployment> and FOUNDRY_ENDPOINT.");
        return 2;
    }

    var cases = JudgeCheckCase.Parse(File.ReadAllText(Path.Combine(api, "evals", "judge-checks.jsonl")));
    Console.WriteLine($"Checking {judge.Deployment} on {cases.Count} labelled answers...");
    var results = await JudgeCheck.RunAsync(judge, cases, options.Parallelism, CancellationToken.None);
    var path = Path.Combine(api, "evals", "results", "judge-check.md");
    File.WriteAllText(path, JudgeCheck.Write(results, judge.Deployment));
    Console.WriteLine($"{results.Count(result => result.Agrees)} / {results.Count} agreed. Report: {Path.GetRelativePath(Directory.GetCurrentDirectory(), path)}");
    return results.All(result => result.Agrees) ? 0 : 1;
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
