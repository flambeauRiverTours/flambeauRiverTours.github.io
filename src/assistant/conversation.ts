/**
 * The drawer's conversation: one turn per question, kept only in memory.
 */
import { AskResult, AssistantLink, HistoryMessage } from "./askAssistant";

//the API's limits (AskRequestValidator.cs); a test keeps them in step
export const maxQuestionLength = 500;
export const maxHistoryTurns = 4;
export const maxMessageLength = 1_500;

export type Turn =
    | { question: string; state: "waiting" }
    | { question: string; state: "answered"; answer: string; links: AssistantLink[] }
    | { question: string; state: "rateLimited"; retryAfterSeconds: number }
    | { question: string; state: "unavailable" };

export type ConversationAction =
    | { type: "asked"; question: string }
    | { type: "replied"; result: AskResult }; //for the last turn, which is waiting

export function conversationReducer(turns: Turn[], action: ConversationAction): Turn[] {
    if (action.type === "asked") {
        return [...turns, { question: action.question, state: "waiting" }];
    }

    const last = turns[turns.length - 1];
    if (last?.state !== "waiting") return turns; //nothing to reply to
    const earlier = turns.slice(0, -1);
    const question = last.question;
    const result = action.result;
    switch (result.kind) {
        case "answer": return [...earlier, { question, state: "answered", answer: result.answer, links: result.links }];
        case "rateLimited": return [...earlier, { question, state: "rateLimited", retryAfterSeconds: result.retryAfterSeconds }];
        case "unavailable": return [...earlier, { question, state: "unavailable" }];
        case "cancelled": return earlier;
    }
}

/** The earlier answered turns the API may see with the next question, within its limits */
export function historyFor(turns: Turn[]): HistoryMessage[] {
    return turns
        .flatMap((turn) => turn.state === "answered" ? [turn] : [])
        .slice(-maxHistoryTurns)
        .flatMap((turn): HistoryMessage[] => [
            { role: "user", content: turn.question },
            //an answer can run past the API's limit; the start is the part a follow-up refers to
            { role: "assistant", content: turn.answer.slice(0, maxMessageLength) },
        ]);
}

/** What a screen reader hears for the latest reply: once per turn, never the visitor's own question or the waiting text */
export function announcementFor(turns: Turn[]): string {
    const last = turns[turns.length - 1];
    switch (last?.state) {
        case "answered": return last.answer;
        case "rateLimited": return `You've reached the question limit for now. Try again ${waitText(last.retryAfterSeconds)}.`;
        case "unavailable": return "The assistant is unavailable right now.";
        default: return "";
    }
}

/**
 * When a rate-limited visitor may ask again, e.g. "in 5 minutes"
 * @param retryAfterSeconds From the API's 429; the daily limits reset at midnight UTC, hours away
 */
export function waitText(retryAfterSeconds: number): string {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    if (minutes <= 1) return "in a minute";
    if (minutes < 60) return `in ${minutes} minutes`;
    const hours = Math.round(retryAfterSeconds / 3600);
    return `in about ${hours} ${hours === 1 ? "hour" : "hours"}`;
}
