import { describe, expect, it } from "vitest";
import faqText from "../api/knowledge/faq.md?raw";
import privacyHtml from "../public/privacy.html?raw";

//the assistant answers privacy questions from faq.md, and visitors read privacy.html: they must make the same promises
const promises = [
    ["how long questions are kept", "90 days"],
    ["when IP addresses are forgotten", "midnight UTC"],
    ["where to ask for deletion", "jack.treadwell.dev@gmail.com"],
    ["who runs the model", "Microsoft Azure"],
];

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
