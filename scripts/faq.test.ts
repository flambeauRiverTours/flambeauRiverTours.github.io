import { afterEach, describe, expect, it, vi } from "vitest";
import faqText from "../api/knowledge/faq.md?raw";

//answers that stop being true on a known date, so the assistant doesn't keep telling recruiters Jack is in Berlin
const timeBoundAnswers = [
    { text: "Until January 2027", staleFrom: "2027-01-01" },
    { text: "is based in Berlin, Germany now", staleFrom: "2027-02-01" },
];

function staleAnswers(faq: string): string[] {
    return timeBoundAnswers.filter((answer) => new Date() >= new Date(answer.staleFrom) && faq.includes(answer.text)).map((answer) => `"${answer.text}" (stale from ${answer.staleFrom}): update api/knowledge/faq.md`);
}

describe("api/knowledge/faq.md", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("has no time-bound answers past their date", () => {
        expect(staleAnswers(faqText)).toEqual([]);
    });

    it("would flag the Berlin interview-hours answer once January 2027 arrives", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2027-01-02"));
        expect(staleAnswers("Until January 2027, Jack is in Berlin")).toHaveLength(1);
    });

    it("has a section about the assistant itself, so it can answer honestly about storage and AI", () => {
        expect(faqText).toMatch(/## About this assistant/);
        expect(faqText).toMatch(/stored for 90 days/);
        expect(faqText).toMatch(/IP addresses aren't stored/);
    });
});
