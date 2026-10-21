using FluentAssertions;

namespace Portfolio.Assistant.Functions.Tests
{
    public class VisitorAddressTests
    {
        // a visitor can send their own X-Forwarded-For; Azure's front end appends the address it saw, so only the last entry is trusted
        [Theory]
        [InlineData("203.0.113.7:51234", "203.0.113.7")]
        [InlineData("198.51.100.66, 192.0.2.99, 203.0.113.7:51234", "203.0.113.7")]
        [InlineData("[2001:db8::7]:51234", "2001:db8::/64")]
        [InlineData(null, TestRequests.ConnectionAddress)]
        [InlineData("garbage", TestRequests.ConnectionAddress)]
        public void The_visitor_is_the_address_azure_added_last_or_else_the_connection(string? forwardedFor, string expected) =>
            VisitorAddress.Of(TestRequests.Post("{}", forwardedFor)).Should().Be(expected);

        // one home or phone is usually given a whole /64, so counting each IPv6 address apart would let one visitor
        // rotate through addresses and use up the global cap for everyone
        [Theory]
        [InlineData("2001:db8:1:2:aaaa::1", "2001:db8:1:2::/64")]
        [InlineData("2001:db8:1:2:bbbb:cccc:dddd:eeee", "2001:db8:1:2::/64")]
        [InlineData("2001:db8:1:3::1", "2001:db8:1:3::/64")]
        [InlineData("::ffff:203.0.113.7", "203.0.113.7")]
        public void An_ipv6_visitor_is_counted_by_their_64_bit_network(string forwardedFor, string expected) =>
            VisitorAddress.Of(TestRequests.Post("{}", forwardedFor)).Should().Be(expected);
    }
}
