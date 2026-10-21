using System.Net;
using System.Net.Sockets;
using Microsoft.AspNetCore.Http;

namespace Portfolio.Assistant.Functions
{
    /// <summary>Who is asking, for rate limiting.</summary>
    internal static class VisitorAddress
    {
        // one home or phone is usually given a whole /64, so its addresses count as one visitor
        private const int Ipv6NetworkBytes = 8;

        /// <summary>The last <c>X-Forwarded-For</c> address, which Azure's front end appends, or else the connection's; IPv6 as its /64.</summary>
        /// <remarks>Earlier entries come from the visitor and could be forged to dodge the limits.</remarks>
        public static string Of(HttpRequest request)
        {
            var lastForwarded = request.Headers["X-Forwarded-For"].ToString().Split(',')[^1].Trim();
            var address = IPEndPoint.TryParse(lastForwarded, out var forwarded) ? forwarded.Address : request.HttpContext.Connection.RemoteIpAddress;
            return address is null ? "unknown" : Key(address);
        }

        private static string Key(IPAddress address)
        {
            if (address.IsIPv4MappedToIPv6)
            {
                return address.MapToIPv4().ToString();
            }

            if (address.AddressFamily != AddressFamily.InterNetworkV6)
            {
                return address.ToString();
            }

            var network = new byte[16];
            address.GetAddressBytes().AsSpan(0, Ipv6NetworkBytes).CopyTo(network);
            return $"{new IPAddress(network)}/64";
        }
    }
}
