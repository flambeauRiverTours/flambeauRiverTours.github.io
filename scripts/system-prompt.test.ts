import { describe, expect, it } from "vitest";
import systemPrompt from "../api/knowledge/system-prompt.md?raw";
import linksText from "../api/knowledge/links.json?raw";
import faqText from "../api/knowledge/faq.md?raw";

//the model invented link IDs from the FAQ's headings ("job-search") until the prompt named every valid ID and the headings that have none
describe("api/knowledge/system-prompt.md", () => {
    it("lists exactly the link IDs in links.json", () => {
        const ids = (JSON.parse(linksText) as { id: string }[]).map((link) => link.id).join(", ");
        expect(systemPrompt).toContain(`The only link IDs are: ${ids}.`);
    });

    it("names the FAQ headings as having no link ID", () => {
        const headings = [...faqText.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim()).join(", ");
        expect(systemPrompt).toContain(`The FAQ headings (${headings}) have no ID`);
    });
});
