import { describe, expect, it } from "vitest";
import systemPrompt from "../api/knowledge/system-prompt.md?raw";
import siteText from "../api/knowledge/site.md?raw";
import faqText from "../api/knowledge/faq.md?raw";

//the agreed "below about 3,500 tokens" ceiling was set in Phi-4-mini tokens (about 15,700 characters); this is the same
//ceiling in Claude Haiku 5.5 tokens, which keeps cost from creeping up
const maxPromptTokens = 5550;

//measured on claude-haiku-5-5 (2026-10-20): 15,154 characters of prompt came to about 5,360 input tokens per call
//(26,915 over 5 calls of a one-line question with no history)
const charactersPerToken = 2.83;

describe("the assembled prompt", () => {
    it(`stays under ${maxPromptTokens} tokens`, () => {
        const characters = systemPrompt.trim().length + siteText.trim().length + faqText.trim().length + "\n\n<knowledge>\n\n\n\n</knowledge>\n".length;
        expect(Math.round(characters / charactersPerToken)).toBeLessThanOrEqual(maxPromptTokens);
    });
});
