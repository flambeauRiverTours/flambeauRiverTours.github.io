metadata description = 'The assistant\'s monthly budget and its alerts. Deployed once by hand (api/README.md), not by the pipeline: a budget\'s start date cannot change after it is created.'

@description('Builds the budget\'s name, as in main.bicep.')
@minLength(3)
@maxLength(11)
param namePrefix string = 'jtassistant'

@description('Where the alerts are sent.')
@secure()
param alertEmail string

@description('The budget\'s first day, yyyy-MM-dd. The first day of this month for a new budget; the existing date to change one.')
param startDate string

@description('Dollars a month. $5 normally; raised for a month of heavy eval runs (October 2026: $15), then set back.')
@minValue(1)
param amount int = 5

// covers the whole resource group: the model's tokens as well as the Function and its storage. Claude bills through the
// Marketplace, and Cost Management puts its "Claude in Microsoft Foundry (Azure hosted)" consumption units on a
// microsoft.saas resource inside this group (checked 2026-10-21: $4.82 of October's eval runs showed here)
resource budget 'Microsoft.Consumption/budgets@2024-08-01' = {
  name: 'budget-${namePrefix}'
  properties: {
    category: 'Cost'
    amount: amount
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: startDate
    }
    notifications: {
      // thresholds are percentages of the amount: 60 of $5 is $3, a warning well above the expected ~$1 (the key keeps its first name)
      warningAtThreeDollars: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 60
        thresholdType: 'Actual'
        contactEmails: [
          alertEmail
        ]
      }
      budgetSpent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        thresholdType: 'Actual'
        contactEmails: [
          alertEmail
        ]
      }
      forecastToExceed: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        thresholdType: 'Forecasted'
        contactEmails: [
          alertEmail
        ]
      }
    }
  }
}
