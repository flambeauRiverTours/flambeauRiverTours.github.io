# Assistant API

The Azure Function behind "Ask about my experience": `POST /api/ask` answers a question about Jack from the knowledge in `knowledge/`, and `GET /api/health` reports the running build. Design and decisions are in `tasks/llm-assistant-plan.md`; the eval set and runner are in `evals/`.

## Projects

- `src/Portfolio.Assistant.Core`: pure logic (prompt, validation, link extraction, rate-limit maths), no I/O
- `src/Portfolio.Assistant.Foundry`: the Claude client for Microsoft Foundry
- `src/Portfolio.Assistant.Functions`: the Function app (HTTP endpoints, in-memory rate limiting)
- `src/Portfolio.Assistant.Evals`: the eval runner (see `evals/README.md`)
- `tests/`: one xUnit project per source project; run them all with `dotnet test Portfolio.Assistant.slnx`

## Running the Function locally

You need the .NET 10 SDK, Azure Functions Core Tools 4.x, Azurite (`npm install -g azurite`), and `az login` with an account that has the Foundry User role on the Foundry resource.

1. Copy `src/Portfolio.Assistant.Functions/local.settings.example.json` to `local.settings.json` in the same folder (git-ignored) and set `Foundry__Endpoint` to the resource's `https://<resource>.services.ai.azure.com` address.
2. Start Azurite's blob service in another terminal. The question log goes there, and the blob test in `tests/` runs against it (it's skipped when Azurite isn't running):

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

Each request adds a line to the day's log, `assistant-logs/yyyy/MM/dd.jsonl`. To read today's:

```bash
az storage blob download --connection-string UseDevelopmentStorage=true -c assistant-logs -n "$(date -u +%Y/%m/%d).jsonl" -f today.jsonl
```

Locally the app signs in with your `az login`; in Azure it uses its managed identity, chosen by whether `IDENTITY_ENDPOINT` is set. Bad settings stop it starting, with the setting named in the log.

## The budget (once, by hand)

`infra/budget.bicep` holds the $5 monthly budget on the resource group, emailing at $3 spent, $5 spent and a forecast over $5. The pipeline doesn't deploy it, because a budget's start date can't change after creation. Deploy it once, with the first day of the current month:

```bash
az deployment group create --resource-group rg-portfolio-ai-prod --template-file infra/budget.bicep --parameters alertEmail=<your email> startDate=2026-10-01
```

To change the amount or alerts later, redeploy with the same `startDate`.
