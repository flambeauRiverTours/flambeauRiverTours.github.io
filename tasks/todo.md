# Site refresh: leftovers

- [ ] Check the reduced-motion CSS with the setting actually turned on (couldn't be emulated in the browser check)
- To update the resume: replace `public/Jack-Treadwell-Resume.pdf`, keeping the file name

---

# LLM assistant: implementation tasks

Design, risks and decisions: `tasks/llm-assistant-plan.md`. Eval history: `tasks/model-evaluation.md`. Nothing ships until Phase 4's launch bar is met. Done items are one line each; the detail is in git history.

## Phase 0: knowledge, anchors and evals (done)

- [x] 0.1 Deployment capacity raised (now 50k tokens a minute on `claude-haiku-5-5`)
- [x] 0.2 Entry anchors on the page (`experience-spie` etc.), checked at both widths
- [x] 0.3 Hero facts in the data model (`FullPageData.getProfile()`)
- [x] 0.4 `npm run build:knowledge` writes `site.md` and `links.json` from the page
- [x] 0.5 `faq.md` answered, including logistics and "About this assistant" (`faq.test.ts` fails once the Berlin answers date, January 2027)
- [x] 0.6 `system-prompt.md`: 12 rules, 3 examples, the `Links:` line
- [x] 0.7 Eval set: 337 cases in 16 categories, validated by `scripts/evals.test.ts`; format in `api/evals/README.md`
- [x] 0.8 Eval runner `Portfolio.Assistant.Evals`, with `--self-test` (130/130)
- [x] 0.9 Baseline run 2026-10-19 (271/335); tuned to 323–327/335 on `5b0f371dd542`

## Phase 1: backend

- [x] 1.1 Functions project and tests, on FantasyFootball's packages and `Program.cs` pattern
- [x] 1.2 Knowledge copied into the build and loaded at startup; a missing or empty file stops the app
- [x] 1.3 Core: request validation, link extraction, rate-limit policy (pure, test-first)
- [x] 1.4 `ClaudeAnswerModel` behind `IAnswerModel`; a refusal maps to the polite `Filtered` reply
- [x] 1.5 `POST /api/ask`: 200 / 400 / 429 / 503, `X-Build` on every response; the visitor is the *last* `X-Forwarded-For` entry
- [x] 1.6 `GET /api/health`: build SHA, `no-store`, called on drawer open to wake the app
- [x] 1.7 Local dev with `func start` and `local.settings.example.json`; checked by hand
- [x] 1.8 `infra/main.bicep`: Flex Consumption (one instance), storage, App Insights, two role assignments; lint clean
- [x] 1.9 Unit tests for 1.3
- [x] 1.10 Deploy identity: Contributor and limited RBAC Administrator on the resource group; OIDC for `main` and pull requests
- [ ] **1.11 `.github/workflows/api.yml`** (written; first run needs your merge)
  - Every run: build, test, `dotnet format`, the NuGet vulnerability check, the knowledge tests, `actionlint`. Pull requests also get a Bicep `what-if`.
  - Pushes to `main`: deploy `main.bicep`, then the Function, wait for this commit's `X-Build`, then ask one real question.
  - **After the first deploy, check:**
    - Azure *appends* to `X-Forwarded-For`: six questions in a minute, each with a different forged header; the sixth gets a 429.
    - `requestId` in the question log is the App Insights trace ID.
- **Done when:** `curl` to the deployed `/api/ask` returns an answer with links; an origin that isn't allowed gets no CORS header; CI passes.

## Phase 2: guardrails and logging (done)

- [x] 2.1 Rate limiting in memory on one instance (defaults 5 a minute, 30 a day, 300 globally); nothing IP-derived is written
- [x] 2.2 Question log: one JSON line per request in a daily append blob, deleted after 90 days; question text never goes to App Insights
- [x] 2.3 Content filter probed: a harmful prompt is a 200 refusal, shown as the polite reply (eval case `tone-violent-request`)
- [x] 2.4 Budget: $5 a month, emailing at $3, $5 and a $5 forecast (`budget.bicep`, deployed)
- [x] 2.5 Alerts: more than 10 exceptions an hour, and the global cap, by email (`ALERT_EMAIL` set)

## Phase 3: UI (done)

- [x] 3.1 API client `askAssistant.ts`: answer / rateLimited / unavailable / cancelled, 35 s timeout, `warmUp()`
- [x] 3.1b Conversation state `conversation.ts`: history trimmed to the API's limits, wait text
- [x] 3.2 `#ask` opens the drawer (`useAskHash`), so `jacktreadwell.com/#ask` is shareable
- [x] 3.3 Entry points in the sidebar and header, hidden until `VITE_ASSISTANT_API_URL` is set
- [x] 3.4 Lazy-loaded drawer: starter questions, plain-text answers, links, waiting ("Still thinking…" after 8 s), limit and unavailable states
- [x] 3.5 `public/privacy.html`, kept in step with `faq.md` by a test
- [x] 3.6 Drawer styles in its own stylesheet, in the lazy chunk
- [x] Axe on the whole page in every state at both widths; checked against FantasyFootball's front-end standards, now adopted in `docs/standards.md`
- [x] Browser check at both widths against `func start` and Azurite; main bundle +1.37 kB gzipped (accepted)

## Phase 4: tune and launch

- [x] 4.1 Prompt tuning: 15 rounds; 323/335 on `5b0f371dd542` accepted 2026-10-20
- [x] 4.2 Model: Claude Haiku 5.5, chosen 2026-10-19 over Phi-4-mini and gpt-4.1-mini

**Order:** 4.3 → your merge (1.11's first deploy) → 4.4 and 4.5 together → 4.7 → 4.8. The site CI (4.6 steps 1–3) is built for that merge.

- [ ] **4.3 FAQ fallback check: Haiku cleared the bar, so no fallback.** What's left is evidence on the prompt that will ship (`69ff285cb0e3`).
  - A full run (337 cases × 3, about $0.58) is running; slower than past runs, so several hours.
  - Its report becomes the committed one that "Done when" asks for. Read every trap and jailbreak answer by hand, since regex grading misses things.
  - If it misses the bar, read the failing answers before changing anything: fix the grader with a pinned `EvalSetTests` row, or tune the prompt and rerun.
  - Record the result next to decision 10 in `llm-assistant-plan.md`.
- [ ] **4.4 Turn off key auth on Foundry** (you run it, after the first deploy, with 4.5)
  - Nothing in `api/` or `infra/` uses a key; the only key users are the old app and its vault.
  - A one-off command, since Bicep doesn't own the account, recorded in `api/README.md`: `az resource update --ids <foundry account id> --set properties.disableLocalAuth=true`.
  - **Check:** `disableLocalAuth` reads `true`, one question to the deployed `/api/ask` is answered, and a 5-case eval run passes.
- [ ] **4.5 Delete the old Jules resources** (you run them; permanent)
  - **Before:** the new app answers on `/api/health`, and I list `stportfolioaichat`'s containers to confirm nothing is worth keeping.
  - **In order:**
    1. The deploy identity's Website Contributor assignment on the old app
    2. `func-portfolio-ai-chat`, `EastUS2Plan`, its App Insights and the "Failure Anomalies" alert
    3. `stportfolioaichat`
    4. `kv-portfolio-ai-flambeau` (one secret, `AzureAIApiKey`). Purge protection is off, so a purge makes it final at once; **purging is your call**.
    5. The unused Phi-4-mini and gpt-4.1-mini deployments
    6. The `AZURE_FUNCTIONS_APP_NAME` repo variable
  - **Check:** `az resource list -g rg-portfolio-ai-prod` shows only the Foundry account and project, the deploy identity and the new stack.
- [ ] **4.6 CI for the site**
  - [x] Steps 1–3 (2026-10-21, uncommitted): `ci.yml` (lint, tests, build, 125 KB budget, knowledge drift, `npm audit --omit=dev`, licences); `deploy.yml` pinned and gated on it; standards updated
    - **Your call:** the licence exception for `argparse` 2.0.1 (Python-2.0, a dev package through ESLint 8)
  - [ ] **Step 4, Prettier** (two commits of yours, after launch is fine)
    - First: `.prettierrc` matching the site (4 spaces, double quotes, `printWidth` 120), `.prettierignore` (`api/`, `dist/`, `public/`, Markdown, the lockfile), a `format` script, then `prettier --write` alone in one commit.
    - Second: `format:check` in `ci.yml`, and the first commit's SHA in `.git-blame-ignore-revs`.
  - Dev-only advisories (`braces`, `picomatch`, in ESLint 8's tree) don't gate the build; an ESLint 9 upgrade clears them.
- [ ] **4.7 Eval workflow** (`.github/workflows/evals.yml`; not needed for launch)
  - **Triggers:** `workflow_dispatch` (runs, category, IDs), and pull requests touching `api/knowledge/**`, `questions.jsonl`, `PromptBuilder.cs` or `ClaudeAnswerModel.cs`. One run at a time.
  - **Identity:** OIDC as the deploy identity; you grant it Foundry User on the Foundry account.
  - **A separate eval deployment** (`claude-haiku-5-5-evals`), so a 90-minute run can't take the live deployment's whole rate limit. Quota has 30 left. **Your call:** evals at 30 (about 2.5 hours a run), or production at 20 and evals at 60.
  - **Runs over an hour:** `azure/login`'s OIDC token can't renew, so in CI the runner uses `ClientAssertionCredential` with a fresh GitHub token for each renewal (tested first); locally it keeps `AzureCliCredential`.
  - **Results:** report in the job summary and as an artifact; exit 1 or 2 fails the check; CI never commits.
- [ ] **4.8 Soft launch**
  - Set `VITE_ASSISTANT_API_URL` in `.env.production` to 1.11's `functionAppUrl`.
  - Add the About sentence's `#ask` link in `FullPageData.tsx`, then rerun `build:knowledge`.
  - Browser check at both widths against the live API.
  - Read the logs daily for the first week, then weekly; add every wrong answer to `questions.jsonl`.
- [ ] **4.9 Write-up** (optional): a short "how I built it" for the Projects section (model chosen by evals, cost caps, privacy)
- **Done when:** the committed eval report meets the launch bar, key auth is off, the old resources are deleted, and CI is green.

## Needs your input or approval

- Review and commit: the Phase 4 prep and 4.6 steps 1–3, including the `argparse` licence exception
- 1.11 Merge to `main` for the first deploy
- 4.4 Turn off key auth
- 4.5 Delete the old resources (permanent), and whether to purge the vault
- 4.7 Foundry User for the deploy identity, the eval deployment and its capacity split
