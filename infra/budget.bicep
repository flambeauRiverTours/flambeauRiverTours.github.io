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

// covers the whole resource group: the model's tokens as well as the Function and its storage
resource budget 'Microsoft.Consumption/budgets@2024-08-01' = {
  name: 'budget-${namePrefix}'
  properties: {
    category: 'Cost'
    amount: 5
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: startDate
    }
    notifications: {
      // thresholds are percentages of the amount: 60 of $5 is $3, a warning well above the expected ~$1
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
