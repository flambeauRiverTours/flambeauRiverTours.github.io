# Assistant API

The Azure Function behind "Ask about my experience": `POST /api/ask` answers a question about Jack from the knowledge in `knowledge/`, and `GET /api/health` reports the running build. Design and decisions are in `tasks/llm-assistant-plan.md`; the eval set and runner are in `evals/`.

## Projects

- `src/Portfolio.Assistant.Core`: pure logic (prompt, validation, link extraction, rate-limit maths), no I/O
- `src/Portfolio.Assistant.Foundry`: the Claude client for Microsoft Foundry
- `src/Portfolio.Assistant.Functions`: the Function app (HTTP endpoints, rate limiting, the question log)
- `src/Portfolio.Assistant.Evals`: the eval runner (see `evals/README.md`)
- `tests/`: one xUnit project per source project; run them all with `dotnet test Portfolio.Assistant.slnx`

## Running the Function locally

You need the .NET 10 SDK, Azure Functions Core Tools 4.x, Azurite (`npm install -g azurite`), and `az login` with an account that has the Foundry User role on the Foundry resource.

1. Copy `src/Portfolio.Assistant.Functions/local.settings.example.json` to `local.settings.json` in the same folder (git-ignored) and set `Foundry__Endpoint` to the resource's `https://<resource>.services.ai.azure.com` address.
2. Start Azurite's blob service in another terminal. The question log and the global daily count go there, and the blob tests in `tests/` run against it (they're skipped when Azurite isn't running):

   ```bash
   azurite-blob --skipApiVersionCheck --location .azurite
   ```

3. From the Function's folder, run `func start`. It builds the app and serves it on `http://localhost:7071`. The "AzureWebJobsStorage unhealthy" lines are expected: the host's own storage isn't used locally.
4. Check it:

   ```bash
   curl http://localhost:7071/api/health
   ```

   ```bash
   curl -X POST http://localhost:7071/api/ask -H "Content-Type: application/json" -d "{\"question\":\"Where does Jack work now?\"}"
   ```

Each question is one real model call (well under a cent). To try the rate limit without spending more, start with a lower limit, for example `Limits__PerMinute=1 func start`: the second question in a minute gets a 429. The site's dev server (`npm run dev`, `http://localhost:5173`) is allowed by CORS.

Each question that reaches the model adds a line to the day's log, `assistant-logs/yyyy/MM/dd.jsonl`. Requests turned away before it (400s and 429s) aren't logged there; App Insights records each with its status code. To read today's:

```bash
az storage blob download --connection-string UseDevelopmentStorage=true -c assistant-logs -n "$(date -u +%Y/%m/%d).jsonl" -f today.jsonl
```

Locally the app signs in with your `az login`; in Azure it uses its managed identity, chosen by whether `IDENTITY_ENDPOINT` is set. Bad settings stop it starting, with the setting named in the log.

## Reading production logs, and deleting a visitor's questions

Shared keys are off, so reading the logs needs a data role. `main.bicep` gives one person Storage Blob Data Owner on the `assistant-logs` container, set by the `LOG_OWNER_PRINCIPAL_ID` repo variable (your Entra object ID: `az ad signed-in-user show --query id -o tsv`). Sign in with `az login` as that person, then find the account (the only storage account in the group):

```bash
ACCOUNT=$(az storage account list -g rg-portfolio-ai-prod --query "[0].name" -o tsv)
```

Read a day (UTC):

```bash
az storage blob download --auth-mode login --account-name "$ACCOUNT" -c assistant-logs -n 2026/10/20.jsonl -f day.jsonl
```

To delete a visitor's questions (the privacy page promises this), find their lines from roughly when they asked and what, note each `requestId`, and replace the day's blob without them. An append blob can't drop lines in place. Do it only for a day that has ended, or the Function may append a line between your download and upload, and that line would be lost:

```bash
grep -n "words from their question" day.jsonl
grep -v -F '"requestId":"<id>"' day.jsonl > kept.jsonl
az storage blob upload --auth-mode login --account-name "$ACCOUNT" -c assistant-logs -n 2026/10/20.jsonl -f kept.jsonl --type append --overwrite
```

If no lines are left, delete the blob instead (`az storage blob delete`). Tested against Azurite on 2026-10-21, with `--connection-string UseDevelopmentStorage=true` in place of `--auth-mode login --account-name`: the line went, the others stayed, and the blob stayed an append blob.

## Rate limiting

- **Visitors** are counted in memory on the app's one instance: 5 questions a minute and 30 a day each, with IPv6 counted per /64 network. Addresses never leave memory, and a restart forgetting them is harmless.
- **Everyone together** is capped at 300 a day. This count is the cost control, so it's stored as one small blob per UTC day in `rate-limits/`, written only if unchanged since it was read. A restart, a deploy or Flex Consumption stopping the idle app can't reopen the cap. If storage can't be reached within 5 seconds (a storage attempt gives up after 3, and its one retry gets the rest), questions get a 503 rather than going to the model uncounted, and a visitor who leaves while waiting isn't counted.

## Accepted risk: history comes from the client

The API is stateless, so the earlier turns sent with a question, answers included, are whatever the client sends. Someone could forge "assistant" answers to steer the model. The validator accepts only the drawer's shape (question, answer, question, answer, at most 4 turns of 1,500 characters), and the eval set's planted-history jailbreak cases check that the model holds its rules anyway. Signing each answer (an HMAC the client sends back) would close the gap. It isn't done because the knowledge is public, the model has no tools or secrets, and the worst case is a strange answer on one visitor's screen.

## The budget (once, by hand)

`infra/budget.bicep` holds the $5 monthly budget on the resource group, emailing at $3 spent, $5 spent and a forecast over $5. The pipeline doesn't deploy it, because a budget's start date can't change after creation. Deploy it once, with the first day of the current month:

```bash
az deployment group create --resource-group rg-portfolio-ai-prod --template-file infra/budget.bicep --parameters alertEmail=<your email> startDate=2026-10-01
```

To change the amount or alerts later, redeploy with the same `startDate`.

## Foundry key auth (off, once, by hand)

Everything signs in to Foundry with Entra ID, so the account's keys are turned off. Bicep doesn't own the account, so this was a one-off command (2026-10-21):

```bash
az resource update --ids "$(az cognitiveservices account show -g rg-portfolio-ai-prod -n proj-portfolio-slm-resource --query id -o tsv)" --set properties.disableLocalAuth=true
```

In Git Bash, prefix `az` commands that take a `/subscriptions/…` ID with `MSYS_NO_PATHCONV=1`, or the path is rewritten.

## The daily summary email

At 06:00 UTC (`DailySummaryFunction`) the app emails you the numbers from the day before: questions, outcomes, tokens and an estimated cost, latency, the request IDs worth a look and the prompt versions. It holds **no question or answer text**, so the privacy page stays true: visitors' words stay in the 90-day log, and the email says how to open that day's file. A test fails if any of their text could reach it. Nobody asked anything: no email. Each sent day leaves a marker in `rate-limits/daily-summary/`, so a retry or a catch-up run after a restart never sends twice.

It goes through Azure Communication Services Email (`acs-jtassistant`, about $0.01 a month) from its Azure-managed `DoNotReply@…azurecomm.net` address, to `ALERT_EMAIL`. Keys are off on the service; the app signs in with its identity through a custom role that can send and nothing more. Mark the first one "not spam" if Gmail files it there.

Locally, with no `Email__…` settings, the summary is written to the console instead of sent. To try it, start Azurite and `func start`, put a log file for yesterday (UTC) in Azurite's `assistant-logs` container (`yyyy/MM/dd.jsonl`; today's questions only show up tomorrow), then run it from the host's admin endpoint. A second run logs "already sent":

```bash
curl -X POST http://localhost:7071/admin/functions/DailySummary -H "Content-Type: application/json" -d "{}"
```

**Once, before the first deploy that includes it** (each needs you, as an owner of the subscription):

1. Register the provider; the deploy identity can't, at resource-group scope:

   ```bash
   az provider register -n Microsoft.Communication --wait
   ```

2. Create the custom role (`infra/email-sender-role.bicep`) and note its ID:

   ```bash
   ROLE=$(az deployment group create -g rg-portfolio-ai-prod --template-file infra/email-sender-role.bicep --query properties.outputs.roleDefinitionId.value -o tsv)
   ```

3. Let the deploy identity assign it, by adding it to its role-assignment condition beside Storage Blob Data Owner and Foundry User:

   ```bash
   PID=$(az identity show -g rg-portfolio-ai-prod -n myGitHubDeployIdentity --query principalId -o tsv)
   az role assignment list --assignee "$PID" --role "Role Based Access Control Administrator" -g rg-portfolio-ai-prod --query "[0]" > rbac.json
   sed -i "s/53ca6127-db72-4b80-b1b0-d745d6d5456d}/53ca6127-db72-4b80-b1b0-d745d6d5456d, $ROLE}/g" rbac.json
   az role assignment update --role-assignment @rbac.json && rm rbac.json
   ```

**After that deploy**, check that keys are off, then send yesterday's summary by hand (a second run should log "already sent" and send nothing):

```bash
MSYS_NO_PATHCONV=1 az resource show -g rg-portfolio-ai-prod -n acs-jtassistant --resource-type Microsoft.Communication/communicationServices --query properties.disableLocalAuth
KEY=$(az functionapp keys list -g rg-portfolio-ai-prod -n func-jtassistant --query masterKey -o tsv)
curl -X POST https://func-jtassistant.azurewebsites.net/admin/functions/DailySummary -H "x-functions-key: $KEY" -H "Content-Type: application/json" -d "{}"
```

If the send fails with a 403, the custom role isn't enough; the fallback is the built-in *Communication and Email Service Owner*, which can also read keys, so decide it deliberately. To turn the email off: `az functionapp config appsettings set -g rg-portfolio-ai-prod -n func-jtassistant --settings AzureWebJobs.DailySummary.Disabled=true`.
