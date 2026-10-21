using FluentAssertions;

namespace Portfolio.Assistant.Functions.Tests
{
    public class VisitorAddressTests
    {
        // a visitor can send their own X-Forwarded-For; Azure's front end appends the address it saw, so only the last entry is trusted
        [Theory]
        [InlineData("203.0.113.7:51234", "203.0.113.7")]
        [InlineData("198.51.100.66, 192.0.2.99, 203.0.113.7:51234", "203.0.113.7")]
        [InlineData("[2001:db8::7]:51234", "2001:db8::7")]
        [InlineData(null, TestRequests.ConnectionAddress)]
        [InlineData("garbage", TestRequests.ConnectionAddress)]
        public void The_visitor_is_the_address_azure_added_last_or_else_the_connection(string? forwardedFor, string expected) =>
            VisitorAddress.Of(TestRequests.Post("{}", forwardedFor)).Should().Be(expected);
    }
}
