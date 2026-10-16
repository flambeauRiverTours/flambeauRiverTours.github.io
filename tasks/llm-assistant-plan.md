# Plan: "Ask about my experience" assistant (draft, updated 2026-10-16)

Brings the LLM idea from the `jules/modernize-portfolio-website-*` branch onto the current site, keeping the idea and rebuilding the parts that don't hold up.

**Platform: Microsoft Foundry**, already set up:

| | |
|---|---|
| Resource | `proj-portfolio-slm-resource` (AIServices) in `rg-portfolio-ai-prod`, East US 2 |
| Deployment | `Phi-4-mini-instruct-portfolio-chatbot` (Phi-4-mini-instruct v1), GlobalStandard, capacity 1 |
| Endpoint | `https://proj-portfolio-slm-resource.services.ai.azure.com/models/chat/completions` |
| Auth | Entra ID **confirmed working** (token call returned 200 on 2026-10-16). Keys are also still enabled |

The backend doesn't depend on any one model, so switching to another Foundry model is a config change. The eval set in Phase 0 decides whether Phi-4-mini is good enough to launch with.

## 1. What to keep from the Jules branch, and what not to

| Jules branch piece | Verdict | Why |
|---|---|---|
| Server-side proxy so no key reaches the browser | **Keep the idea** | Correct and necessary |
| Foundry as the model platform (Jules used Phi-3-mini serverless) | **Keep** | Already set up with Phi-4-mini. Billing, quotas and content filters stay in Azure |
| `api/chat/index.ts` (Node Function) | **Rewrite in C#** | Your FantasyFootball repo already has a .NET isolated Function on Flex Consumption with Bicep, CORS and a budget alert, so copy that. It also fits the ".NET engineer" story better than a Node Function |
| System prompt facts | **Discard** | Invented: AWS SA, CKAD, CSM, "Former team lead". The model would repeat them to recruiters |
| `aiContext.ts` keyword "fallback" | **Discard** | It presents canned keyword answers as "AI Career Intelligence". When the API is down, say so and link to email and the resume |
| `SearchHeroLander` (AI search as the hero) | **Discard** | Pushes your actual content below the fold. The assistant should be secondary |
| Claims in `AI_ASSISTANT_DESIGN.md` | **Don't trust** | It promises IP rate limiting and streaming, but the code has no rate limiting and `CORS: *`. Node Functions also need streaming explicitly turned on, so as written it would likely buffer the whole response |
| `aiStreamService.ts` (with the line-buffer fix, in `git stash`) | **Optional reuse** | Only if v1 streams |
| `func-portfolio-ai-chat.azurewebsites.net` | **Check** | It resolves and returns 404. If it's in your subscription, delete it or reuse its name |

## 2. Architecture

```
Browser (GitHub Pages, jacktreadwell.com)
  └─ POST https://<func>.azurewebsites.net/api/ask   { question, history (≤ 4 turns) }
       Azure Function (.NET isolated, Flex Consumption), copied from FantasyFootball/infra
         1. CORS: only https://jacktreadwell.com (+ localhost in dev)
         2. Validate: question ≤ 500 chars, history ≤ 4 turns
         3. Rate limit: per hashed IP (e.g. 5/min, 30/day) + global daily cap (e.g. 300/day), counters in Table Storage
            IP hash = HMAC(daily key, ip), daily key = HMAC(secret, UTC date); counter rows deleted after a day
         4. Model call through IAnswerModel → Foundry deployment (Phi-4-mini to start)
            system = rules + knowledge file (with link IDs), temperature ~0.2, max_tokens ~400
         5. Check the link IDs the model cited against the known list; drop any that don't exist
         6. Log question, answer, links, model and timing to Blob Storage (see "Logging")
         7. Return { answer, links: [{ id, label }] }   (non-streaming in v1)
       Auth to Foundry: the Function's managed identity with the "Foundry User" role on the resource.
       No key stored anywhere. Deploy with the existing AZURE_* OIDC secrets.
```

**Grounding: one source of truth.** A build script (`npm run build:knowledge`) renders the site's content (`FullPageData.tsx`) to plain text in `api/knowledge/site.md`. A hand-written `api/knowledge/faq.md` covers what recruiters ask that the site doesn't say: work authorization, start date, remote/hybrid, relocation, and "salary → ask Jack directly". CI fails if `site.md` is stale, so the assistant can't drift from the page. The whole knowledge file is about 4k tokens, so it goes in every request. Retrieval or a vector store isn't needed.

**Links to the site.** Every answer ends with links to where the details are on the page, e.g. "See: Experience › Epic Systems".
- **Site change:** today only the five sections have anchors (`#about`, `#experience`, `#projects`, `#reading`, `#travel`). Add an optional `id` to `IBodyTextSection` for each entry (e.g. `experience-epic`, `projects-fantasy-football`), render it on the entry's element, and give entries the same `scroll-margin-top` as sections so the phone header bar doesn't cover them. These anchors also make entries linkable from anywhere, not just the assistant.
- **Knowledge file:** `build:knowledge` writes each section and entry with its ID and label, e.g. `## [experience-epic] Software Developer Team Lead, Epic Systems`. It also writes `api/knowledge/links.json` (ID → label) for the Function.
- **Model output:** the prompt asks the model to end with one line, `Links: experience-epic, about`. The Function parses that line, removes it from the answer, keeps only IDs that exist in `links.json` (at most 3), and returns them with their labels. If the model cites none, the answer goes out without links rather than with guessed ones. Foundry's JSON output mode is an alternative if Phi-4-mini handles it reliably; the plain line is easier for a small model.
- **UI:** links render as buttons under the answer. Clicking one scrolls to the anchor; on phones it closes the drawer first, the same way the header menu does today.
- **Evals:** each eval question lists the expected link IDs, so link quality is measured along with the answer.

**Model call.** One small interface, `IAnswerModel.AnswerAsync(question, history)`, with the Foundry implementation behind it. The deployment name and endpoint come from app settings, so trying another model means a new deployment plus a settings change, with no code change. Use `IChatClient` from Microsoft.Extensions.AI underneath if its Foundry adapter fits; otherwise call the Foundry SDK directly. Check Microsoft's current recommended .NET client for Foundry Models in Phase 1, because it has changed over time.

**Deployment capacity.** The deployment's capacity is 1, confirmed as **1 request and 1,000 tokens a minute**. That's less than one assistant request (~4.5k tokens), so every real request would be throttled. Raise it to 20 (20 requests and 20k tokens a minute). It's also the hard cost ceiling, so keep it no higher than that.

**Phi-4-mini: what to expect.** It's cheap and fast, and the knowledge file fits its context window easily. The risk is the one that matters most here: small models are more likely than large ones to fill gaps with plausible inventions and to follow jailbreak prompts. (In the auth test, asked to "Reply with the single word: ok", it started "Sure, I'm here to", a small hint of loose instruction following.) The prompt does extra work to compensate:
- Short, strict rules: answer only from the knowledge text; otherwise say "I don't know, ask Jack" and give the email link.
- Low temperature and short answers (2–4 sentences).
- A few example answers in the prompt, including one "I don't know" case and the `Links:` line format.

**Model choice: small and mid-size models only.** Large models are out of scope because of their monthly cost. A candidate qualifies only if its projected cost at 1,000 questions a month is **≤ $3**: about $0.50 per million input tokens at most, since input is most of the cost. Within that limit, the trap-question pass rate decides. If Phi-4-mini fails traps that prompt changes can't fix, deploy one or two qualifying candidates in the same Foundry resource and re-run the evals. Candidates (check current versions, prices and East US 2 availability in Foundry first):
- a larger Phi model
- a "mini"-class GPT model
- a small Claude model (Haiku-class), if Foundry offers it in your region. It uses a different SDK, `Anthropic.Foundry`, so it needs its own `IAnswerModel` implementation

If no qualifying model meets the launch bar, ship the FAQ instead (task 4.3) rather than moving up to a large model.

**Cost of choosing a model (estimate).** One eval run = 30 questions × 3 runs = 90 calls ≈ 450k input + 15k output tokens. Prices are assumed tiers, not quotes; check Foundry's pricing page for the real figures.

| Model tier (assumed price in / out per MTok) | Per eval run | Runs planned | Selection cost | Production, 1k questions/month |
|---|---|---|---|---|
| Small, e.g. Phi-4-mini (~$0.10 / $0.40) | ≈ $0.05 | 10–15 (tuning) | ≈ $0.50–0.75 | ≈ $0.50 |
| Mid-size (~$0.50 / $2) | ≈ $0.25 | 3–5 | ≈ $0.75–1.25 | ≈ $2.50 |

The whole selection process costs roughly **$1–2** in model fees. Large models (~$13/month at this volume) are out of scope. Your time is the real cost: each tuning round means reading the failures, about 15–30 minutes.

**Worst case.** If bots hit the global cap (300 questions a day) every day, that's about 45M input tokens a month: ≈ $5 on Phi-4-mini, ≈ $23 on a mid-size model. If a mid-size model is chosen, lower the global cap to about 100 a day (worst case ≈ $8) and keep the budget alert.

**Launch bar (agreed):** 100% of trap, privacy, jailbreak and sensitive cases pass (no invented facts, no private details, no broken rules, no political stances or unprofessional replies) and ≥ 90% of all cases pass. If no model clearly does better than the hand-written FAQ on the eval set, ship the FAQ as a plain page section instead.

**Logging (agreed: questions and answers).** Logs show what recruiters actually ask and catch wrong answers the evals missed.
- **What:** timestamp, question, answer, links, model/deployment, latency, token counts, and whether a limit was hit. Nothing derived from the IP address: abuse shows up in the rate-limit counters, which are deleted after a day.
- **Where:** one JSON-lines blob per day in a private container in the Function's storage account, in the same US region as the Function and Foundry resource. EU storage isn't needed: storage location isn't what GDPR requires (transfers to Microsoft in the US are allowed), and the site targets US employers.
- **Retention:** a Blob lifecycle rule in Bicep deletes logs after 90 days automatically, with no cleanup code.
- **Review:** a weekly skim, plus adding any bad answers as new eval questions.
- **Disclosure:** a line in the drawer ("Questions and answers are stored for 90 days to improve this assistant. Don't include personal information.") and a short privacy note linked from it, naming Microsoft Foundry as the processor.

**IP addresses (rate limiting only).**
- IP addresses are never stored. The rate limiter keys its counters on `HMAC(dailyKey, ip)`, where `dailyKey = HMAC(secret, UTC date)` and the secret exists only in the Function's settings.
- The same visitor gets a different hash each day, so hashes can't be linked across days.
- The date alone is not used as the salt: it isn't secret, and the ~4.3B IPv4 addresses can be brute-forced in minutes.
- A daily timer deletes counter rows older than yesterday, so IP-derived data lives at most about 48 hours.
- This is pseudonymous, not anonymous, while the secret exists, so the privacy note doesn't use the word "anonymous".

## 3. UI placement

Principle: the site works for a recruiter who never touches the assistant. The assistant is for the specific question the page doesn't answer quickly.

- **Not** the hero, and **not** a floating chat bubble. A bubble covers content on phones and reads like a support widget.
- **Entry points:**
  1. **Sidebar:** an "Ask a question" button under the section links (styled as an action, not a section).
  2. **Phone header bar:** a small chat icon next to the menu button.
  3. **About section:** the contact sentence gets "…or ask my assistant a quick question."
- **Panel:** a right-side slide-out drawer (React Bootstrap `Offcanvas`, already used for the phone menu), so the page stays visible.
  - Three starter questions written for recruiters, e.g. "What Azure experience does Jack have?", "What did he lead at Epic?", "When can he start in Charlotte?"
  - Each answer ends with links to the relevant sections and entries (see "Links to the site").
  - Under the input: "AI-generated from this site. It can be wrong, so check the resume." Plus "Prefer a human? Email me." and the logging notice.
  - On error or limit: "The assistant is unavailable right now", with email and resume links. No fake answers.
- **Performance:** load the drawer code only when it's first opened, so the main page isn't affected.

## 4. Phases and effort

| Phase | Work | Effort |
|---|---|---|
| 0. Knowledge + evals (do first) | Entry anchors on the site; `build:knowledge` script with IDs and `links.json`; `faq.md`; ~30 eval questions with expected facts and expected links, including traps ("Is Jack Kubernetes-certified?" → no) and jailbreak attempts. Small runner that sends them to any Foundry deployment and reports pass/fail. First run against Phi-4-mini | 1 day |
| 1. Backend | C# Function `/api/ask` with `IAnswerModel` + Foundry implementation, link parsing and checking, managed identity with the Foundry User role, Bicep copied from FantasyFootball (Flex Consumption, storage, CORS, budget), OIDC deploy job | 1 day |
| 2. Guardrails + logging | Hashed-IP (daily key) + global daily limits in Table Storage, daily cleanup of counter rows, input caps, deployment capacity set to ~20k tokens/minute, Foundry content filters checked and on, budget alert, blob logging with the 90-day lifecycle rule | 1 day |
| 3. UI | Drawer, entry points, link buttons, loading/error states, logging notice, keyboard/screen-reader checks, phone layout | 1 day |
| 4. Tune + launch | Tune the prompt against the evals. If Phi-4-mini still fails traps, deploy and evaluate one or two mid-size models (≤ $3/month). Privacy note, turn off key auth on the Foundry resource, soft launch | 0.5–1 day |
| **Total** | | **≈ 4.5–5 days (32–40 h)** |
| Optional | Streaming answers (needs streaming set up on the Function plus a client stream reader) | +0.5 day |

The existing Foundry setup saves some backend work. Entry anchors, link checking and logging add about half a day. Phi-4-mini will likely need more prompt tuning than a larger model, and possibly a second model to evaluate. Running costs: the model (under $1 a month for Phi-4-mini at this volume, at most $3 for a mid-size model), plus Functions and Storage, likely within free allowances. The Jules estimate of 14–21 hours skipped rate limiting, evals, logging and the knowledge pipeline.

## 5. Risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| **Wrong answers about you** (invented certifications or numbers, as the Jules prompt already did) | **Medium–high with Phi-4-mini** / **high**, because it's your reputation with hiring managers | Answer only from the knowledge file and say "I don't know, ask Jack" otherwise; strict prompt with examples, low temperature; eval set with trap questions in CI; agreed launch bar; switch to a mid-size model (≤ $3/month) if traps fail, or ship the FAQ if none passes; visible disclaimer; weekly log review |
| **Wrong or broken links** | Medium / low | Only IDs that exist in `links.json` are returned; expected links in the evals; CI fails if an anchor in `links.json` doesn't exist on the page |
| **Cost from bots or abuse** | Medium / low–medium | Global daily cap (hard stop), per-IP limits, `max_tokens`, input length cap, deployment tokens-per-minute as a hard ceiling. Azure budget alerts only notify, they don't stop spending |
| **Prompt injection or embarrassing output** that gets screenshotted | Medium / medium (small models are easier to jailbreak) | No tools and no secrets in the prompt, so the worst case is words. Foundry content filters on (the test response showed no filter results, so confirm in Phase 2 which filter applies to this deployment), topic restriction, jailbreak cases in evals |
| **Privacy** (GDPR may apply while you live in Berlin, until January 2027; US state privacy laws are unlikely to apply to a personal site this size) | Low / low–medium. You're storing questions people type, and GlobalStandard may process prompts in any Azure region | Everything stays in US regions. Keep the cheap habits: 90-day automatic deletion, no IPs or IP hashes in the logs, rate-limit hashes rotated daily and deleted after a day, notice in the drawer and a short privacy note naming Microsoft as processor, "don't include personal information". These cover the GDPR basics while you're in Berlin and are good practice afterwards |
| **Content drift** (site updated, assistant still answers from the old version) | High without automation / medium | Knowledge file and link list generated from site content, plus a CI staleness check |
| **Cold starts** (Flex Consumption, a few seconds) | High / low | "Thinking…" state. Avoid always-ready instances, which cost money |
| **Nobody uses it** | Medium / low | The logs show usage directly. If nobody uses it after about 3 months, remove it. It still works as a portfolio project with a write-up, like Fantasy Football |
| **Maintenance** (model retirements, SDK changes) | Certain over time / low | Deployment name in config, model behind `IAnswerModel`, eval set re-run on any model or prompt change, Dependabot on the API project |

## 6. Decisions

**Made:**
1. Platform: Microsoft Foundry, starting with Phi-4-mini (GlobalStandard)
2. Auth: Entra ID / managed identity (confirmed working); turn off key auth before launch
3. Log question and answer text, 90-day retention, with a notice in the drawer
4. Launch bar: 100% of trap, privacy, jailbreak and sensitive cases, ≥ 90% overall
5. Answers link to the relevant sections and entries of the site
6. Plain request/response in v1, no streaming. Revisit if logged response times are regularly above ~3 s
7. Deployment capacity: confirmed at 1 (1 request and 1,000 tokens a minute); raise to 20 (task 0.1 in `tasks/todo.md`)
8. Large models are out of scope: a candidate's projected cost must be ≤ $3/month at 1k questions; if none passes, ship the FAQ
9. Replace the Jules Function app (`func-portfolio-ai-chat`, Windows Consumption) with a new Flex Consumption app from Bicep, then delete the old resources

The build order with technical details is in `tasks/todo.md` ("LLM assistant: implementation tasks").
