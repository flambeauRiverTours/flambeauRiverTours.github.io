# Lessons

- **Never let a run overwrite a report.** A 3-case rerun once replaced the full baseline, unrecoverably (2026-10-20). The runner now picks an unused file name; keep it that way.
- **Edit C#, regex and other escape-heavy files with the Edit tool, never `sed` or heredocs, even temporarily.** Escapes got eaten, CRLF became LF, and a show-it-failing `sed` rewrote an unrelated line (2026-10-21). Run `dotnet format --verify-no-changes` after.
- **Pass Windows paths to awk through `ENVIRON`, not `-v`, and back up a doc before a scripted rewrite.** `-v` mangled a path, and the rewrite deleted Phase 2's tasks (2026-10-21).
- **Every jsdom test file calls `cleanup()` in `afterEach`.** Vitest's globals are off, so Testing Library doesn't unmount between tests on its own.
- **A UI step isn't done until the browser shows it: read the console and look at both widths.** Invalid HTML and a dark-on-dark page showed up only there. Pin each finding with a test where one can catch it.
- **Run `npm test`, `npm run lint` and `npm run build` after any edit to `src/`, however small.** An editor-reformatted JSX line in `1e5886c` broke the build and reached review (2026-10-21). `ci.yml` now gates the deploy.
- **Read the actual answers before blaming the model.** Correct answers failed on case patterns ("doesn't say Jack was fired"). Pin every false positive as an `EvalSetTests` row before fixing it.
- **Prompt rules can backfire.** Rerun the targeted cases plus a full run before keeping a rule, and revert rules that don't help.
