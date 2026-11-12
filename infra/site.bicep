metadata description = 'The site, jacktreadwell.com: a Static Web App that deploy.yml uploads the built site to. Its custom domains are added by hand (tasks/azure-static-web-apps-plan.md), not here.'

@description('Builds the app name. Static Web App names only need to be unique in the resource group.')
@minLength(3)
@maxLength(11)
param namePrefix string = 'jtsite'

@description('Where the app\'s metadata lives; the content is served from the global edge or, for the apex, from this region.')
param location string = resourceGroup().location

@description('Free, or Standard if the Free limits ever bite. A parameter so a deploy never silently undoes an upgrade.')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

// Free: $0, certificates included; 100 GB of bandwidth a month across the subscription, shared with the ff app.
// Standard would be $9 a month
resource site 'Microsoft.Web/staticSites@2025-03-01' = {
  name: 'stapp-${namePrefix}'
  location: location
  sku: {
    name: sku
    tier: sku
  }
  // no repository link: deploy.yml uploads the build the site check gated, with a token it fetches at run time
  properties: {}
}

@description('Where the custom domains\' CNAME records point, and where the build can be checked before they do.')
output siteHostname string = site.properties.defaultHostname

@description('The apex domain\'s A record: GoDaddy can\'t point the apex at a hostname.')
#disable-next-line BCP053 // the API returns it, but the resource type doesn't declare it
output stableInboundIp string = site.properties.stableInboundIP
