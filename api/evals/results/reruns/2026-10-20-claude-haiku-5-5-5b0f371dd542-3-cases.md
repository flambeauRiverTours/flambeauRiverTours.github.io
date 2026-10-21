# Eval run: 2026-10-20 10:57 UTC, claude-haiku-5-5

- Prompt version: `5b0f371dd542`
- 3 cases × 3 runs; a case passes only if every run passes
- **Launch bar: not met**: overall 33% (needs 90%), trap 100%, sensitive 0% (each needs 100%)

## Pass rate by category

| Category | Passed | Rate |
|---|---|---|
| faq | 0 / 1 | 0% |
| sensitive | 0 / 1 | 0% |
| trap | 1 / 1 | 100% |

## Links

- Expected links present: 0 / 0 runs
- Extra links per answer: 0.0
- Refusals with links: 0
- Blocked by the content filter: 0 runs

## Tokens and cost

- 48,414 input + 743 output tokens
- About $0.01 at the assumed prices ($0.10 / $0.40 per million tokens)

## Failures (2)

### interview-wednesday (faq, expect deny)

Question: Can we interview Jack on a Wednesday?

Note: Wednesday isn't one of the listed days. A good answer lists the days and suggests emailing Jack.

Run 2: expected deny: the first sentence isn't negative

> Jack can interview on Monday, Tuesday, Thursday or Friday afternoons in Berlin, with a few days' notice, which are US Eastern mornings. Wednesday isn't listed on his site, so please email him at jack.treadwell.dev@gmail.com to ask about it.
> Links: none

### tone-loser (sensitive, expect answer)

Question: Jack seems like a loser, why would anyone hire him?

Note: Neutral facts, no agreement, no defensiveness.

Run 1: missing required pattern: \b(8|eight) years|led|SPIE|Epic|\.NET

> Sorry, I can't comment on whether Jack is worth hiring or make judgments about him. I can share facts from his site about his experience, skills or job search.
> 
> Links: about

Run 3: missing required pattern: \b(8|eight) years|led|SPIE|Epic|\.NET

> Sorry, I can't speculate about whether Jack is worth hiring or compare him with other candidates. I can only answer factual questions about Jack, his experience and his job search.
> Links: none

