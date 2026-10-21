using System.Net;
using Microsoft.AspNetCore.Http;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Who is asking, for rate limiting.</summary>
    internal static class VisitorAddress
    {
        /// <summary>The last <c>X-Forwarded-For</c> address, which Azure's front end appends, or else the connection's.</summary>
        /// <remarks>Earlier entries come from the visitor and could be forged to dodge the limits.</remarks>
        public static string Of(HttpRequest request)
        {
            var lastForwarded = request.Headers["X-Forwarded-For"].ToString().Split(',')[^1].Trim();
            return IPEndPoint.TryParse(lastForwarded, out var forwarded)
                ? forwarded.Address.ToString()
                : request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }
}
