using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Portfolio.Assistant.Core;

namespace Portfolio.Assistant.Functions.Tests
{
    public class RateLimitingRegistrationTests
    {
        private static ServiceProvider Services(params (string Key, string Value)[] settings)
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(settings.Select(setting => KeyValuePair.Create<string, string?>(setting.Key, setting.Value)))
                .Build();
            return new ServiceCollection().AddSingleton<IConfiguration>(configuration).AddRateLimiting().BuildServiceProvider();
        }

        [Fact]
        public void Without_settings_the_agreed_limits_apply()
        {
            using var services = Services();

            services.GetRequiredService<IOptions<RateLimits>>().Value.Should().Be(new RateLimits());
            services.GetRequiredService<InMemoryRateLimiter>().Should().NotBeNull();
        }

        [Fact]
        public void Settings_change_the_limits_without_a_deploy()
        {
            using var services = Services(("Limits:PerMinute", "10"), ("Limits:GlobalPerDay", "100"));

            services.GetRequiredService<IOptions<RateLimits>>().Value.Should().Be(new RateLimits { PerMinute = 10, GlobalPerDay = 100 });
        }

        [Theory]
        [InlineData("Limits:PerMinute", "0")]
        [InlineData("Limits:PerDay", "-1")]
        [InlineData("Limits:GlobalPerDay", "0")]
        public void A_limit_below_one_stops_startup(string key, string value)
        {
            using var services = Services((key, value));

            FluentActions.Invoking(() => services.GetRequiredService<IStartupValidator>().Validate()).Should().Throw<OptionsValidationException>().WithMessage("*Limits*");
        }
    }
}
