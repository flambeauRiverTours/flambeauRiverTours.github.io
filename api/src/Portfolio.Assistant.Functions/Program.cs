using Azure.Monitor.OpenTelemetry.Exporter;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Azure.Functions.Worker.OpenTelemetry;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Portfolio.Assistant.Foundry;
using Portfolio.Assistant.Functions;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("APPLICATIONINSIGHTS_CONNECTION_STRING")))
{
    builder.Services.AddOpenTelemetry()
        .UseFunctionsWorkerDefaults()
        .UseAzureMonitorExporter();
}

var identityEndpoint = Environment.GetEnvironmentVariable("IDENTITY_ENDPOINT");
var credential = AzureCredential.For(identityEndpoint);
builder.Services.AddKnowledgeBase(Path.Combine(AppContext.BaseDirectory, "knowledge"));
builder.Services.AddClaudeAnswerModel(credential);
builder.Services.AddStorage(credential);
builder.Services.AddRateLimiting();
builder.Services.AddQuestionLog();
builder.Services.AddDailySummary(credential, inAzure: !string.IsNullOrEmpty(identityEndpoint));
builder.Services.Configure<ServiceProviderOptions>(options =>
{
    options.ValidateOnBuild = true;
    options.ValidateScopes = true;
});
builder.Build().Run();
