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
- [x] **0.7 Eval set `api/evals/questions.jsonl`**: 335 cases across 16 categories (50 trap including behavioral-interview and confidential-employer questions, 39 jailbreak including injected claims and social engineering, 24 sensitive covering politics and harassment, 17 privacy including discriminatory questions, 58 FAQ including questions about the assistant and logistics, 39 fact, 22 numbers, plus multi-hop, multi-turn, robustness, opinion, commitment, off-topic, meta, links, personal)
  - Format, grading rules and the checks applied to every answer (links line, plain text, no URLs, length, no salary figures, known fabrications such as CKAD or "Microsoft Certified", profanity) are in `api/evals/README.md`
  - Link grading: refusals must end with `Links: none`; a link score (recall and extra links) is reported alongside the pass rate
  - 130 high-risk cases have a `passExample`, a good answer the test checks against the case's own patterns. Adding them caught 14 patterns that would have failed correct denials
  - `npm test` validates the file (`scripts/evals.test.ts`): ids, fields, regexes, history, links that exist, every page anchor covered, minimum counts for high-risk categories, and every expected fact in the fact-based categories actually present in `site.md` or `faq.md`
- [ ] **0.8 Eval runner `Portfolio.Assistant.Evals`**: structure done, waiting on the Foundry client (1.4)
  - [x] Solution `api/Portfolio.Assistant.slnx` with FantasyFootball's conventions (`Directory.Build.props`, `.editorconfig`, warnings as errors, XML docs, xUnit v3 + FluentAssertions)
  - [x] `Portfolio.Assistant.Core`: `IAnswerModel`, `Prompt`, `ChatMessage`, `ModelAnswer`, `LinkTarget`; `KnowledgeBase` (system message + 12-character prompt version, line endings normalized so Windows and CI agree); `PromptBuilder`. 10 tests
  - [x] `Portfolio.Assistant.Evals`: `Grader` (every rule in `api/evals/README.md`), `EvalRunner` (N runs per case, a few calls at a time, a failed call fails only that run), `LaunchBar`, `ReportWriter`, `EvalOptions`, `PassExampleModel`. 209 tests, including every `passExample` through the full grader
  - [x] `--self-test` runs the whole pipeline without Azure: 130 / 130 cases pass, launch bar met
  - [ ] `FoundryAnswerModel` (task 1.4): implements `IAnswerModel`, signs in with `DefaultAzureCredential`, waits and retries on `429`/`Retry-After`. Then remove the "isn't built yet" exit in `Program.cs`
  - Run time: a full run (335 cases × 3) is about 4.7M tokens, about 4 hours at 20k tokens/minute. Raise the deployment's capacity temporarily for full runs.
  - Regex grading misses things, so read every trap and jailbreak answer by hand on each run that changes the prompt or model.
- [ ] **0.9 First baseline run** against Phi-4-mini, committed as the starting point. Expect failures; tuning is Phase 4.
- **Done when:** entry links work in the browser at both widths; `npm run build:knowledge` produces `site.md` + `links.json`; you've approved `faq.md`; the baseline report exists.

## Phase 1: backend (≈ 1 day)

- [ ] **1.1 Projects.** Create the solution from the layout above: .NET 10, `Nullable` and `TreatWarningsAsErrors` on. Functions packages as in FantasyFootball (`Microsoft.Azure.Functions.Worker` 2.x, `.Sdk`, `.Extensions.Http.AspNetCore`, OpenTelemetry + Azure Monitor exporter) plus `Azure.Identity`, `Azure.Data.Tables`, `Azure.Storage.Blobs`. `Program.cs` follows FantasyFootball's: `FunctionsApplication.CreateBuilder`, `ConfigureFunctionsWebApplication`, OpenTelemetry only when the connection string is set, `ValidateOnBuild`.
- [ ] **1.2 Knowledge packaging.** The Functions project copies `api/knowledge/*.md` and `links.json` to its output (`<None Include="..\..\knowledge\**" CopyToOutputDirectory="PreserveNewest" LinkBase="knowledge" />`). They're loaded once at startup into a singleton `KnowledgeBase` (system message, prompt version, link list). A missing or empty file fails startup.
- [ ] **1.3 Core (pure functions, all unit-tested in 1.9)**
  - `AskRequestValidator`: body ≤ 16 KB; `question` trimmed, 1–500 chars; `history` ≤ 4 turns (8 messages), roles `user`/`assistant` only, each ≤ 1,500 chars. Returns a typed error for the 400 response.
  - `PromptBuilder`: system message (system prompt + knowledge), then history, then the question.
  - `LinkExtractor`: takes the raw model text, finds the last non-empty line matching `^\s*Links:\s*(.*)$` (case-insensitive), splits on commas, trims, lowercases and dedupes. Keeps IDs present in `links.json`, at most 3, in order, and removes the line from the answer. A missing or garbled line → no links, answer unchanged. Also strips Markdown link syntax and bare URLs from the answer text.
  - `RateLimitPolicy`: given the current counters and `now`, decides allow or deny and returns `retryAfterSeconds`.
- [ ] **1.4 Foundry client behind `IAnswerModel`**
  - `Task<ModelAnswer> AnswerAsync(IReadOnlyList<ChatMessage> messages, CancellationToken ct)` → text, input/output tokens, finish reason, deployment name.
  - **Spike first (≤ 1 h):** confirm Microsoft's current recommended .NET client for Foundry Models with Entra ID. Known-good fallback, tested 2026-10-16: `POST https://proj-portfolio-slm-resource.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview`, `model` = deployment name, bearer token for scope `https://cognitiveservices.azure.com/.default`. If the chosen SDK supports `IChatClient` (Microsoft.Extensions.AI), implement `IAnswerModel` on top of it.
  - Settings: `Foundry__Endpoint`, `Foundry__Deployment`, `Foundry__MaxTokens` (400), `Foundry__Temperature` (0.2), `Foundry__TimeoutSeconds` (20). Credential: `DefaultAzureCredential` (managed identity in Azure, your `az login` locally).
  - At most 1 retry, only on 429/5xx, so a visitor never waits more than ~25 s.
  - A content-filter rejection from Foundry maps to a `Filtered` result, not an exception.
- [ ] **1.5 `POST /api/ask`** (anonymous). Order: validate → rate limit → model → extract links → log → respond.
  - `200 { "answer": "...", "links": [{ "id", "label" }] }`
  - `400 { "error": "invalid", "detail": "..." }`
  - `429 { "error": "rate_limited", "retryAfterSeconds": n }`, plus a `Retry-After` header
  - `200` with a fixed polite refusal when the content filter blocks the question or answer (honest, not a fake answer)
  - `503 { "error": "unavailable" }` on model timeout or error
  - An `X-Build` header with the commit SHA, as in FantasyFootball.
- [ ] **1.6 `GET /api/health`** → `200 { "build": "<sha>" }`, with no model call. The UI calls it when the drawer opens, so the Function is awake by the time the visitor has typed (hides most of the cold start).
- [ ] **1.7 Local dev.** `local.settings.json` (git-ignored) with Azurite for storage and your `az login` for Foundry; `local.settings.example.json` committed. CORS for `http://localhost:5173` in `Host.CORS`.
- [ ] **1.8 `infra/main.bicep`** (copied and trimmed from FantasyFootball: no SQL, no Static Web App)
  - Params: `namePrefix` (e.g. `jtassistant`), `alertEmail`, `allowedOrigins` (default `['https://jacktreadwell.com', 'https://www.jacktreadwell.com']`), `foundryAccountName` (`proj-portfolio-slm-resource`), `foundryDeployment`, and `ipHashSalt` (`@secure()`, default `newGuid()`). The secret rotates on each deploy and exists only in the Function's settings; 2.1 derives a daily key from it.
  - Resources: Log Analytics (30-day retention, daily cap) + App Insights; storage (`allowSharedKeyAccess: false`, no public blobs) with the `deployments` container, the `ratelimits` table and the `assistant-logs` container; Flex Consumption plan (`FC1`); Function app (`dotnet-isolated` `10.0`, 512 MB, system-assigned identity, CORS = `allowedOrigins`).
  - **Lifecycle rule:** a `managementPolicies` rule deletes blobs under `assistant-logs/` 90 days after last modification (append blobs support delete).
  - **Role assignments:** the Function's identity gets the three storage data roles (as in FantasyFootball) and **Foundry User** (`53ca6127-db72-4b80-b1b0-d745d6d5456d`), scoped to the existing Foundry account through an `existing` resource reference.
  - Outputs: `functionAppName`, `functionAppUrl`.
- [ ] **1.9 Unit tests** (xUnit) for everything in 1.3:
  - validation edge cases: empty, 500/501 chars, 5 turns, bad role
  - link extraction: valid, unknown ID, more than 3 IDs, no line, line not last, Markdown links, URL stripping
  - rate-limit windows, with an injected clock
- [ ] **1.10 Deploy identity** (You approve; changes Azure permissions). `myGitHubDeployIdentity` can only touch the old Function today. It needs:
  - **Contributor** on `rg-portfolio-ai-prod`, to run the Bicep.
  - **Role Based Access Control Administrator** on the resource group, with a condition that it may only assign the three storage roles and Foundry User (as in FantasyFootball's runbook step 4).
  - A second federated credential for `repo:flambeauRiverTours/flambeauRiverTours.github.io:environment:production` if the workflow uses a `production` environment (the existing one only trusts the `main` branch).
  - A check that the repo's `AZURE_CLIENT_ID` secret is this identity's client ID.
- [ ] **1.11 `.github/workflows/api.yml`**, modelled on FantasyFootball's `deploy.yml`: runs on push to `main` with `paths: [api/**, infra/**]` and on `workflow_dispatch`.
  - `infra` job: `az deployment group create -g rg-portfolio-ai-prod --template-file infra/main.bicep …`
  - `functions` job: `dotnet test`, `dotnet publish`, `Azure/functions-action`.
  - Smoke step: poll `/api/health` until `build` equals `$GITHUB_SHA` (up to ~2 min).
  - Actions pinned to commit SHAs, as in FantasyFootball.
- **Done when:** `curl` to the deployed `/api/ask` returns an answer with links; a request from an origin that isn't allowed gets no CORS header; tests pass in CI.

## Phase 2: guardrails and logging (≈ 1 day)

- [ ] **2.1 Rate limiting** (Table Storage, table `ratelimits`)
  - Client IP from the first entry of `X-Forwarded-For`.
  - **Daily key:** `dailyKey = HMAC-SHA256(ipHashSalt, yyyyMMdd)` (UTC date), then `ipHash = HMAC-SHA256(dailyKey, ip)`, first 16 hex chars. The same visitor gets a different hash each day, so hashes can't be linked across days. Don't use the date itself as the salt: it isn't secret, and all ~4.3B IPv4 addresses can be brute-forced in minutes. A pure function in Core (`IpHasher`), written test-first: same IP and day → same hash; different day → different hash; different secret → different hash.
  - One row per IP per day (`PartitionKey = yyyyMMdd`, `RowKey = ipHash`) holding `DayCount`, `MinuteStart` and `MinuteCount`, so the 5/min and 30/day limits need one read and one write. One global row (`RowKey = "_global"`) for the 300/day cap.
  - Updates use the ETag (optimistic concurrency) and retry up to 3 times on conflict. If storage fails, **deny** (fail closed), so storage problems can't remove the cost cap.
  - Limits in settings (`Limits__PerMinute`, `Limits__PerDay`, `Limits__GlobalPerDay`), so you can change them without a deploy.
  - **Daily cleanup (required):** a timer Function at 00:15 UTC deletes every `ratelimits` partition older than yesterday, so no IP-derived data lives longer than about 48 hours. Unit-test the cutoff date logic; check in Azure that yesterday's rows are gone the next morning.
  - Side effect, accepted: a visitor's per-minute count resets at midnight UTC.
- [ ] **2.2 Question logging** (container `assistant-logs`, one append blob per UTC day: `yyyy/MM/dd.jsonl`)
  - One line per request: `ts`, `requestId`, `outcome` (`ok` / `invalid` / `rate_limited` / `filtered` / `model_error`), `question`, `historyTurns`, `answer`, `links`, `deployment`, `promptVersion`, `latencyMs`, `inputTokens`, `outputTokens`.
  - **No IP hash in the logs.** Abuse within a day shows up in the rate-limit counters, and the logs are kept for 90 days, so IP-derived data stays out of them.
  - `question` and `answer` are left out for `invalid` and `rate_limited` requests. They have no review value, and it limits what bots can push into your logs.
  - A logging failure is recorded in App Insights but never fails the visitor's request.
  - Question and answer text goes **only** to the blob (deleted after 90 days), never to App Insights traces.
- [ ] **2.3 Content filter.** The deployment uses `Microsoft.DefaultV2`. Confirm in a test that a blocked prompt comes back as a filter result and maps to the polite refusal (1.4, 1.5). Keep the default; don't loosen it.
- [ ] **2.4 Budget** (`infra/budget.bicep`, deployed by hand as in FantasyFootball): $5/month on `rg-portfolio-ai-prod`, alerts at 50% actual and 100% forecast, sent to your email.
- [ ] **2.5 Alerts:** an App Insights alert on the `model_error` rate (e.g. more than 5 in 15 min) and another when the global daily cap is hit, so you know when the assistant is down or under attack.
- **Done when:** with low limits set in settings, the 6th request in a minute and the 31st in a day get 429s; the log blob has the expected lines; a jailbreak prompt from the eval set is handled.

## Phase 3: UI (≈ 1 day)

- [ ] **3.1 API client `src/assistant/askAssistant.ts`**
  - `VITE_ASSISTANT_API_URL` in `.env.production` (the deployed Function URL, not a secret) and `.env.development` (`http://localhost:7071`).
  - `ask(question, history, signal)` returns a discriminated union: `{ kind: "answer", answer, links } | { kind: "rateLimited", retryAfterSeconds } | { kind: "unavailable" }`. Client timeout 25 s via `AbortController`.
  - `warmUp()`: fire-and-forget `GET /api/health`.
- [ ] **3.2 Opening the drawer: the `#ask` hash**
  - All three entry points are plain links to `#ask`, including the one inside `FullPageData`'s JSX, which can't call React state.
  - `App.tsx` listens for `hashchange` and checks the hash on load: `#ask` → open the drawer and `history.replaceState` back to the previous hash, so Back still works. `jacktreadwell.com/#ask` becomes a shareable link that opens the assistant.
  - `useActiveSection` only watches section IDs, so `#ask` shouldn't affect it. Check.
- [ ] **3.3 Entry points**
  - `Sidebar.tsx`: an "Ask a question" button below the section links, with a chat-bubble icon as an inline SVG path (as `LinkIconsItem` does), styled as an outlined action rather than a nav item.
  - `HeaderBar.tsx`: an icon button to the left of the menu toggle, `aria-label="Ask a question"`.
  - `FullPageData.tsx` About contact sentence: "…email me, reach out on LinkedIn, or `<a href="#ask">`ask my assistant`</a>` a quick question." Then rerun `build:knowledge`.
- [ ] **3.4 Drawer `src/assistant/AssistantDrawer.tsx`** (loaded with `React.lazy` and mounted only after the first open, so the main bundle doesn't grow)
  - `Offcanvas placement="end"`, titled "Ask about Jack's experience". About 420px wide on desktop, full width on phones.
  - Desktop (≥ 1000px, the existing `collapseWidth`): `backdrop={false}` and `scroll`, so the page stays usable beside the drawer. Phone: the normal modal drawer.
  - Empty state: three starter-question buttons; clicking one sends it.
  - Conversation: question and answer bubbles. Answer text is rendered as plain text, never with `dangerouslySetInnerHTML`. The last 4 turns go to the API as `history`. State lives only in memory and is gone on reload.
  - Input: single line, `maxLength={500}`, a character counter from 400 characters, Enter sends, disabled while waiting.
  - Waiting: "Thinking…" with a spinner. After 8 s: "Still thinking, the assistant may be waking up."
  - Links under each answer, as buttons like "See: Experience › Epic Systems, Team Lead". Desktop: set `location.hash` and keep the drawer open. Phone: close the drawer, then set the hash in `onExited`, using the same pattern as `HeaderBar`'s `pendingId`.
  - Rate limited: "You've reached the question limit for now. Try again in N minutes, or email Jack." Unavailable: "The assistant is unavailable right now." Both show email and resume links.
  - Footer, always visible: "AI-generated from this site. It can be wrong, so check the resume." · "Questions and answers are stored for 90 days to improve this assistant. Don't include personal information." · [Privacy](/privacy.html) · "Prefer a human? Email me."
  - Accessibility: focus the input on open, answers in an `aria-live="polite"` region, a label on every button, Escape closes (the Offcanvas default).
  - Call `warmUp()` on open.
- [ ] **3.5 Privacy note `public/privacy.html`** (a short static page with the site's fonts and colours). It covers:
  - what's stored (question, answer, timing) and why
  - "IP addresses aren't stored. A hash that changes daily is used only for rate limiting and deleted after a day." Don't call it "anonymous": while the secret exists, the hash is pseudonymous
  - deletion after 90 days
  - that answers come from a model on Microsoft Azure (Foundry) and may be processed in any Azure region
  - how to ask for deletion (email)
  - that only Jack can read the stored questions
  - The same facts are in the "About this assistant" section of `faq.md`, so the assistant and the privacy note must say the same thing. Change both together

  Linked from the drawer and the footer.
- [ ] **3.6 Styles** in `src/assistant/AssistantDrawer.scss`, using the existing Bootstrap variables (`$secondary`, `$link-color`, Inter).
- **Done when:** a browser check at desktop and phone widths shows:
  - all three entry points open the drawer
  - a starter question gets an answer with working links
  - the error and limit states look right (forced with a bad API URL and low limits)
  - no horizontal scroll, and keyboard-only use works
  - the main bundle size is unchanged, because the drawer is a separate chunk

## Phase 4: tune and launch (≈ 0.5–1 day)

- [ ] **4.1 Prompt tuning loop:** change `system-prompt.md`, run the evals, read the failures, repeat. Each run's results file is committed, so the history of what helped is visible.
- [ ] **4.2 Model decision.** If Phi-4-mini meets the bar (trap, privacy, jailbreak and sensitive 100%, overall ≥ 90%), keep it. If it doesn't after reasonable tuning, deploy one or two mid-size models in the same Foundry resource (projected cost ≤ $3/month at 1k questions, so about ≤ $0.50 per million input tokens; check what's available in East US 2 as GlobalStandard), run the evals, choose one, and change `Foundry__Deployment`. Large models are out of scope. If a mid-size model is chosen, lower `Limits__GlobalPerDay` to about 100. Record the decision and its numbers in `llm-assistant-plan.md`.
- [ ] **4.3 FAQ fallback check.** If no model clears the bar, stop and ship `faq.md` as a plain page section instead.
- [ ] **4.4 Turn off key auth on Foundry** (You approve): `az resource update --ids <foundry account id> --set properties.disableLocalAuth=true`. Then rerun the smoke test and one eval run.
- [ ] **4.5 Delete the old Jules resources** (You approve; permanent):
  - `func-portfolio-ai-chat`, `EastUS2Plan`, and its App Insights and failure-anomaly alert
  - `stportfolioaichat`
  - `kv-portfolio-ai-flambeau`, after checking which secrets it holds
  - `myGitHubDeployIdentity`'s Website Contributor assignment on the old app
- [ ] **4.6 CI for the site** (new `.github/workflows/ci.yml` on pull requests and pushes): `npm ci`, `npm run lint`, `npm run build`, then `npm run build:knowledge && git diff --exit-code api/knowledge`, so the assistant's knowledge can't drift from the page. `deploy.yml` stays as it is.
- [ ] **4.7 Eval workflow** (`.github/workflows/evals.yml`, on `workflow_dispatch` and on changes to `api/knowledge/**`): runs the eval runner through OIDC (the deploy identity needs Foundry User for this) and uploads the report. Fails if the launch bar isn't met.
- [ ] **4.8 Soft launch.** Deploy the site with the entry points. Read the logs daily for the first week, then weekly, and add every wrong answer to `questions.jsonl`.
- [ ] **4.9 Write-up** (optional): a short "how I built it" for the Projects section, like Fantasy Football's (model chosen by evals, cost caps, privacy).
- **Done when:** the committed eval report meets the launch bar, key auth is off, the old resources are deleted, and CI is green.

## Needs your input or approval
- 0.1 Raise the deployment capacity (changes an Azure resource)
- 0.5 FAQ answers
- 1.10 Role assignments and federated credential for the deploy identity
- 4.4 Turn off key auth
- 4.5 Delete the old resources (permanent)
