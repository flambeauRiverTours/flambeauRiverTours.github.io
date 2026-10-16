# Engineering standards: C# and .NET (`api/`)

Adopted from the FantasyFootballWebsite repository's `docs/standards.md` (sections 1, 6 and 7), adapted from Sleeper and the league to Foundry and the assistant. Rules that only applied there are left out. The front end has no standards document yet.

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
- Logging failures never fail a visitor's request
- The rate limiter fails closed
  - why: a storage outage must not remove the cost cap

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
