import { describe, expect, it } from "vitest";
import { announcementFor, conversationReducer, historyFor, maxMessageLength, Turn, waitText } from "./conversation";

const spie = { id: "experience-spie", label: "Experience › SPIE" };

function answered(question: string, answer: string): Turn {
    return { question, state: "answered", answer, links: [] };
}

describe("conversationReducer", () => {
    it("adds a waiting turn when the visitor asks", () => {
        expect(conversationReducer([], { type: "asked", question: "Where?" })).toEqual([{ question: "Where?", state: "waiting" }]);
    });

    it("fills the waiting turn with the answer", () => {
        const turns = conversationReducer([{ question: "Where?", state: "waiting" }], { type: "replied", result: { kind: "answer", answer: "SPIE.", links: [spie] } });

        expect(turns).toEqual([{ question: "Where?", state: "answered", answer: "SPIE.", links: [spie] }]);
    });

    it.each([
        [{ kind: "rateLimited", retryAfterSeconds: 40 } as const, { question: "Where?", state: "rateLimited", retryAfterSeconds: 40 }],
        [{ kind: "unavailable" } as const, { question: "Where?", state: "unavailable" }],
    ])("records a failure on the waiting turn", (result, turn) => {
        expect(conversationReducer([{ question: "Where?", state: "waiting" }], { type: "replied", result })).toEqual([turn]);
    });

    it("ignores a reply when no question is waiting", () => {
        const turns = [answered("Hi?", "Hello.")];

        expect(conversationReducer(turns, { type: "replied", result: { kind: "unavailable" } })).toBe(turns);
        expect(conversationReducer([], { type: "replied", result: { kind: "unavailable" } })).toEqual([]);
    });

    it("drops the waiting turn when the visitor cancels it", () => {
        const earlier = answered("Hi?", "Hello.");

        expect(conversationReducer([earlier, { question: "Where?", state: "waiting" }], { type: "replied", result: { kind: "cancelled" } })).toEqual([earlier]);
    });
});

describe("historyFor", () => {
    it("sends answered turns as question and answer messages, oldest first", () => {
        expect(historyFor([answered("Hi?", "Hello."), { question: "Down?", state: "unavailable" }, answered("Where?", "SPIE.")])).toEqual([
            { role: "user", content: "Hi?" },
            { role: "assistant", content: "Hello." },
            { role: "user", content: "Where?" },
            { role: "assistant", content: "SPIE." },
        ]);
    });

    it("keeps only the last four answered turns", () => {
        const turns = [1, 2, 3, 4, 5].map((n) => answered(`Q${n}?`, `A${n}.`));

        expect(historyFor(turns).filter((message) => message.role === "user").map((message) => message.content)).toEqual(["Q2?", "Q3?", "Q4?", "Q5?"]);
    });

    it("cuts long answers to the API's message limit", () => {
        const history = historyFor([answered("Tell me everything?", "x".repeat(2_000))]);

        expect(history[1]?.content).toHaveLength(maxMessageLength);
    });
});

//a screen reader hears each reply once, not the visitor's own question or the waiting text
describe("announcementFor", () => {
    it.each<[string, Turn[], string]>([
        ["nothing before the first question", [], ""],
        ["nothing while waiting", [answered("Q?", "Old answer."), { question: "Next?", state: "waiting" }], ""],
        ["the latest answer", [answered("Q?", "Old answer."), answered("Next?", "New answer.")], "New answer."],
        ["the wait when rate limited", [{ question: "Q?", state: "rateLimited", retryAfterSeconds: 120 }], "You've reached the question limit for now. Try again in 2 minutes."],
        ["the outage", [{ question: "Q?", state: "unavailable" }], "The assistant is unavailable right now."],
    ])("announces %s", (_, turns, announcement) => {
        expect(announcementFor(turns)).toBe(announcement);
    });
});

describe("waitText", () => {
    it.each([
        [1, "in a minute"],
        [60, "in a minute"],
        [61, "in 2 minutes"],
        [55 * 60, "in 55 minutes"],
        [60 * 60, "in about 1 hour"],
        [10 * 60 * 60 + 100, "in about 10 hours"],
    ])("turns %i seconds into %s", (seconds, text) => {
        expect(waitText(seconds)).toBe(text);
    });
});
