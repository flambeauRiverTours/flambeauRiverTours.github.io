# Assistant API

The Azure Function behind "Ask about my experience": `POST /api/ask` answers a question about Jack from the knowledge in `knowledge/`, and `GET /api/health` reports the running build. Design and decisions are in `tasks/llm-assistant-plan.md`; the eval set and runner are in `evals/`.

## Projects

- `src/Portfolio.Assistant.Core`: pure logic (prompt, validation, link extraction, rate-limit maths), no I/O
- `src/Portfolio.Assistant.Foundry`: the Claude client for Microsoft Foundry
- `src/Portfolio.Assistant.Functions`: the Function app (HTTP endpoints, in-memory rate limiting)
- `src/Portfolio.Assistant.Evals`: the eval runner (see `evals/README.md`)
- `tests/`: one xUnit project per source project; run them all with `dotnet test Portfolio.Assistant.slnx`

## Running the Function locally

You need the .NET 10 SDK, Azure Functions Core Tools 4.x, and `az login` with an account that has the Foundry User role on the Foundry resource.

1. Copy `src/Portfolio.Assistant.Functions/local.settings.example.json` to `local.settings.json` in the same folder (git-ignored) and set `Foundry__Endpoint` to the resource's `https://<resource>.services.ai.azure.com` address.
2. From that folder, run `func start`. It builds the app and serves it on `http://localhost:7071`. No storage emulator is needed yet: the "AzureWebJobsStorage unhealthy" lines are expected until question logging (task 2.2) adds Azurite.
3. Check it:

   ```bash
   curl http://localhost:7071/api/health
   ```

   ```bash
   curl -X POST http://localhost:7071/api/ask -H "Content-Type: application/json" -d "{\"question\":\"Where does Jack work now?\"}"
   ```

Each question is one real model call (well under a cent). To try the rate limit without spending more, start with a lower limit, for example `Limits__PerMinute=1 func start`: the second question in a minute gets a 429. The site's dev server (`npm run dev`, `http://localhost:5173`) is allowed by CORS.

Locally the app signs in with your `az login`; in Azure it uses its managed identity, chosen by whether `IDENTITY_ENDPOINT` is set. Bad settings stop it starting, with the setting named in the log.
