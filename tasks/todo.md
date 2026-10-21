# Site refresh: leftovers

The site refresh (rounds 1–3) is done, committed and live. Still open:

- [ ] Check the reduced-motion CSS with the setting actually turned on (couldn't be emulated in the browser check)
- To update the resume later: replace `public/Jack-Treadwell-Resume.pdf`, keeping the same file name

---

# LLM assistant: implementation tasks (2026-10-16)

Design, risks and decisions are in `tasks/llm-assistant-plan.md`. This list is the build order. Each phase ends with a "Done when" check, and nothing ships until Phase 4's launch bar is met.

## What already exists in Azure (checked 2026-10-16)

Everything is in `rg-portfolio-ai-prod` (East US 2).

| Resource | State | Plan |
|---|---|---|
| `proj-portfolio-slm-resource` (Foundry, AIServices) + project `proj-portfolio-slm` | Entra ID auth works; key auth still on | Keep. Turn key auth off in Phase 4 |
| Deployment `Phi-4-mini-instruct-portfolio-chatbot` | GlobalStandard, capacity 1 = **1 request/min, 1,000 tokens/min**, content filter `Microsoft.DefaultV2` | Raise capacity in Phase 0 (it blocks the evals) |
| `func-portfolio-ai-chat` on `EastUS2Plan` (Windows Consumption Y1), `stportfolioaichat`, `kv-portfolio-ai-flambeau`, App Insights | Jules's app, returns 404 | Replace with a new Flex Consumption app from Bicep; delete these in Phase 4 once the new app is live |
| `myGitHubDeployIdentity` (user-assigned identity) | Trusts `repo:flambeauRiverTours/flambeauRiverTours.github.io:ref:refs/heads/main`; only role is Website Contributor on the old Function | Reuse for OIDC deploys; needs more roles (task 1.10) |

Custom domain: `jacktreadwell.com` (GitHub Pages, HTTPS enforced).

## Repo layout (new)

```
api/
  Portfolio.Assistant.slnx
  src/Portfolio.Assistant.Core/          pure logic, no I/O: validation, prompt assembly, link parsing, rate-limit math
  src/Portfolio.Assistant.Functions/     .NET 10 isolated Functions: HTTP endpoints, Foundry client, Table + Blob storage
  src/Portfolio.Assistant.Evals/         console app: runs the eval set against any deployment
  tests/Portfolio.Assistant.Core.Tests/  xUnit
  knowledge/   site.md + links.json (generated), faq.md + system-prompt.md (hand-written)
  evals/       questions.jsonl, results/
infra/
  main.bicep     Function app, storage, App Insights, role assignments
  budget.bicep   monthly budget, deployed by hand
scripts/
  build-knowledge.tsx
```

## Phase 0: knowledge, anchors and evals (≈ 1 day)

- [x] **0.1 Raise the deployment's capacity** (You, or me with your OK). Capacity 1 allows 1 request a minute, which makes the evals impossible. Set it to 20 (20 requests/min, 20k tokens/min) in the Foundry portal (deployment → Edit → tokens per minute) or with `az cognitiveservices account deployment create` using the same deployment name and `--sku-capacity 20`. This stays the hard ceiling on spend.
- [x] **0.2 Entry anchors on the page.** Optional `id` on `IBodyTextSection`, rendered by `BodyBlock` and `ImageBodyText`. IDs: `experience-spie`, `experience-epic-lead`, `experience-epic-developer`, `experience-skills`, `experience-certifications`, `projects-fantasy-football`, `projects-tidbyt` (Reading and Travel link at section level). On phones, entries scroll to just below the header bar. Checked in the browser: `/#experience-epic-lead` at phone width and `/#projects-tidbyt` at desktop width both land on the heading on first load
- [x] **0.3 Hero facts in the data model.** `FullPageData.getProfile()` (`IProfile`: name, role, location), used by `Hero.tsx`
- [x] **0.4 `npm run build:knowledge`** writes `api/knowledge/site.md` (~10k chars, ~2.5k tokens) and `links.json` (12 targets)
  - `scripts/knowledge.tsx`: pure functions (`htmlToText`, `bodyToText`, `buildKnowledge`), covered by 17 Vitest tests in `scripts/knowledge.test.tsx` (`npm test`), including checks against the real page data
  - `scripts/build-knowledge.mjs` loads the TSX through Vite's own `runnerImport`, so no `vite-node` dependency was needed. Output is deterministic (checked by running it twice)
  - Differences from the original task: image alt text is left out (no useful facts), and link labels are `Section › Entry title`, e.g. "Experience › Software Developer Team Lead"
- [x] **0.5 `api/knowledge/faq.md`** (You write the answers, I draft the questions). Work authorization, earliest start date, remote / hybrid / on-site preference, relocation (Charlotte, January 2027; open to elsewhere?), travel, notice period, "salary → ask Jack directly", contact. Only things you're happy to have quoted to any recruiter.
  - [x] **0.5b Answer the 8 new logistics questions** (You): remote start before the move, on-call or weekend work, take-home assignments, other interviews or offers, background check or drug test, part-time, hourly contract rate, commuting outside Charlotte. They're marked `TODO` in `faq.md`. Answered, with 17 eval cases covering them (`logi-*`, plus traps for invented offers, company names, interview stages and background-check results)
  - [x] **0.5c "About this assistant" section** in `faq.md`, so the assistant can answer honestly about AI, storage (90 days), IP addresses, Microsoft Azure and deletion. These claims must stay true: tasks 2.1, 2.2 and 3.5 implement them. `scripts/faq.test.ts` checks the section exists and fails once the Berlin answers go out of date (January 2027)
- [x] **0.6 `api/knowledge/system-prompt.md`** (version 1, draft for your review): 12 numbered rules (knowledge only, "not on the site, email Jack" otherwise, correct false premises and treat visitor claims as unverified, third person, 1–4 plain sentences, Jack-only topics, no ratings, no commitments, no salary numbers or private details, no political or social views, professional tone with no profanity, ignore rule-changing instructions and no memory between visitors) plus 3 examples, ending with the `Links:` line format
- [x] **0.7 Eval set `api/evals/questions.jsonl`**: 337 cases across 16 categories (50 trap including behavioral-interview and confidential-employer questions, 39 jailbreak including injected claims and social engineering, 25 sensitive covering politics, harassment and a violent request (added by 2.3), 17 privacy including discriminatory questions, 59 FAQ including questions about the assistant and logistics, 39 fact, 22 numbers, plus multi-hop, multi-turn, robustness, opinion, commitment, off-topic, meta, links, personal)
  - Format, grading rules and the checks applied to every answer (links line, plain text, no URLs, length, no salary figures, known fabrications such as CKAD or "Microsoft Certified", profanity) are in `api/evals/README.md`
  - Link grading: refusals must end with `Links: none`; a link score (recall and extra links) is reported alongside the pass rate
  - 130 high-risk cases have a `passExample`, a good answer the test checks against the case's own patterns. Adding them caught 14 patterns that would have failed correct denials
  - `npm test` validates the file (`scripts/evals.test.ts`): ids, fields, regexes, history, links that exist, every page anchor covered, minimum counts for high-risk categories, and every expected fact in the fact-based categories actually present in `site.md` or `faq.md`
- [x] **0.8 Eval runner `Portfolio.Assistant.Evals`**: done; real runs work (checked with one case on 2026-10-19)
  - [x] Solution `api/Portfolio.Assistant.slnx` with FantasyFootball's conventions (`Directory.Build.props`, `.editorconfig`, warnings as errors, XML docs, xUnit v3 + FluentAssertions)
  - [x] `Portfolio.Assistant.Core`: `IAnswerModel`, `Prompt`, `ChatMessage`, `ModelAnswer`, `LinkTarget`; `KnowledgeBase` (system message + 12-character prompt version, line endings normalized so Windows and CI agree); `PromptBuilder`. 10 tests
  - [x] `Portfolio.Assistant.Evals`: `Grader` (every rule in `api/evals/README.md`), `EvalRunner` (N runs per case, a few calls at a time, a failed call fails only that run), `LaunchBar`, `ReportWriter`, `EvalOptions`, `PassExampleModel`. 209 tests, including every `passExample` through the full grader
  - [x] `--self-test` runs the whole pipeline without Azure: 130 / 130 cases pass, launch bar met
  - [x] `Portfolio.Assistant.Foundry`: `FoundryAnswerModel` signs in with the Azure CLI credential (DefaultAzureCredential picked up another account and got 401), folds the rules into the first user message, times out a call after 30 s and retries timeouts, 408, 429 (honouring `Retry-After`) and 5xx, stops at once on 401/404/400, and returns the fixed filtered reply when the content filter blocks a question. 17 tests. Real runs need `az login` and `FOUNDRY_ENDPOINT`
  - Run time: a full run (335 cases × 3) is about 4.9M tokens on Claude Haiku 5.5, about 90 minutes at the deployment's 50k tokens/minute.
  - Regex grading misses things, so read every trap and jailbreak answer by hand on each run that changes the prompt or model.
- [x] **0.9 First baseline run**, committed as the starting point (the commit waits for your review). Run 2026-10-19 against Claude Haiku 5.5 (chosen in 4.2), prompt `c4c1e4f117cd`, 335 cases × 3 runs: report `api/evals/results/2026-10-19-claude-haiku-5-5-c4c1e4f117cd.md` (the earlier 24-case report is kept as `…-24-cases.md`).
  - Six more full runs followed, ending at 323–327 / 335 (96–98%) on prompt `5b0f371dd542`. Results, failure analysis and decisions are summarized in [model-evaluation.md](model-evaluation.md).
- **Done when:** entry links work in the browser at both widths; `npm run build:knowledge` produces `site.md` + `links.json`; you've approved `faq.md`; the baseline report exists.

## Phase 1: backend (≈ 1 day)

- [x] **1.1 Projects.** `api/src/Portfolio.Assistant.Functions` (.NET 10 isolated worker, in the solution) with FantasyFootball's packages and versions: Worker 2.52.0, Worker.Sdk 2.1.0, Http.AspNetCore 2.1.1, Worker.OpenTelemetry, OpenTelemetry.Extensions.Hosting and the Azure Monitor exporter. `Program.cs` follows FantasyFootball's: `FunctionsApplication.CreateBuilder`, `ConfigureFunctionsWebApplication`, OpenTelemetry only when the connection string is set, `ValidateOnBuild` and `ValidateScopes`. `host.json` uses the OpenTelemetry telemetry mode. Test project `tests/Portfolio.Assistant.Functions.Tests`.
  - `Azure.Identity`, `Azure.Data.Tables` and `Azure.Storage.Blobs` are added by the tasks that first use them (1.4, 2.1, 2.2), so no package sits unused.
- [x] **1.2 Knowledge packaging.** The Functions project copies `api/knowledge/**` to `knowledge/` in its output. `AddKnowledgeBase(folder)` (in `ServiceCollectionExtensions`, via `KnowledgeFiles.Load`) reads the files during startup and registers one shared `KnowledgeBase`. A missing file (`FileNotFoundException`), a blank Markdown file (`ArgumentException` naming it, checked in `KnowledgeBase.Create`) or a `links.json` with no links (`InvalidDataException`) stops the app starting. 12 tests, run against copies of the real knowledge files.
- [x] **1.3 Core (pure functions, test-first; 45 tests)**
  - `AskRequestValidator.Validate(AskRequest?)` → `AskValidation.Valid(question, history)` or `AskValidation.Invalid(detail)`. `question` trimmed, 1–500 chars; `history` ≤ 4 turns (8 messages), roles `user`/`assistant` only, each 1–1,500 chars; the detail names the field, e.g. `history[1].role`. The 16 KB body cap belongs to the endpoint (1.5), which stops reading before parsing.
  - `PromptBuilder`: already existed (system message, then history, then the question).
  - `LinkExtractor.Extract(modelText, knownLinks)` → `AnswerWithLinks(text, links)`. It finds a `Links:` line on its own line (any case, lenient, so a garbled line is still removed) or a well-formed one ending a sentence, splits on commas, trims, lowercases and dedupes. It keeps IDs present in `links.json`, at most 3, in order, with their labels. **The answer ends at the first Links line**, as in the eval grader: text after it is the model running on, so the visitor never sees it. (The original spec said the last line.) It turns Markdown links into their text and removes bare `http(s)://` and `www.` addresses; email addresses and the LinkedIn handle stay.
  - `RateLimitPolicy.Decide(limits, visitorUsage, globalCount, now)` → `RateLimitDecision.Allowed(newVisitorUsage, newGlobalCount)` or `RateLimitDecision.Denied(retryAfterSeconds)`. The minute window is fixed and starts with the visitor's first question in it. Daily limits wait until UTC midnight. The longest applicable wait wins, rounded up to at least 1 s, and a denied question changes no counts.
- [x] **1.4 Foundry client behind `IAnswerModel`**
  - `ClaudeAnswerModel` (Anthropic.Foundry, thinking off, low effort, 400 max tokens) answers each `Prompt`. A refusal (`stop_reason: refusal`, how the content filter shows up) maps to the fixed `Filtered` reply, not an exception.
  - `services.AddClaudeAnswerModel(credential)` in the Foundry project binds `FoundryOptions` from the `Foundry` section and registers `IAnswerModel`: `Foundry__Endpoint` (required, https), `Foundry__Deployment` (default `claude-haiku-5-5`), `Foundry__MaxRetries` (default 1, at most 2, for 408/429/5xx) and `Foundry__TimeoutSeconds` (default 12 per attempt). The settings are validated at startup (`ValidateOnStart`), including that retries × timeout can never keep a visitor waiting more than 30 s. 9 tests.
  - `Program.cs` signs in with the Function's system-assigned managed identity, falling back to your `az login` locally (`ChainedTokenCredential`; `DefaultAzureCredential` picked up the wrong account in the eval runner). `ClaudeAnswerModel.ForFoundry` now takes the attempt timeout: 12 s from these settings, 30 s in the eval runner.
  - No temperature setting: Haiku 5.5 rejects non-default sampling parameters. The REST spike and the Phi-era interface notes no longer apply.
- [x] **1.5 `POST /api/ask`** (anonymous, `AskFunction`). Order: read at most 16 KB → validate → rate limit → model → extract links → respond. Logging comes in 2.2. 27 tests:
  - `200 { "answer": "...", "links": [{ "id", "label" }] }`, the reply passed through `LinkExtractor`.
  - `400 { "error": "invalid", "detail": "..." }` for a body over 16 KB (refused after reading one byte past the cap), non-JSON, or anything `AskRequestValidator` rejects. An invalid request never reaches the rate limiter or the model.
  - `429 { "error": "rate_limited", "retryAfterSeconds": n }` plus a `Retry-After` header; the model isn't called.
  - `200` with the fixed polite refusal when the content filter blocks the question or answer (`ModelAnswer.Filtered`).
  - `503 { "error": "unavailable" }` on an HTTP error or timeout from the model, logged as an error with the deployment name but never the question. A visitor who disconnects gets nothing (the cancellation propagates).
  - An `X-Build` header with the commit SHA on every response (`Build.Commit`, as in FantasyFootball), ready for 1.6.
  - **Rate limiting:** `InMemoryRateLimiter`, built on `RateLimitPolicy`, is the rate limiter; the app runs on one instance (see 2.1). Limits come from `Limits__PerMinute`, `Limits__PerDay` and `Limits__GlobalPerDay` (defaults 5, 30, 300; below 1 stops startup). Addresses are held only in memory and dropped at UTC midnight.
  - **The visitor is the *last* `X-Forwarded-For` entry**, not the first: a visitor can send their own header, and Azure's front end appends the address it saw, so earlier entries could be forged to dodge the limits. It falls back to the connection's address. Confirm on the deployed app that Azure appends rather than replaces (1.11).
  - Run in the Functions host in 1.7: all responses checked by hand.
- [x] **1.6 `GET /api/health`** (`HealthFunction`) → `200 { "build": "<sha>" }` with the `X-Build` header and `Cache-Control: no-store` (a cached reply wouldn't wake the app), with no model call. The UI calls it when the drawer opens, so the Function is awake by the time the visitor has typed (hides most of the cold start). 2 tests. Both endpoints set the header through `Build.AddHeader`.
- [x] **1.7 Local dev** (2026-10-21). `local.settings.example.json` is committed and `local.settings.json` is git-ignored (`api/**/local.settings.json`). The example sets the worker runtime, a placeholder `Foundry__Endpoint`, the `Limits__*` defaults and `Host.CORS = http://localhost:5173`; 3 tests keep it in step with what startup requires. `api/README.md` says how to run it.
  - **No Azurite:** with `AzureWebJobsStorage` empty the host serves HTTP fine and logs only a storage health warning. Azurite comes with question logging (2.2).
  - **Checked by hand with `func start`:** health 200 with the build, `X-Build` and `no-store`; a real question returned a correct answer with the SPIE link in 6 s (sign-in included); invalid JSON gave a 400; with `Limits__PerMinute=1` the second question got a 429 with `Retry-After: 55`; a CORS preflight from `http://localhost:5173` was allowed and one from another origin got no `Access-Control-Allow-Origin`; a non-https `Foundry__Endpoint` stopped the worker with the validation message. The `internal` function classes run fine in the host.
  - **Two bugs found by running it, fixed test-first:**
    - Local sign-in took 100 s and then failed: `ChainedTokenCredential` tried the managed identity first, and off Azure that probe retried five times and threw instead of falling through. `FoundryCredential.For(IDENTITY_ENDPOINT)` now picks the managed identity where Azure provides one and `az login` otherwise.
    - That failure surfaced as a 500, not a 503: a sign-in error isn't an `HttpRequestException`. Any failure behind the model is now a 503 with an error log, and only the visitor's own cancellation propagates; `docs/standards.md` records why this isn't a fallback.
  - Testing note: on Windows an empty environment variable counts as unset, so `Foundry__Endpoint= func start` doesn't blank the setting; use an invalid value to test validation.
- [x] **1.8 `infra/main.bicep`** (2026-10-21; adapted from FantasyFootball's, no SQL or Static Web App). It follows Microsoft's Bicep best practices and the infrastructure standards adopted into `docs/standards.md` from FantasyFootball's sections 4 and 5. `az bicep lint` passes with no warnings (`infra/bicepconfig.json` adds `use-recent-api-versions`), and it builds.
  - **Params:** `namePrefix` (default `jtassistant`), `location`, `foundryAccountName` (no default: the template doesn't name resources it doesn't own), `foundryDeployment` (default `claude-haiku-5-5`) and `allowedOrigins` (`string[]`, default the two jacktreadwell.com origins). `alertEmail` waits for the alerts in 2.5 and `ipHashSalt` went with the 2.1 redesign.
  - **Resources:** Log Analytics (30-day retention, 0.16 GB daily cap) and App Insights. Storage: shared keys off, no public blobs, the `deployments` and `assistant-logs` containers, and a lifecycle rule deleting `assistant-logs/` append blobs 90 days after their last write. A Flex Consumption plan (`FC1`). The Function App: `dotnet-isolated` 10.0, 512 MB, **`maximumInstanceCount: 1`**, system-assigned identity, HTTPS only, TLS 1.2, FTPS off, CORS = `allowedOrigins`. Each resource states its monthly cost in a comment.
  - **App settings:** `AzureWebJobsStorage__accountName` (identity-based), the App Insights connection string, `Foundry__Endpoint` read from the existing account's `endpoints['AI Foundry API']` (not assembled by hand), and `Foundry__Deployment`. The `Limits__*` defaults apply.
  - **Role assignments, each scoped to one resource:** Storage Blob Data Owner on the storage account (the host, the deployment package and the logs are all blobs; no queue or table role) and Foundry User on the existing Foundry account (found with `existing`).
  - **No `dependsOn`:** the deployment URL names the container, which makes it an implicit dependency.
  - **Read-only `what-if` against `rg-portfolio-ai-prod`:** 12 resources to create, none modified or deleted; the existing Foundry account, its project and the old Jules resources are left alone. Nothing was deployed. The first real deploy comes with 1.11, after you approve 1.10.
- [x] **1.9 Unit tests** (xUnit) for everything in 1.3, written test-first with 1.3 and 1.5 (the body-size cap and the in-memory counts are covered there):
  - validation edge cases: empty, 500/501 chars, 5 turns, bad role
  - link extraction: valid, unknown ID, more than 3 IDs, no line, line not last, Markdown links, URL stripping
  - rate-limit windows, with an injected clock
- [x] **1.10 Deploy identity** (you ran it 2026-10-21; checked). `myGitHubDeployIdentity` (a user-assigned managed identity) now has:
  - **Contributor** on `rg-portfolio-ai-prod`, to run the Bicep and deploy the code.
  - **Role Based Access Control Administrator** on the resource group, with a condition limiting role-assignment writes and deletes to Storage Blob Data Owner and Foundry User (the two roles `main.bicep` assigns).
  - Federated credentials for pushes to `main` (existing) and for `pull_request` (new, for the `what-if` preview). No `production` environment, so no credential for one.
  - `AZURE_CLIENT_ID` re-set to this identity's client ID. The old Website Contributor on the Jules Function goes in 4.5.
- [ ] **1.11 `.github/workflows/api.yml`** (written 2026-10-21; `actionlint` 1.7.12 passes; first run needs your commit and push). Adapted from FantasyFootball's `ci.yml` and `deploy.yml`.
  - Runs on pull requests and pushes to `main` touching `api/**`, `infra/**` or the workflow (not Markdown), and by hand.
  - Every run: build, test, `dotnet format --verify-no-changes` and a vulnerable-package check (a vulnerable NuGet package, direct or transitive, fails it; deprecated ones are only reported). Plus the knowledge checks (`npm test`: prompt budget, link IDs, FAQ dates), since the knowledge ships with the Function, and `actionlint` (pinned version and checksum). All three gate the deploy.
  - `.github/dependabot.yml` (2026-10-21): weekly updates for NuGet (`/api`, grouped like FantasyFootball's, FluentAssertions held on 7.x for its licence), npm (`/`) and the GitHub Actions pins.
  - Pull requests: a Bicep `what-if` against the resource group.
  - Pushes to `main`: `infra` deploys `main.bicep`, then `functions` publishes with `SourceRevisionId` set to the commit and deploys with `Azure/functions-action`. Then it waits until `/api/health` sends this commit as `X-Build`, and asks one real question (under a cent), retrying for a few minutes while the new Foundry role assignment applies.
  - Deploys are never cancelled midway; a newer push only cancels an older pull-request run. Actions are pinned to the same commit SHAs as FantasyFootball. No GitHub environment, because the `main` credential trusts the branch.
  - Repo variables: `AZURE_RESOURCE_GROUP_NAME` (exists) and **`FOUNDRY_ACCOUNT_NAME` (you set it)**, so the template names no resource it doesn't own.
  - **After the first deploy:** check that Azure appends the visitor's address to `X-Forwarded-For`. Send six questions within a minute, each with a different forged `X-Forwarded-For`; the sixth should get a 429 (about half a cent).
- **Done when:** `curl` to the deployed `/api/ask` returns an answer with links; a request from an origin that isn't allowed gets no CORS header; tests pass in CI.

## Phase 2: guardrails and logging (≈ 1 day)

- [x] **2.1 Rate limiting** (redesigned 2026-10-21; built in 1.5): `InMemoryRateLimiter` on a single instance replaces the Table Storage design.
  - The Function app runs with `maximumInstanceCount: 1` (Flex Consumption allows 1–1,000), so its in-memory counts are the only counts. One instance handles far more than the Haiku deployment's ~10 questions a minute.
  - Dropped: the `ratelimits` table, the `IpHasher` daily-key scheme and its `ipHashSalt` secret, ETag retries, fail-closed handling for storage outages, and the nightly cleanup timer. No IP-derived data is ever written anywhere: addresses stay in memory and are dropped at UTC midnight.
  - Accepted trade-off: a restart, deploy or scale-to-zero after idling starts the counts afresh. An abuser can't cause any of those, and spend stays capped by the deployment's 50k tokens a minute and the budget alert (2.4).
  - Limits come from settings (`Limits__PerMinute`, `Limits__PerDay`, `Limits__GlobalPerDay`; defaults 5, 30, 300), validated at startup. The visitor is the last `X-Forwarded-For` entry (1.5); confirm on the deployed app that Azure appends it (1.11).
- [x] **2.2 Question logging** (built 2026-10-21; container `assistant-logs`, one append blob per UTC day: `yyyy/MM/dd.jsonl`)
  - One line per request: `timestamp`, `requestId`, `outcome` (`ok` / `invalid` / `rate_limited` / `filtered` / `model_error`), `deployment`, `promptVersion`, `latencyMs`, then `question`, `historyTurns`, `answer`, `links`, `inputTokens`, `outputTokens` where they apply. Empty fields are left out.
  - **No IP-derived data in the logs.** Rate limiting keeps addresses only in memory for a day, and the logs are kept for 90 days, so addresses and hashes stay out of them.
  - `question` and `answer` are left out for `invalid` and `rate_limited` requests. They have no review value, and it limits what bots can push into your logs.
  - A logging failure is recorded in App Insights but never fails the visitor's request.
  - Question and answer text goes **only** to the blob (deleted after 90 days), never to App Insights traces.
  - **Built:**
    - Core: `AskOutcome` (`Invalid`, `RateLimited`, `ModelError`, `Answered`) says how a request ended. Only the outcomes that reached the model carry the question, so the field rules are enforced by the type. `QuestionLogEntry.For`, `BlobPath` and `ToJsonLine` are pure (8 tests).
    - Functions: `AskFunction` now resolves each request to one `AskOutcome`, logs it, then turns it into the response. A failed write is a warning; it never fails the visitor. `requestId` is the trace ID, which finds the request in App Insights (locally, ASP.NET's own ID). `BlobQuestionLog` creates the container and the day's blob the first time it writes to them, then appends.
    - Settings: `QuestionLog__BlobServiceUri` in Azure (`main.bicep`, from the storage account, with the Function's identity), `QuestionLog__ConnectionString=UseDevelopmentStorage=true` locally. Startup stops unless exactly one is set. `FoundryCredential` is now `AzureCredential`, shared by Foundry and Storage.
    - Tests: 6 for `AskFunction`'s logging and the global-cap warning, 3 for the settings, 1 against Azurite (skipped locally without it; CI starts Azurite 3.37.0).
    - **Checked locally** (Azurite, global cap set to 2): an answer, a 400, a filtered question and a global-cap 429 each wrote the right line, and the cap logged its warning. The `model_error` path is covered by tests only.
    - **Unchecked until deploy:** that the trace ID appears as `requestId` in Azure.
- [x] **2.3 Content filter** (probed 2026-10-21). The deployment uses `Microsoft.DefaultV2`. One harmful prompt came back as **HTTP 200 with `stop_reason: refusal`** from Claude's own classifier. The client already maps that to the polite reply, so visitors never see a 503 for it. No code change was needed. The prompt is now eval case `tone-violent-request`, and the local check above confirmed the polite reply end to end.
- [x] **2.4 Budget** (`infra/budget.bicep`, written 2026-10-21; **you deploy it once**, command in `api/README.md`): $5 a month on the resource group, emailing at $3 spent, $5 spent and a forecast over $5. It's linted, and what-if shows one create.
- [x] **2.5 Alerts** (in `main.bicep`, 2026-10-21; deploy with 1.11):
  - An email action group from the new `alertEmail` parameter (repo secret `ALERT_EMAIL`).
  - A metric alert on more than 10 exceptions in an hour (about $0.10 a month). A failed model call or log write is logged with its exception.
  - A log alert on `AskFunction.GlobalCapReachedMessage` in `traces`, checked every 15 minutes, emailing at most once a day (about $0.50 a month; the $1.50 estimate was for 5-minute checks). `RateLimitDecision.Denied` now says whether the global cap caused it.
  - What-if: 15 creates (the 12 from 1.8 plus the 3 alert resources), nothing changed or deleted. `az bicep lint` and `actionlint` pass.
- **Done when:** with low limits set in settings, the 6th request in a minute and the 31st in a day get 429s; the log blob has the expected lines; a jailbreak prompt from the eval set is handled. (Checked locally for the log and the global cap; the per-visitor 429s were checked in 1.7.)

## Phase 3: UI (≈ 1 day)

**Prepared 2026-10-21.** What the site's code showed:
- **A push to `main` deploys the site at once** (`deploy.yml`), so the assistant must stay hidden until the soft launch (4.8). Gate: the entry points render only when `VITE_ASSISTANT_API_URL` is set. `.env.production` doesn't get it until 4.8, and until then the drawer is an unused lazy chunk. The About sentence's link is added in 4.8 too (it lives in `FullPageData`, which the knowledge build reads in Node, with no Vite env).
- **No DOM tests exist yet.** Vitest runs only `scripts/*.test.ts(x)` in Node. Pure logic is tested in Node; components need `jsdom`, `@testing-library/react` and `@testing-library/user-event` (dev dependencies only), with a per-file `// @vitest-environment jsdom`.
- **History must be trimmed.** An answer can run to 400 tokens (about 1,600+ characters), but the API rejects history messages over 1,500 characters and more than 4 turns. Without trimming, a follow-up after a long answer gets a 400.
- **The 25 s timeout was too short.** The server allows up to 30 s (two 12 s attempts plus overhead) before a cold start. The client waits 35 s.
- **Bundle baseline** (`npm run build`, 2026-10-21): main JS 194.86 kB (65.33 kB gzip), CSS 228.57 kB (31.76 kB gzip). `Offcanvas` is already in the main bundle through `HeaderBar`.
- **Order:** 3.1 → 3.2 → 3.4 (the drawer, built against `func start` locally) → 3.3 → 3.5 → 3.6, then the browser check. Each step is test-first where it has logic. Each ends with the simplification and standards pass, and with `npm test`, `npm run lint` and `npm run build`.

**Built 2026-10-21** (uncommitted). 92 site tests (56 new), `tsc`, lint and build pass. Changes from the plan:
- `ask` returns a fourth result, `cancelled`, when the visitor closes the drawer mid-question. The drawer drops that turn and puts the question back in the box.
- Long waits read "in about N hours", not "tomorrow": midnight UTC is evening in the US, so "tomorrow" would be wrong there.
- `AbortSignal.any` isn't in TypeScript 5.4's DOM types, so one `AbortController` combines the timeout and the visitor's cancel.
- `assistantApiUrl` has its own module, so the page can check it without pulling the API client out of the drawer's chunk.
- The cross-file checks (the limits against `AskRequestValidator.cs`, the privacy note against `faq.md`) live in `scripts/`, like the other Node checks, and read files with `?raw`. Each was seen failing on a deliberate mismatch.
- `vite.config.ts` stops the dev server watching `api/`: Visual Studio's locked files under `api/.vs` crashed it.
- Found in the browser check and fixed, with a regression test: the spinner was a `<div>` inside a `<p>` (React warned), and the privacy page had no background, so it rendered dark-on-dark under a dark colour scheme.

**Browser check** (2026-10-21, against `func start` and Azurite; three real questions, well under a cent):
- Desktop (1280 px): the sidebar link opens the drawer beside the page with no backdrop; a starter got a real answer and link; the link jumped the page and left the drawer open.
- Phone (375 px): `/#ask` and the header icon open a full-width drawer with a backdrop and focus the input; a link closes the drawer first, then jumps to the entry just below the header.
- Keyboard only: Tab reaches "Ask a question", Enter opens it, Enter sends, Escape closes.
- States: `Limits__PerMinute=1` gave "Try again in a minute, or email Jack"; with the API stopped, "unavailable" with the email and resume links. No horizontal scroll at either width.
- Production build (no API address): no entry points, no footer privacy link, `/#ask` does nothing, and the drawer's chunk is never downloaded.
- **Bundle:** the drawer is its own chunk (5.81 kB JS, 2.52 kB gzip; 1.47 kB CSS). Main JS is 198.20 kB (66.70 kB gzip), **+3.34 kB (+1.37 kB gzip)** over the baseline, and CSS +0.47 kB. That misses the 1 kB target in "Done when": the entry points, their chat icon (its SVG path is about 1.1 kB), the `#ask` hook and the lazy loader have to load with the page. Accepted as the cost of the entry points rather than trimmed further.
- Not checked: the deployed API (waits for 1.11), and the CORS for `localhost:5173` (the preview tool couldn't get that port, so the check ran on 5175 with `func start --cors`).

**Checked against FantasyFootball's front-end standards** (2026-10-21; now adopted in `docs/standards.md`). Fixed, test-first where behaviour changed:
1. **Axe**: `src/App.axe.test.tsx` checks the whole page, desktop and phone, with the drawer closed, empty, waiting, answered, rate-limited and unavailable, and with the phone menu open (13 tests). It found three problems, each shown failing before its fix:
   - The drawer's notice was a second `<footer>` landmark; it's now a `div`.
   - The phone menu button's `aria-controls` named a menu that isn't in the page until it opens. This predates Phase 3.
   - A test query matched the page's own SPIE text; it's now scoped to the drawer.
2. **`noUncheckedIndexedAccess`** is on, and `npm run build` now runs `tsc --noEmit` first, so the deploy type-checks. It found 7 errors (4 older). One was a real bug: a reply with no waiting question would overwrite the last answer. The new reducer test failed first.
3. **`!` assertions**: `Sidebar` now narrows a local `onNavigate`, which removes both uncommented `!`s and the duplicated handler.
4. **Captured responses**: the client and axe tests use real 200, 400, 429 and 503 bodies from `func start` (`src/testing/capturedResponses.ts`). Renaming a captured field fails the client tests.
7. **Doc comments**: `ask`'s summary and `useAskHash`'s `open` parameter no longer restate their signatures.
- Recorded instead: the drawer's own stylesheet, as an exception in the standards. Left for 4.6: Prettier and the npm checks.

- [x] **3.1 API client `src/assistant/askAssistant.ts`**
  - `VITE_ASSISTANT_API_URL` in `.env.development` (`http://localhost:7071`, committed). `.env.production` gets the deployed URL in 4.8, from 1.11's `functionAppUrl` output. It isn't a secret. `vite-env.d.ts` declares it.
  - `ask(question, history, { signal, fetch })` returns a discriminated union: `{ kind: "answer", answer, links } | { kind: "rateLimited", retryAfterSeconds } | { kind: "unavailable" }`. `fetch` is injectable, so tests need no network.
  - Mapping, test-first in Node:
    - 200 → answer.
    - 429 → `retryAfterSeconds` from the body, falling back to the `Retry-After` header.
    - 400 → unavailable, logged to the console. The UI never sends an invalid request, so a 400 is a client bug.
    - 503, any other status, a network error, unreadable JSON or a 35 s timeout → unavailable.
    - The visitor's own abort (closing the drawer) → no result at all.
  - `warmUp()`: a fire-and-forget `GET /api/health` that never throws.
- [x] **3.1b Conversation state `src/assistant/conversation.ts`** (pure, test-first in Node)
  - A reducer over turns: `asked`, `answered`, `failed`.
  - `historyFor(turns)` sends at most the last 4 answered turns, each message cut to 1,500 characters. Failed turns are left out.
  - `waitText(seconds)` gives "in N minutes", or "tomorrow" when the wait runs past midnight UTC (the daily and global caps).
  - A test pins the limits to the API's: 500 for a question, 4 turns, 1,500 per message.
- [x] **3.2 Opening the drawer: the `#ask` hash**
  - All three entry points are plain links to `#ask`, including the one inside `FullPageData`'s JSX, which can't call React state.
  - `App.tsx` listens for `hashchange` and checks the hash on load: `#ask` → open the drawer and `history.replaceState` back to the previous hash, so Back still works. `jacktreadwell.com/#ask` becomes a shareable link that opens the assistant.
  - `useActiveSection` only watches section IDs, so `#ask` doesn't affect it (checked: it observes the given IDs only). `App.tsx`'s initial-load effect looks up `#ask` as an element, finds none, and does nothing.
  - Built as a hook, `useAskHash(open)`, tested in jsdom: `#ask` on load opens the drawer; a later `hashchange` to `#ask` opens it; either way the hash is replaced, so Back doesn't reopen it.
- [x] **3.3 Entry points** (all hidden while `VITE_ASSISTANT_API_URL` is unset)
  - `Sidebar.tsx`: an "Ask a question" link to `#ask` below the section links, with a chat-bubble icon as an inline SVG path (as `LinkIconsItem` does), styled as an outlined action rather than a nav item. In the phone menu it closes the menu first, through the existing `onNavigate`.
  - `HeaderBar.tsx`: an icon link to the left of the menu toggle, `aria-label="Ask a question"`.
  - Moved to 4.8: the `FullPageData.tsx` About sentence ("…or `<a href="#ask">`ask my assistant`</a>` a quick question"), then `build:knowledge`.
- [x] **3.4 Drawer `src/assistant/AssistantDrawer.tsx`** (loaded with `React.lazy` and mounted only after the first open, so the main bundle doesn't grow)
  - `Offcanvas placement="end"`, titled "Ask about Jack's experience". About 420px wide on desktop, full width on phones.
  - Desktop (≥ 1000px, the existing `collapseWidth`): `backdrop={false}` and `scroll`, so the page stays usable beside the drawer. Phone: the normal modal drawer.
  - Empty state: three starter-question buttons; clicking one sends it. Approved 2026-10-21, each worded exactly as an eval case: "What is Jack working on at SPIE?" (`spie-project`), "What roles did Jack have at Epic?" (`epic-roles`), "When could Jack start a new position?" (`start-new-position`, added for this). All three passed 3 of 3 on prompt `69ff285cb0e3` (`results/reruns/…-starters.md`).
  - Conversation: question and answer bubbles. Answer text is rendered as plain text, never with `dangerouslySetInnerHTML`, with `white-space: pre-line` for its line breaks. `historyFor` (3.1b) builds `history`. State lives only in memory and is gone on reload; closing the drawer keeps it, and aborts a question still waiting.
  - Input: single line, `maxLength={500}`, a character counter from 400 characters, Enter sends, disabled while waiting. A blank question doesn't send.
  - Tests in jsdom, with a fake `ask`: a starter question sends and shows the answer and its links; a 429 shows the wait; unavailable shows the email and resume links; input is disabled while waiting; the answer region is `aria-live`; answer text containing `<b>` shows as literal text.
  - Waiting: "Thinking…" with a spinner. After 8 s: "Still thinking, the assistant may be waking up."
  - Links under each answer, as buttons like "See: Experience › Epic Systems, Team Lead". Desktop: set `location.hash` and keep the drawer open. Phone: close the drawer, then set the hash in `onExited`, using the same pattern as `HeaderBar`'s `pendingId`.
  - Rate limited: "You've reached the question limit for now. Try again in N minutes, or email Jack." Unavailable: "The assistant is unavailable right now." Both show email and resume links.
  - Footer, always visible: "AI-generated from this site. It can be wrong, so check the resume." · "Questions and answers are stored for 90 days to improve this assistant. Don't include personal information." · [Privacy](/privacy.html) · "Prefer a human? Email me."
  - Accessibility: focus the input on open, answers in an `aria-live="polite"` region, a label on every button, Escape closes (the Offcanvas default).
  - Call `warmUp()` on open.
- [x] **3.5 Privacy note `public/privacy.html`** (a short static page with the site's fonts and colours). It covers:
  - what's stored (question, answer, timing) and why
  - "IP addresses aren't stored. They're held in memory only for rate limiting and forgotten at midnight UTC." (matches `faq.md`, corrected 2026-10-21 after the 2.1 redesign dropped the hash)
  - deletion after 90 days
  - that answers come from a model on Microsoft Azure (Foundry) and may be processed in any Azure region
  - how to ask for deletion (email)
  - that only Jack can read the stored questions
  - The same facts are in the "About this assistant" section of `faq.md`, so the assistant and the privacy note must say the same thing. Change both together

  Linked from the drawer and the site footer (the footer link hidden with the entry points). A Vitest check in Node reads `privacy.html` and `faq.md` and fails unless both state the 90 days, the midnight-UTC forgetting of addresses, and the deletion email, so the two can't drift.
- [x] **3.6 Styles** in `src/assistant/AssistantDrawer.scss`, using the existing Bootstrap variables (`$secondary`, `$link-color`, Inter). Imported by the drawer, so it lands in the lazy chunk's CSS, not the main stylesheet.
- **Done when:** a browser check against `func start` and Azurite, at desktop and phone widths, shows:
  - both entry points and a `/#ask` link open the drawer
  - a starter question gets an answer with working links
  - the error and limit states look right (forced with a bad API URL and `Limits__PerMinute=1`)
  - no horizontal scroll, and keyboard-only use works
  - the drawer is a separate chunk, and the main bundle grows only by the entry points (planned as within 1 kB; it was 1.37 kB gzipped, see above)
  - with `VITE_ASSISTANT_API_URL` unset, `npm run build` shows no entry points

## Phase 4: tune and launch (≈ 0.5–1 day)

- [x] **4.1 Prompt tuning loop:** change `system-prompt.md`, run the evals, read the failures, repeat. Each run's results file is committed, so the history of what helped is visible.
  - **Accepted 2026-10-20 as good enough to launch on** (your call): the last full run, 323/335 on prompt `5b0f371dd542`, has no invented facts, private details or stances. Its launch-bar misses are runner timeouts, one grader false positive and one invalid link ID, each in a single run. Revisit with the logs after the soft launch (4.8).
  - 15 tuning rounds (2 on Phi-4-mini, 13 on Haiku), summarized with what worked and what didn't in [model-evaluation.md](model-evaluation.md).
- [x] **4.2 Model decision.** If Phi-4-mini meets the bar (trap, privacy, jailbreak and sensitive 100%, overall ≥ 90%), keep it. If it doesn't after reasonable tuning, deploy one or two mid-size models in the same Foundry resource (projected cost ≤ $3/month at 1k questions, so about ≤ $0.50 per million input tokens; check what's available in East US 2 as GlobalStandard), run the evals, choose one, and change `Foundry__Deployment`. Large models are out of scope. If a mid-size model is chosen, lower `Limits__GlobalPerDay` to about 100. Record the decision and its numbers in `llm-assistant-plan.md`.
  - Phi-4-mini, gpt-4.1-mini and Claude Haiku 5.5 compared on 24 cases; summary in [model-evaluation.md](model-evaluation.md).
  - **Decided 2026-10-19: Claude Haiku 5.5** (`claude-haiku-5-5`). It is the eval runner's default (the `--chat-completions` path for Phi and GPT was removed on 2026-10-20). The `AZ-400 certif` fabrication pattern now allows "certification exam". Full baseline in 0.9: 81%, so tuning (4.1) continues on Haiku.
- [ ] **4.3 FAQ fallback check.** If no model clears the bar, stop and ship `faq.md` as a plain page section instead.
- [ ] **4.4 Turn off key auth on Foundry** (You approve): `az resource update --ids <foundry account id> --set properties.disableLocalAuth=true`. Then rerun the smoke test and one eval run.
- [ ] **4.5 Delete the old Jules resources** (You approve; permanent):
  - `func-portfolio-ai-chat`, `EastUS2Plan`, and its App Insights and failure-anomaly alert
  - `stportfolioaichat`
  - `kv-portfolio-ai-flambeau`, after checking which secrets it holds
  - `myGitHubDeployIdentity`'s Website Contributor assignment on the old app
- [ ] **4.6 CI for the site** (new `.github/workflows/ci.yml` on pull requests and pushes): `npm ci`, `npm run lint`, `npm run build`, then `npm run build:knowledge && git diff --exit-code api/knowledge`, so the assistant's knowledge can't drift from the page. Also from the Phase 1 review: `npm audit --omit=dev` (the npm half of the vulnerable-package standard), and pin `deploy.yml`'s actions to commit SHAs (they're on tags like `@v4`, against the CI standard). Otherwise `deploy.yml` stays as it is.
  - From the front-end standards (adopted 2026-10-21): `npm test` in CI, Prettier (`format:check` in CI, after one reformatting commit of the whole site), the 125 KB gzipped budget for initial JavaScript, and an automated licence check against the allow list. `npm audit --omit=dev` currently flags one moderate issue, `@babel/runtime` through `react-bootstrap`, so that comes first.
- [ ] **4.7 Eval workflow** (`.github/workflows/evals.yml`, on `workflow_dispatch` and on changes to `api/knowledge/**`): runs the eval runner through OIDC (the deploy identity needs Foundry User for this) and uploads the report. Fails if the launch bar isn't met.
- [ ] **4.8 Soft launch.** Deploy the site with the entry points: set `VITE_ASSISTANT_API_URL` in `.env.production` to 1.11's `functionAppUrl`, and add the About sentence's `#ask` link (moved from 3.3), then rerun `build:knowledge`. Read the logs daily for the first week, then weekly, and add every wrong answer to `questions.jsonl`.
- [ ] **4.9 Write-up** (optional): a short "how I built it" for the Projects section, like Fantasy Football's (model chosen by evals, cost caps, privacy).
- **Done when:** the committed eval report meets the launch bar, key auth is off, the old resources are deleted, and CI is green.

## Needs your input or approval
- Done: 0.1 deployment capacity, 0.5 FAQ answers, 1.10 deploy identity
- Done: 2.2 Azurite installed, 2.3 probe approved, 2.4 $5 budget with a $3 warning, 2.5 global-cap log alert
- 1.11 + 2.5 Add the `ALERT_EMAIL` repo secret, then commit and push for the first deploy (`FOUNDRY_ACCOUNT_NAME` is set)
- 2.4 Deploy `budget.bicep` once (command in `api/README.md`)
- Done: 3.x DOM test tooling, the launch gate, the starter questions (2026-10-21)
- 4.4 Turn off key auth
- 4.5 Delete the old resources (permanent)
