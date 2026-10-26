# Site refresh: leftovers

- [ ] Check the reduced-motion CSS with the setting actually turned on (couldn't be emulated in the browser check)
- To update the resume: replace `public/Jack-Treadwell-Resume.pdf`, keeping the file name

---

# LLM assistant: implementation tasks

Design, risks and decisions: `tasks/llm-assistant-plan.md`. Eval history: `tasks/model-evaluation.md`. Done items are one line each; the detail is in git history.

## Done

- [x] Phase 0: knowledge, anchors, `build:knowledge`, FAQ, system prompt, eval set and runner, baseline
- [x] Phase 1: Functions app, core, `ClaudeAnswerModel`, `/api/ask` and `/api/health`, Bicep, deploy identity, `api.yml`
- [x] Phase 2: rate limiting, question log, content filter, budget, alerts
- [x] Phase 3: API client, conversation state, `#ask`, entry points, drawer, privacy page, axe
- [x] 4.1 Prompt tuning (323/335 on `5b0f371dd542`) · 4.2 Model: Claude Haiku 5.5
- [x] 4.3 Launch evidence accepted 2026-10-21: tuned 95% judged; held-out 80% clean on `291848d5a587` (the later 94% is tuned); judge agrees on 33/41, recall about 53%
- [x] 4.6 steps 1–3: `ci.yml` gates `deploy.yml`
- [x] 4.8 Soft launch: `.env.production` set, About `#ask` link, regression check on `3479c80c4da0`
- [x] 4.9 Write-up: `public/assistant-write-up.html` and the `projects-assistant` entry
- [x] PR #17 review fixes · drawer scrolling and focus fixes (PR #28)
- [x] 4.5 Old Jules resources deleted (2026-10-21): app, plan, App Insights, alert, storage, Phi-4-mini and gpt-4.1-mini, the role assignment and repo variable; the vault is soft-deleted until 2027-01-19, unpurged
- [x] 4.4 Foundry key auth off (2026-10-21): live `/api/ask` answers, 5/5 eval cases pass (`reruns/…-key-auth-off.md`)
- [x] `main` ruleset: pull request and the `site` check required; `ci.yml`'s path filter removed so the check always reports
- [x] Repo cleanup (2026-10-21, uncommitted): `.vs/` and `api/local.settings.json` untracked, `gh-pages` and `homepage` removed, misspelled files renamed, terse README

## Open

- [ ] **Daily summary email** (built 2026-10-26, uncommitted; decision 12 in the plan). Tests first; how it works and every command are in `api/README.md`, "The daily summary email".
  - **Your steps, once, before the deploy that includes it:** register `Microsoft.Communication`; deploy `infra/email-sender-role.bicep`; add its role ID to the deploy identity's role-assignment condition
  - **After that deploy:** `disableLocalAuth` reads `true` on `acs-jtassistant`; a manual run sends yesterday's summary and a second sends nothing; the first 06:00 email arrives (mark not-spam once if needed). A 403 means the custom role isn't enough: decide on the built-in role deliberately
  - **Watch for** the `InvalidLinkedDomains` error on the first deploy (`what-if` was clean); if it appears, link the domain in a second pass
- [ ] **1.11 post-deploy checks:** six questions in a minute with forged `X-Forwarded-For` headers, the sixth gets a 429; `requestId` is the App Insights trace ID; `rate-limits/` has today's count; `cacheReadTokens` on a second question within 5 minutes
- [ ] **4.8 browser check** at both widths on `jacktreadwell.com` (CORS allows only the live origins), including the drawer's smooth scroll and a real phone keyboard
- [ ] Read the question log daily for the first week, then weekly; add every wrong answer to `questions.jsonl`
- [ ] **On 1 November, set the budget back to $5:** `az deployment group create --resource-group rg-portfolio-ai-prod --template-file infra/budget.bicep --parameters alertEmail=<your email> startDate=2026-10-01 amount=5`
- [ ] **4.3 follow-ups (your call):** review the five held-out cases the drafter was unsure of (`ho-jb-translate-claim`, `ho-jb-summarise-note`, `ho-jb-claims-to-be-jack`, `ho-jb-fake-kb-patch`, `ho-jb-json-clearance`); a fresh blind held-out batch (20–30 cases, about $0.25) for an honest score
- [ ] **Grade evals through `LinkExtractor`:** keep the raw-format checks; score content and links on what visitors see; rerun the full set
- [ ] **4.6 step 4, Prettier** (two commits): `.prettierrc` (4 spaces, double quotes, `printWidth` 120), `.prettierignore`, `format` script, `prettier --write` alone; then `format:check` in `ci.yml` and the SHA in `.git-blame-ignore-revs`. An ESLint 9 upgrade clears the dev-only advisories.
- [ ] **4.7 Eval workflow** (`evals.yml`, not needed for launch): `workflow_dispatch` and PRs touching knowledge, `questions.jsonl`, `PromptBuilder.cs` or `ClaudeAnswerModel.cs`; OIDC with Foundry User (you grant it); a separate `claude-haiku-5-5-evals` deployment (your call on the capacity split); `ClientAssertionCredential` for runs over an hour; PRs run the tuned set unjudged plus held-out judged, full judged runs on demand only
- [ ] Dependabot PRs (#24–#27, #29)
