metadata description = 'The custom role that lets the assistant\'s Function send its daily summary email, and nothing more. Deployed once by hand (api/README.md): the deploy identity can\'t create role definitions.'

// The only built-in role, Communication and Email Service Owner, can also list the access keys, delete the service and
// change its domains. Microsoft's managed-identity sample sends with these two actions alone.
// main.bicep assigns the role by the same GUID, so the seed below must match its emailSenderRoleId
resource emailSender 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: guid(resourceGroup().id, 'assistant-email-sender')
  properties: {
    roleName: 'Assistant Email Sender (${resourceGroup().name})'
    description: 'Sends email through a Communication Services resource with Microsoft Entra ID. No keys, no deleting, no domain changes.'
    type: 'CustomRole'
    permissions: [
      {
        actions: [
          'Microsoft.Communication/CommunicationServices/Read'
          'Microsoft.Communication/CommunicationServices/Write'
        ]
      }
    ]
    assignableScopes: [
      resourceGroup().id
    ]
  }
}

@description('The role\'s ID, which the deploy identity\'s role-assignment condition must allow.')
output roleDefinitionId string = emailSender.name
