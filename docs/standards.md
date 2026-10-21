# Engineering standards: the assistant API (`api/`, `infra/`)

Adopted from the FantasyFootballWebsite repository's `docs/standards.md` (sections 1, 4, 5, 6 and 7), adapted from Sleeper and the league to Foundry and the assistant. Rules that only applied there are left out. The Bicep rules also follow Microsoft's [Bicep best practices](https://learn.microsoft.com/azure/azure-resource-manager/bicep/best-practices). The front end has no standards document yet.

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
- The Function runs on one instance and the rate limiter counts in its memory
  - why: with no store, no outage can lift the cost cap, and no IP-derived data is ever written

## Logging

- Question and answer text is logged only to the 90-day blob, never to App Insights
- IP addresses are never logged, hashed or not

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

## Comments

- Every TODO names the task that resolves it
- Internal APIs carry XML doc summaries too
  - The compiler checks public members (CS1591); tests are exempt, their names document them
- A doc comment adds what the signature does not say
  - No `<param>` that restates a name or type
  - History belongs in `tasks/`, not in remarks
- Documentation is terse and declarative
  - Summaries aim for one short line

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
- The Azure resources around the model stay under fifty cents a month
  - why: a hobby site should never produce a real bill; the model itself is about fifty cents more
- A budget alert covers the resource group (task 2.4)
- New resources state their monthly cost up front, in a comment beside them
- A daily telemetry cap stays inside the free grant

**Observability**
- An exception in the Function App raises an alert (task 2.5)
  - why: a failure otherwise waits for someone to look

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
  - The site's npm packages get the same check in its own CI (task 4.6)
- Never pipe large output into an early-exit reader such as `grep -q` or `head`
  - why: `pipefail` turns the early exit into a false failure
