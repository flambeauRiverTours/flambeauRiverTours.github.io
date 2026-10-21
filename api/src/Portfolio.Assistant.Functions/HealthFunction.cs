using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Says which build is running, without calling the model: <c>GET /api/health</c>.</summary>
    internal sealed class HealthFunction
    {
        /// <summary>Returns the build; the drawer calls it on open so the app is awake by the time a question arrives.</summary>
        [Function("Health")]
        public IActionResult Health([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "health")] HttpRequest request)
        {
            Build.AddHeader(request.HttpContext.Response);
            request.HttpContext.Response.Headers.CacheControl = "no-store";
            return new OkObjectResult(new { build = Build.Commit });
        }
    }
}
