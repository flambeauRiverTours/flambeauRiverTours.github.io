metadata description = 'The "Ask about my experience" assistant: a Function App on Flex Consumption, its storage and telemetry, and its access to the existing Foundry resource.'

@description('Builds every resource name. The Function App name is global, so a second deployment needs its own prefix.')
@minLength(3)
@maxLength(11)
param namePrefix string = 'jtassistant'

@description('Where the resources live; the existing Foundry resource is in the same resource group.')
param location string = resourceGroup().location

@description('The existing Foundry (AI Services) account the Function asks. Not created here.')
@minLength(2)
@maxLength(64)
param foundryAccountName string

@description('The Claude deployment in that account.')
@minLength(1)
param foundryDeployment string = 'claude-haiku-5-5'

@description('Where alerts are sent: the assistant failing, or the global daily cap turning everyone away.')
@secure()
param alertEmail string

@description('Origins the browser may call the API from.')
param allowedOrigins string[] = [
  'https://jacktreadwell.com'
  'https://www.jacktreadwell.com'
]

// 5 GB a month of ingestion is free, spread over 31 days
var dailyIngestCapGb = '0.16'

// Storage Blob Data Owner: the Functions host, the deployment package and the question logs all use blobs
var storageBlobDataOwnerRoleId = 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'

// Foundry User: lets the Function call the account's deployments, nothing more
var foundryUserRoleId = '53ca6127-db72-4b80-b1b0-d745d6d5456d'

resource foundry 'Microsoft.CognitiveServices/accounts@2025-06-01' existing = {
  name: foundryAccountName
}

// Free within the daily cap
resource workspace 'Microsoft.OperationalInsights/workspaces@2025-02-01' = {
  name: 'log-${namePrefix}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    workspaceCapping: {
      dailyQuotaGb: json(dailyIngestCapGb)
    }
  }
}

// No charge of its own: its data is billed through the workspace
resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${namePrefix}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
  }
}

// A few cents a month in transactions; the logs are a few kilobytes a day
resource storage 'Microsoft.Storage/storageAccounts@2025-01-01' = {
  name: 'st${uniqueString(resourceGroup().id)}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    // everything reaches storage through the Function App's identity
    allowSharedKeyAccess: false
  }

  resource blob 'blobServices' = {
    name: 'default'

    resource deployments 'containers' = {
      name: 'deployments'
    }

    resource assistantLogs 'containers' = {
      name: 'assistant-logs'
    }
  }

  // question logs are deleted 90 days after their last write, with no cleanup code (plan, "Logging")
  resource lifecycle 'managementPolicies' = {
    name: 'default'
    properties: {
      policy: {
        rules: [
          {
            name: 'delete-question-logs-after-90-days'
            enabled: true
            type: 'Lifecycle'
            definition: {
              filters: {
                blobTypes: [
                  'appendBlob'
                ]
                prefixMatch: [
                  '${storage::blob::assistantLogs.name}/'
                ]
              }
              actions: {
                baseBlob: {
                  delete: {
                    daysAfterModificationGreaterThan: 90
                  }
                }
              }
            }
          }
        ]
      }
    }
  }
}

// No charge of its own: Flex Consumption bills the app's executions
resource plan 'Microsoft.Web/serverfarms@2024-11-01' = {
  name: 'plan-${namePrefix}'
  location: location
  kind: 'functionapp'
  sku: {
    name: 'FC1'
    tier: 'FlexConsumption'
  }
  properties: {
    reserved: true
  }
}

// Free at this volume: the monthly grant covers far more than 1,000 short calls
resource functionApp 'Microsoft.Web/sites@2024-11-01' = {
  name: 'func-${namePrefix}'
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          // naming the container makes it a dependency, so it exists before the app deploys into it
          value: '${storage.properties.primaryEndpoints.blob}${storage::blob::deployments.name}'
          authentication: {
            type: 'SystemAssignedIdentity'
          }
        }
      }
      scaleAndConcurrency: {
        // the rate limiter counts in memory, so one instance must hold all the counts (plan, decision 11)
        maximumInstanceCount: 1
        instanceMemoryMB: 512 // the smallest size costs the fewest GB-seconds
      }
      runtime: {
        name: 'dotnet-isolated'
        version: '10.0'
      }
    }
    siteConfig: {
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      cors: {
        allowedOrigins: allowedOrigins
      }
      appSettings: [
        {
          // the host connects to storage by identity
          name: 'AzureWebJobsStorage__accountName'
          value: storage.name
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: insights.properties.ConnectionString
        }
        {
          name: 'Foundry__Endpoint'
          value: foundry.properties.endpoints['AI Foundry API']
        }
        {
          name: 'Foundry__Deployment'
          value: foundryDeployment
        }
        {
          // written with the app's identity, through the Storage Blob Data Owner role below
          name: 'QuestionLog__BlobServiceUri'
          value: storage.properties.primaryEndpoints.blob
        }
      ]
    }
  }
}

resource storageBlobDataOwner 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, functionApp.id, storageBlobDataOwnerRoleId)
  scope: storage
  properties: {
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataOwnerRoleId)
  }
}

resource foundryUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(foundry.id, functionApp.id, foundryUserRoleId)
  scope: foundry
  properties: {
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', foundryUserRoleId)
  }
}

// The budget goes in budget.bicep, deployed once by hand (task 2.4): its start date can't change after creation

// Free: the first 1,000 emails a month cost nothing
resource alerts 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-${namePrefix}'
  location: 'global'
  properties: {
    groupShortName: 'assistant'
    enabled: true
    emailReceivers: [
      {
        name: 'owner'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

// About $0.10 a month. A failed model call or log write is logged with its exception, which App Insights counts here
resource exceptionAlert 'Microsoft.Insights/metricAlerts@2026-01-01' = {
  name: 'alert-${namePrefix}-exceptions'
  location: 'global'
  properties: {
    description: 'The assistant is failing: more than 10 exceptions in an hour (model, sign-in or storage).'
    severity: 2
    enabled: true
    scopes: [
      insights.id
    ]
    evaluationFrequency: 'PT15M'
    windowSize: 'PT1H'
    autoMitigate: true
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'exceptions'
          metricName: 'exceptions/count'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          // a deploy's smoke question retries for a few minutes while a new role applies, failing up to 10 times
          threshold: 10
          timeAggregation: 'Count'
        }
      ]
    }
    actions: [
      {
        actionGroupId: alerts.id
      }
    ]
  }
}

// About $0.50 a month (a log alert checked every 15 minutes). The text is AskFunction.GlobalCapReachedMessage
resource globalCapAlert 'Microsoft.Insights/scheduledQueryRules@2026-03-01' = {
  name: 'alert-${namePrefix}-global-cap'
  location: location
  properties: {
    description: 'The global daily cap is turning every visitor away until midnight UTC: heavy use, or someone working through it.'
    severity: 2
    enabled: true
    scopes: [
      insights.id
    ]
    evaluationFrequency: 'PT15M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: 'traces | where message startswith "The global daily cap is reached"'
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    // one email for the day, not one every 15 minutes until midnight
    autoMitigate: false
    muteActionsDuration: 'PT24H'
    actions: {
      actionGroups: [
        alerts.id
      ]
    }
  }
}

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
