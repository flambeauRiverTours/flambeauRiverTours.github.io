using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Portfolio.Assistant.Functions.Tests
{
    public class DailySummaryRegistrationTests
    {
        private static readonly (string, string)[] EmailSettings =
        [
            ("Email:Endpoint", "https://acs-test.europe.communication.azure.com/"),
            ("Email:Sender", "DoNotReply@example.azurecomm.net"),
            ("Email:Recipient", "owner@example.com"),
        ];

        private static ServiceProvider Services(bool inAzure, params (string Key, string Value)[] settings)
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(settings.Append(("Storage:ConnectionString", "UseDevelopmentStorage=true"))
                    .Select(setting => KeyValuePair.Create<string, string?>(setting.Item1, setting.Item2)))
                .Build();
            return new ServiceCollection()
                .AddSingleton<IConfiguration>(configuration)
                .AddLogging()
                .AddStorage(new FixedTokenCredential())
                .AddQuestionLog()
                .AddDailySummary(new FixedTokenCredential(), inAzure)
                .BuildServiceProvider();
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public void With_the_email_settings_summaries_go_through_the_email_service(bool inAzure)
        {
            using var services = Services(inAzure, EmailSettings);

            services.GetRequiredService<IStartupValidator>().Validate();
            services.GetRequiredService<IEmailSender>().Should().BeOfType<AcsEmailSender>();
            ActivatorUtilities.CreateInstance<DailySummaryFunction>(services).Should().NotBeNull();
        }

        // so a local run needs no email service: the summary appears in the console
        [Fact]
        public void Locally_without_email_settings_the_summary_is_logged_instead()
        {
            using var services = Services(inAzure: false);

            services.GetRequiredService<IStartupValidator>().Validate();
            services.GetRequiredService<IEmailSender>().Should().BeOfType<LoggingEmailSender>();
        }

        // in Azure a missing setting would otherwise send every summary to the console unnoticed
        [Fact]
        public void In_azure_startup_stops_without_the_email_settings()
        {
            using var services = Services(inAzure: true);

            FluentActions.Invoking(() => services.GetRequiredService<IStartupValidator>().Validate()).Should().Throw<OptionsValidationException>().WithMessage("*Email*");
        }

        [Theory]
        [InlineData("Email:Sender")]
        [InlineData("Email:Recipient")]
        public void An_endpoint_without_a_sender_and_recipient_stops_startup(string missing)
        {
            using var services = Services(false, [.. EmailSettings.Where(setting => setting.Item1 != missing)]);

            FluentActions.Invoking(() => services.GetRequiredService<IStartupValidator>().Validate()).Should().Throw<OptionsValidationException>().WithMessage("*Email*");
        }
    }
}
