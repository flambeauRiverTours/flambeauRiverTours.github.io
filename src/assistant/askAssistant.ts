/**
 * Calls the assistant API (api/src/Portfolio.Assistant.Functions): POST /api/ask and GET /api/health.
 * Every failure becomes a result the drawer can show, so nothing here throws.
 */

import { assistantApiUrl } from "./assistantApiUrl";

//the server may take 30 s with its retry, plus a cold start
const defaultTimeoutMs = 35_000;

export interface AssistantLink {
    id: string; //a page anchor, without the #
    label: string; //e.g. "Experience › Senior Software Engineer"
}

export interface HistoryMessage {
    role: "user" | "assistant";
    content: string;
}

export type AskResult =
    | { kind: "answer"; answer: string; links: AssistantLink[] }
    | { kind: "rateLimited"; retryAfterSeconds: number }
    | { kind: "unavailable" }
    | { kind: "cancelled" }; //the visitor closed the drawer before the answer came

export interface ApiOptions {
    apiUrl?: string;
    fetch?: typeof fetch; //replaced in tests
}

export interface AskOptions extends ApiOptions {
    signal?: AbortSignal; //aborted when the visitor closes the drawer
    timeoutMs?: number;
}

/**
 * Never rejects: a timeout, network error or failed status comes back as `unavailable`, after 35 s at most
 * @param history Earlier messages, oldest first, already trimmed to the API's limits (see conversation.ts)
 */
export async function ask(question: string, history: HistoryMessage[], options: AskOptions = {}): Promise<AskResult> {
    const { apiUrl = assistantApiUrl, fetch: send = fetch, signal, timeoutMs = defaultTimeoutMs } = options;
    //one controller ends the request on either the timeout or the visitor leaving
    const request = new AbortController();
    const timer = setTimeout(() => request.abort(), timeoutMs);
    signal?.addEventListener("abort", () => request.abort(), { once: true });
    try {
        const response = await send(`${apiUrl}/api/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, history }),
            signal: request.signal,
        });
        return await readResult(response);
    } catch {
        return signal?.aborted ? { kind: "cancelled" } : { kind: "unavailable" };
    } finally {
        clearTimeout(timer);
    }
}

/** Wakes the API while the visitor types, hiding most of a cold start. Never throws */
export function warmUp(options: ApiOptions = {}): void {
    const { apiUrl = assistantApiUrl, fetch: send = fetch } = options;
    send(`${apiUrl}/api/health`, { cache: "no-store" }).catch(() => {});
}

async function readResult(response: Response): Promise<AskResult> {
    const body = await response.json().catch(() => null);
    if (response.ok && typeof body?.answer === "string" && Array.isArray(body.links)) {
        return { kind: "answer", answer: body.answer, links: body.links };
    }
    if (response.status === 429) {
        const retryAfterSeconds = typeof body?.retryAfterSeconds === "number" ? body.retryAfterSeconds : Number(response.headers.get("Retry-After"));
        return { kind: "rateLimited", retryAfterSeconds };
    }
    if (response.status === 400) {
        //the drawer checks everything the API does, so this is a bug in the drawer, not the visitor's fault
        console.error(`The assistant API rejected the request: ${body?.detail}`);
    }
    return { kind: "unavailable" };
}
