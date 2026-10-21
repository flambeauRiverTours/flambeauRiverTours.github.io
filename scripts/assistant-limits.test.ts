import { describe, expect, it } from "vitest";
import validator from "../api/src/Portfolio.Assistant.Core/AskRequestValidator.cs?raw";
import { maxHistoryTurns, maxMessageLength, maxQuestionLength } from "../src/assistant/conversation";

//the drawer must never send what the API rejects, or the visitor sees "unavailable" for a drawer bug
describe("the drawer's limits", () => {
    it("match the API's validator", () => {
        const constant = (name: string) => Number(validator.match(new RegExp(`${name} = ([\\d_]+);`))?.[1]?.replace("_", ""));

        expect([maxQuestionLength, maxHistoryTurns, maxMessageLength]).toEqual([constant("MaxQuestionLength"), constant("MaxHistoryTurns"), constant("MaxMessageLength")]);
    });
});
