# Engineering standards

Adopted from the FantasyFootballWebsite repository's `docs/standards.md`, adapted from Sleeper and the league to Foundry, the assistant and this site. Rules that only applied there are left out. The Bicep rules also follow Microsoft's [Bicep best practices](https://learn.microsoft.com/azure/azure-resource-manager/bicep/best-practices).

- The assistant API (`api/`, `infra/`): sections 1, 4, 5, 6 and 7 of the original, adopted 2026-10-21
- The site (`src/`, `scripts/`, `public/`): section 2, adopted 2026-10-21, under [Front end](#front-end-src-scripts-public) below

## Build

- Warnings are build errors
  - why: a nullable or style problem fails the build, not a review
- Code style analysers run in the build (`EnforceCodeStyleInBuild`)
  - why: style drift fails CI instead of code review
- `dotnet format --verify-no-changes` passes
- `.cs` files are CRLF with a BOM; `.gitattributes` makes Linux checkouts match
  - why: without it the Linux runner checks out LF and every file fails `ENDOFLINE`
- Every `!` operator has a comment explaining why

## Architecture

- Functional core with an imperative shell
  - why: prompt assembly, grading and rate-limit maths test offline in milliseconds
- `Portfolio.Assistant.Core` stays pure
  - No file or network access
  - No Azure or HTTP types
  - No clock or randomness
  - No logging
- Project references point inward only
  - Hosts (`Functions`, `Evals`) reference `Core`
  - Core references nothing in the solution
- Foundry SDK types never leave the Foundry client
  - why: the model or SDK can change without touching Core
- Types are `internal` unless they form a project seam
  - why: a small public surface keeps refactors local
- Each project registers its own services via extension methods

## Types and values

- Data types are immutable records
- Signatures use `IReadOnlyList` and `IReadOnlyDictionary`
  - Including public static collections
- Money is `decimal`, never `double`
  - why: prices and costs are compared and summed to the cent
- Time comes from an injected `TimeProvider`
  - why: tests control the clock across the daily key and rate-limit windows

## Naming

- Private fields use `camelCase` with no underscore prefix
  - why: matches the primary constructor parameters used throughout
- One concept per file named after its main type
  - Companions may share it: its null implementation or its enum
- Cancellation tokens are named `cancellationToken`
  - Lambda parameters are named `token`

## Errors

- Options are validated at startup with `ValidateOnStart`
  - why: a bad setting fails the deploy, not a visitor
- Only transient failures may fall back or be retried
  - why: a silent fallback once hid a bug for days (FantasyFootball)
  - Authentication, configuration and programming errors stop the work
- A failed model call, whatever the cause, is a 503 for the visitor and an error in the log
  - why: it isn't a fallback (nothing is retried or made up), and a sign-in failure first showed up as an unexpected type
- Logging failures never fail a visitor's request
- The Function runs on one instance; visitors are counted in its memory, and the global daily count is stored
  - why: no IP-derived data is ever written, and a restart or scale-to-zero can't reopen the cost cap
  - Without the stored count, a question is refused (503), never sent uncounted
- A client the visitor closed is a 499 with no exception
  - why: closing the drawer isn't a failure, and the exceptions alert would count it

## Logging

- Question and answer text is logged only to the 90-day blob, never to App Insights
  - Only requests that reached the model are written to the blob; turned-away ones are App Insights requests with their status code
  - why: they carry no question, and a flood of them would fill the day's append blob (50,000 blocks)
- IP addresses are never logged, hashed or not
- A warning an alert searches for has its text in a constant, which the test and the alert's query both name

## Accepted exceptions

- Tests may use `!` without a comment
  - why: a wrong null fails the test that relies on it
- Test files may hold small test doubles next to the tests that use them
- A console host's top-level `Program.cs` is the imperative shell
  - It reads files and the clock directly, and stays short

## Testing

- Test names are sentences about behaviour
  - why: a failing name states the broken behaviour
- Tests come first, and are seen failing before the code exists
  - A regression test is shown failing without its fix
  - why: a test that never failed proves nothing
- Real data over invented data
  - The eval set and knowledge files are tested as they are, not copied into fixtures
- Storage code is tested against Azurite, not a mocked SDK
  - Skipped locally when Azurite isn't running; CI starts it and fails without it

## Comments

- Every TODO names the task that resolves it
- Internal APIs carry XML doc summaries too
  - The compiler checks public members (CS1591); tests are exempt, their names document them
- A doc comment adds what the signature does not say
  - No `<param>` that restates a name or type
  - History belongs in `tasks/`, not in remarks
- Documentation is terse and declarative
  - Summaries aim for one short line

## Front end (`src/`, `scripts/`, `public/`)

**TypeScript**
- `strict` and `noUncheckedIndexedAccess` are on, and `npm run build` type-checks before it bundles
  - why: a lookup by index or key can be undefined, and the deploy builds the site
- Every `!` assertion has a comment explaining why
  - Tests may use `!` without a comment
- Prettier formats every file (task 4.6)
  - why: style is settled by a tool, not review
  - Until then, new code matches its file: 4 spaces and double quotes in `src/`

**React**
- Anything a visitor might share is a link: the page's sections and `#ask` are hashes
  - why: every view becomes a shareable link
- Controls that can't work yet are hidden, not disabled
  - why: a control that does nothing reads as broken
  - The assistant's entry points stay hidden until `VITE_ASSISTANT_API_URL` is set (the soft launch, task 4.8)
- Model text is rendered as plain text, never as HTML
  - why: an answer is untrusted input

**Data**
- All assistant requests go through `src/assistant/askAssistant.ts`
  - why: one place owns the API origin, the timeout and the mapping of failures
- Logic lives in pure modules, not components
  - `conversation.ts` holds the history trimming and wait text
  - why: pure functions test without rendering anything
- The drawer's limits match the API's validator, checked by a test
  - why: a request the API rejects shows the visitor "unavailable" for a drawer bug

**Styling**
- `App.scss` holds the theme and Bootstrap; each component may have its own stylesheet beside it
  - The site predates the original's "one stylesheet" rule
- **Exception:** the drawer has its own stylesheet, using Bootstrap's CSS variables rather than its Sass (recorded 2026-10-21)
  - why: imported by the lazily loaded drawer, it ships in the drawer's chunk; importing the Sass would copy Bootstrap into it
- Every page sets its own background and text colours
  - why: a page that doesn't inherits the browser's dark scheme (the privacy page rendered dark-on-dark)
  - The site has no dark theme; when it gets one, it is designed, not inverted
- Layouts work from 375 pixels wide, with no horizontal scroll

**Accessibility**
- Axe checks the whole page in each state, at desktop and phone widths (`src/App.axe.test.tsx`)
  - why: the whole page, so a new panel or state is covered without a new test
  - Colour contrast and target size are left to the browser check: jsdom has no layout
- The reduced-motion preference turns motion off entirely (`App.scss`)
  - why: decorative motion has nothing worth keeping
- Each reply is announced once through a `role="status"` region, and the drawer focuses its input on opening and again after each reply
  - Except on a touch screen, where focusing would open the keyboard over the answer
- Only the drawer's conversation scrolls, so the input and the notice stay in view; it follows new turns only for a visitor already at the end, and becomes keyboard-focusable once it overflows

**Motion and performance**
- Motion is decorative and never carries information
  - The spinner always comes with "Thinking…"
- Initial JavaScript stays under 125 KB gzipped (65.8 KB on 2026-10-21; enforced by `ci.yml`)
  - why: a budget catches dependency bloat before it ships
- Features a visitor may never open load lazily, in their own chunk
  - The drawer and the API client load on first open
- A slow first answer is acknowledged
  - why: a cold start can take several seconds; after 8 s "Thinking…" becomes "Still thinking…"

**Testing**
- Component tests run in jsdom (`// @vitest-environment jsdom`) and call `cleanup()` after each test
  - why: Vitest's globals are off, so Testing Library doesn't unmount on its own
- The API boundary is tested against real captured responses (`src/testing/capturedResponses.ts`)
  - why: a real response catches a shape an invented one never will
  - Invented responses cover only what the API hasn't produced: non-JSON bodies, a 500, a network error
  - Recapture them when the API's responses change
- Checks that read files from both halves of the repo live in `scripts/` and read them with `?raw`
  - The limits against `AskRequestValidator.cs`, and the privacy note against `faq.md`
- The privacy note and the FAQ make the same promises, checked by a test
  - why: the assistant answers privacy questions from the FAQ, visitors read the note

**Dependencies**
- Licences come from FantasyFootball's allow list
  - Anything that ships: `MIT`, `MIT-0`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `0BSD`
  - Build and test tools also: `MPL-2.0`, `BlueOak-1.0.0`, `CC0-1.0`
  - `npm run check:licences` checks every package in the lockfile, in CI
  - Exceptions are pinned to an exact version, so an upgrade is checked again (`scripts/licences.ts`)
  - **Exception, by name:** `caniuse-lite` (CC-BY-4.0, browser-support data), dev only, through `eslint-plugin-react-hooks`' Babel. It's republished almost weekly, so a pinned version would fail most Dependabot updates (proposed 2026-10-26)
  - **Exception:** `@fontsource/*` packages may be OFL-1.1, the usual licence for fonts; nothing else may (2026-10-21)
- The page makes no requests to third parties; fonts are bundled, not loaded from Google
  - why: the privacy note promises no tracking, and a Google-hosted font sends every visitor's IP address to Google (checked by `scripts/privacy.test.ts`)
- A vulnerable production package fails the site's build (`npm audit --omit=dev`)
  - Dev advisories don't fail it: they never ship, and Dependabot raises them

## Infrastructure (`infra/`)

**Bicep**
- The template follows Microsoft's Bicep best practices
  - Parameters come first, each with a description; parameters that build names carry length limits
  - Defaults are safe and cheap for anyone to deploy
  - Symbolic names are lowerCamelCase and never end in `Name`
  - Dependencies come from symbolic references, not `dependsOn`, `resourceId` or `reference`
  - Child resources nest under their parent instead of building names from strings
  - Outputs and settings use resource properties, never URLs assembled by hand
  - Each resource uses a recent API version
- `az bicep lint` passes with no warnings
  - why: a warning left in becomes noise that hides the next real one
- Values computed at deploy time never set immutable properties
  - why: a monthly budget date broke every deploy in October (FantasyFootball); budgets live in a separate file deployed by hand
- Resources the template doesn't own are found with `existing`, named by a parameter with no default
  - why: the repository is public and names are identifiers

**Identity and secrets**
- Everything reaches Azure by managed identity; no keys or connection strings with secrets exist
  - Storage has shared keys turned off
  - Foundry's key auth is turned off before launch (task 4.4)
- The Function's identity gets the fewest roles that work, each scoped to one resource
- CI reaches Azure through OIDC with no stored credentials

**Cost**
- The Azure resources around the model stay under about a dollar a month
  - why: a hobby site should never produce a real bill; the model itself is about fifty cents more
  - Storage and hosting are a few cents; the two alerts are about 60 cents (accepted 2026-10-21)
- A budget covers the resource group, alerting at $3 and $5 spent and a forecast over $5 (`budget.bicep`)
- Evals are the biggest cost, so the dear ones run on demand (agreed 2026-10-21)
  - why: October's eval runs alone reached the $5 budget; the grounding judge (Sonnet 5.5) is about $0.003 a call
  - Pull requests: the tuned set unjudged and the held-out set judged, about $0.60 together
  - Both sets fully judged (about $3.50): only by hand, for launch and big prompt or model changes
- New resources state their monthly cost up front, in a comment beside them
- A daily telemetry cap stays inside the free grant

**Observability**
- Failures and the global cap raise email alerts
  - why: a failure otherwise waits for someone to look
  - More than 10 exceptions in an hour, above what one deploy's smoke retries produce
  - The global daily cap turning visitors away, at most one email a day
- Log alerts run every 15 minutes, the cheapest frequency
  - why: $0.50 a month, against $1.50 at 5 minutes; a cap reached for the rest of the day doesn't need faster news
- **Accepted gap:** when the workspace's daily ingestion cap (0.16 GB) is reached, both alerts go quiet until it resets (2026-10-21)
  - why: another alert would cost about $0.50 a month, and the stored global count and the budget still bound the spend while they're quiet

## CI/CD (`.github/workflows/`)

- A Bicep `what-if` runs on every pull request
  - why: infrastructure changes get reviewed as a diff
- `actionlint` checks every workflow on every pull request
- Deploys run infrastructure, then the Function
- A deploy is never cancelled midway
  - why: a half-applied deploy is worse than a queue
- The post-deploy check verifies the build this run made, by the API's `X-Build` commit
  - why: the live app may still serve the previous build
- Actions are pinned to commit SHAs and every installed tool to a version
- Dependabot watches NuGet, npm and every action pin, weekly
  - FluentAssertions stays on 7.x: 8.x is under a non-commercial licence
- A vulnerable NuGet package, direct or transitive, fails the API build
  - Deprecated packages are reported without failing it: a deprecation is a migration to plan, not a defect
  - The site's production npm packages get the same check in `ci.yml`
- The site deploys only after `ci.yml` passes: `deploy.yml` calls it
  - why: a commit that doesn't build once reached review (2026-10-21)
- `main` changes only through a pull request whose `site` check passes (the `main` ruleset); so `ci.yml` has no path filter
- `api/knowledge` matches what `npm run build:knowledge` writes from the page, checked in `ci.yml`
  - why: the assistant would otherwise answer from an older page
- Never pipe large output into an early-exit reader such as `grep -q` or `head`
  - why: `pipefail` turns the early exit into a false failure
