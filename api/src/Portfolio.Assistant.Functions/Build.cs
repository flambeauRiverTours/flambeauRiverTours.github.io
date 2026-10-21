using System.Reflection;
using Microsoft.AspNetCore.Http;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Which build is running, sent as <c>X-Build</c> so a deploy can tell its build from the one it replaced.</summary>
    internal static class Build
    {
        /// <summary>The commit the build was made from, or <c>local</c> when that isn't known.</summary>
        public static readonly string Commit =
            typeof(Build).Assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion.Split('+') is [_, var commit]
                ? commit
                : "local";

        /// <summary>Adds the <c>X-Build</c> header to a response.</summary>
        public static void AddHeader(HttpResponse response) => response.Headers["X-Build"] = Commit;
    }
}
