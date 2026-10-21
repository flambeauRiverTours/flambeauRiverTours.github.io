import { describe, expect, it } from "vitest";
import faqText from "../api/knowledge/faq.md?raw";
import indexHtml from "../index.html?raw";
import privacyHtml from "../public/privacy.html?raw";

//the assistant answers privacy questions from faq.md, and visitors read privacy.html: they must make the same promises
const promises = [
    ["how long questions are kept", "90 days"],
    ["when IP addresses are forgotten", "midnight UTC"],
    ["where to ask for deletion", "jack.treadwell.dev@gmail.com"],
    ["who hosts the model", "Microsoft Azure"],
    //Anthropic processes prompts and outputs even when Azure hosts the model (Microsoft's Claude data-privacy page)
    ["who processes the questions", "Anthropic"],
];

describe("the privacy note", () => {
    it.each([
        ["the legal basis", "legitimate interest"],
        ["the right to object", "object"],
        ["the right to complain", "supervisory authority"],
    ])("states %s", (_, wording) => {
        expect(privacyHtml).toContain(wording);
    });
});

//"no tracking" must be true: a font from Google sends every visitor's IP address to Google
describe.each([["index.html", indexHtml], ["privacy.html", privacyHtml]])("%s", (_, html) => {
    it("loads nothing from Google", () => {
        expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    });
});

describe("the privacy note and the assistant's FAQ", () => {
    it.each(promises)("both state %s", (_, promise) => {
        expect(faqText).toContain(promise);
        expect(privacyHtml).toContain(promise);
    });

    it("say IP addresses aren't stored", () => {
        expect(faqText).toContain("IP addresses aren't stored");
        expect(privacyHtml).toContain("IP addresses aren't stored");
    });
});
