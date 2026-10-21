import { describe, expect, it } from "vitest";
import heldOutText from "../api/evals/heldout.jsonl?raw";
import questionsText from "../api/evals/questions.jsonl?raw";
import linksText from "../api/knowledge/links.json?raw";
import siteText from "../api/knowledge/site.md?raw";
import faqText from "../api/knowledge/faq.md?raw";

const categories = ["fact", "faq", "multi_hop", "trap", "numbers", "privacy", "jailbreak", "off_topic", "opinion", "commitment", "multi_turn", "robustness", "meta", "links", "personal", "sensitive"];
const expectations = ["answer", "deny", "idk", "refuse", "decline"];
const allowedFields = ["id", "category", "question", "history", "expect", "mustMatch", "mustMatchOrLink", "mustNotMatch", "expectedLinks", "note", "passExample"];

interface IEvalCase {
    id: string;
    category: string;
    question: string;
    history?: { role: string; content: string }[];
    expect: string;
    mustMatch?: string[];
    mustMatchOrLink?: string[]; //linking any of these counts as meeting mustMatch
    mustNotMatch?: string[];
    expectedLinks?: string[];
    note?: string;
    passExample?: string; //a good answer; the C# EvalSetTests run it through the real grader
}

const parse = (text: string): IEvalCase[] => text.split("\n").filter((line) => line.trim()).map((line) => JSON.parse(line));
const tunedCases = parse(questionsText);
const heldOutCases = parse(heldOutText);
const linkIds = (JSON.parse(linksText) as { id: string }[]).map((link) => link.id);

//the held-out set is measured, never tuned on: it must stay apart from the tuned set
describe("api/evals/heldout.jsonl", () => {
    it("shares no ids or questions with the tuned set", () => {
        const tunedIds = new Set(tunedCases.map((evalCase) => evalCase.id));
        const tunedQuestions = new Set(tunedCases.map((evalCase) => evalCase.question.toLowerCase()));
        expect(heldOutCases.filter((evalCase) => tunedIds.has(evalCase.id) || tunedQuestions.has(evalCase.question.toLowerCase())).map((evalCase) => evalCase.id)).toEqual([]);
    });

    it("weights the high-risk categories", () => {
        const count = (category: string) => heldOutCases.filter((evalCase) => evalCase.category === category).length;
        expect(count("trap") + count("jailbreak")).toBeGreaterThanOrEqual(20);
    });
});

describe.each([["api/evals/questions.jsonl", tunedCases], ["api/evals/heldout.jsonl", heldOutCases]])("%s", (_, cases) => {
    it("has unique kebab-case ids", () => {
        const ids = cases.map((evalCase) => evalCase.id);
        expect(ids.filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))).toEqual([]);
        expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    });

    it("uses only known fields, categories and expectations", () => {
        const problems = cases.flatMap((evalCase) => [
            ...Object.keys(evalCase).filter((key) => !allowedFields.includes(key)).map((key) => `${evalCase.id}: unknown field ${key}`),
            ...(categories.includes(evalCase.category) ? [] : [`${evalCase.id}: unknown category ${evalCase.category}`]),
            ...(expectations.includes(evalCase.expect) ? [] : [`${evalCase.id}: unknown expect ${evalCase.expect}`]),
        ]);
        expect(problems).toEqual([]);
    });

    it("has questions the API would accept", () => {
        const tooLong = cases.filter((evalCase) => !evalCase.question.trim() || evalCase.question.length > 500).map((evalCase) => evalCase.id);
        expect(tooLong).toEqual([]);
    });

    it("has valid history: alternating user and assistant turns, at most 4", () => {
        const problems = cases.filter((evalCase) => evalCase.history).filter((evalCase) => {
            const history = evalCase.history!;
            return history.length > 8 || history.some((message, index) => message.role !== (index % 2 === 0 ? "user" : "assistant") || !message.content.trim());
        }).map((evalCase) => evalCase.id);
        expect(problems).toEqual([]);
    });

    it("has regexes that compile", () => {
        const broken = cases.flatMap((evalCase) => [...(evalCase.mustMatch ?? []), ...(evalCase.mustNotMatch ?? [])].filter((pattern) => {
            try {
                new RegExp(pattern, "i");
                return false;
            } catch {
                return true;
            }
        }).map((pattern) => `${evalCase.id}: ${pattern}`));
        expect(broken).toEqual([]);
    });

    it("only expects links that exist on the page", () => {
        const unknown = cases.flatMap((evalCase) => [...(evalCase.expectedLinks ?? []), ...(evalCase.mustMatchOrLink ?? [])].filter((id) => !linkIds.includes(id)).map((id) => `${evalCase.id}: ${id}`));
        expect(unknown).toEqual([]);
    });

    it("gives every answer and deny case something to check", () => {
        const unchecked = cases.filter((evalCase) => ["answer", "deny"].includes(evalCase.expect) && !evalCase.mustMatch?.length).map((evalCase) => evalCase.id);
        expect(unchecked).toEqual([]);
    });

    it("has a passExample for every case whose mustNotMatch could catch a correct denial", () => {
        const risky = cases.filter((evalCase) => ["jailbreak", "sensitive", "trap", "privacy"].includes(evalCase.category) && evalCase.mustNotMatch?.length);
        expect(risky.filter((evalCase) => !evalCase.passExample).map((evalCase) => evalCase.id)).toEqual([]);
    });

    it("only expects facts that are in the knowledge files", () => {
        const knowledge = siteText + "\n" + faqText;
        const factCategories = ["fact", "numbers", "faq", "personal", "multi_hop"];
        const missing = cases
            .filter((evalCase) => factCategories.includes(evalCase.category) && ["answer", "deny"].includes(evalCase.expect))
            .flatMap((evalCase) => (evalCase.mustMatch ?? []).filter((pattern) => !new RegExp(pattern, "i").test(knowledge)).map((pattern) => `${evalCase.id}: ${pattern}`));
        expect(missing).toEqual([]);
    });
});

//coverage is the tuned set's job; the held-out set is a sample
describe("api/evals/questions.jsonl coverage", () => {
    const cases = tunedCases;

    it("covers every category, with extra weight on the high-risk ones", () => {
        const count = (category: string) => cases.filter((evalCase) => evalCase.category === category).length;
        expect(categories.filter((category) => count(category) < 3)).toEqual([]);
        expect(count("trap")).toBeGreaterThanOrEqual(15);
        expect(count("jailbreak")).toBeGreaterThanOrEqual(10);
        expect(count("privacy")).toBeGreaterThanOrEqual(6);
        expect(count("sensitive")).toBeGreaterThanOrEqual(15);
        expect(cases.filter((evalCase) => evalCase.id.startsWith("inj-")).length).toBeGreaterThanOrEqual(8);
    });

    it("has at least one case for every page anchor", () => {
        const linked = new Set(cases.flatMap((evalCase) => evalCase.expectedLinks ?? []));
        expect(linkIds.filter((id) => !linked.has(id))).toEqual([]);
    });
});
