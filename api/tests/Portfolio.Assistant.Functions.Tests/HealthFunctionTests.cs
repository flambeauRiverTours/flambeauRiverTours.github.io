using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Portfolio.Assistant.Functions.Tests
{
    public class HealthFunctionTests
    {
        private static (IActionResult Result, HttpResponse Response) CheckHealth()
        {
            var request = new DefaultHttpContext().Request;
            return (new HealthFunction().Health(request), request.HttpContext.Response);
        }

        [Fact]
        public void Health_names_the_running_build_in_the_body_and_the_header()
        {
            var (result, response) = CheckHealth();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            JsonSerializer.SerializeToElement(ok.Value, JsonSerializerOptions.Web).GetProperty("build").GetString().Should().Be(Build.Commit);
            response.Headers["X-Build"].ToString().Should().Be(Build.Commit);
        }

        // the drawer calls it on every open to wake the app, so a cached reply would wake nothing
        [Fact]
        public void Health_is_never_cached() =>
            CheckHealth().Response.Headers.CacheControl.ToString().Should().Be("no-store");
    }
}
