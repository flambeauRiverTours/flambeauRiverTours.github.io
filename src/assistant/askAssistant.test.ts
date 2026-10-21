import { describe, expect, it, vi } from "vitest";
import { ask, warmUp } from "./askAssistant";
import { capturedResponses, CapturedResponse, replay } from "../testing/capturedResponses";

const apiUrl = "https://api.test";

function serve(captured: CapturedResponse) {
    return vi.fn(async () => replay(captured));
}

//invented responses, only for what the API hasn't produced
function respond(status: number, body: unknown, headers: Record<string, string> = {}) {
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return vi.fn(async () => new Response(text, { status, headers }));
}

describe("ask", () => {
    it("posts the question and history and returns the answer with its links", async () => {
        const fetch = serve(capturedResponses.answer);
        const history = [{ role: "user" as const, content: "Hi?" }, { role: "assistant" as const, content: "Hello." }];

        const result = await ask("What is Jack working on at SPIE?", history, { apiUrl, fetch });

        expect(result).toMatchObject({ kind: "answer", answer: expect.stringContaining("migrating a VB6 application"), links: [{ id: "experience-spie", label: "Experience › Senior Software Engineer" }] });
        const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe("https://api.test/api/ask");
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body as string)).toEqual({ question: "What is Jack working on at SPIE?", history });
    });

    it("returns the wait from a 429", async () => {
        const result = await ask("Q?", [], { apiUrl, fetch: serve(capturedResponses.rateLimited) });

        expect(result).toEqual({ kind: "rateLimited", retryAfterSeconds: 56 });
    });

    it("falls back to the Retry-After header when a 429's body is unreadable", async () => {
        const result = await ask("Q?", [], { apiUrl, fetch: respond(429, "Too many", { "Retry-After": "40" }) });

        expect(result).toEqual({ kind: "rateLimited", retryAfterSeconds: 40 });
    });

    it.each([
        ["a 503", serve(capturedResponses.unavailable)],
        ["a 500", respond(500, "")],
        ["a 200 that isn't JSON", respond(200, "<html>")],
        ["a 200 without an answer", respond(200, { links: [] })],
        ["a network error", vi.fn(async () => { throw new TypeError("Failed to fetch"); })],
    ])("treats %s as unavailable", async (_, fetch) => {
        expect(await ask("Q?", [], { apiUrl, fetch })).toEqual({ kind: "unavailable" });
    });

    it("treats a 400 as unavailable and reports it, since the drawer never sends an invalid request", async () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});

        const result = await ask("Q?", [], { apiUrl, fetch: serve(capturedResponses.invalid) });

        expect(result).toEqual({ kind: "unavailable" });
        expect(error).toHaveBeenCalledWith(expect.stringContaining("question is required."));
        error.mockRestore();
    });

    it("gives up as unavailable when the API takes too long", async () => {
        const result = await ask("Q?", [], { apiUrl, fetch: hangingFetch(), timeoutMs: 10 });

        expect(result).toEqual({ kind: "unavailable" });
    });

    it("returns cancelled, not an error, when the visitor closes the drawer mid-question", async () => {
        const visitor = new AbortController();
        const pending = ask("Q?", [], { apiUrl, fetch: hangingFetch(), signal: visitor.signal });

        visitor.abort();

        expect(await pending).toEqual({ kind: "cancelled" });
    });

    it("sends nothing when the visitor has already left", async () => {
        const visitor = new AbortController();
        visitor.abort();
        const fetch = serve(capturedResponses.answer);

        expect(await ask("Q?", [], { apiUrl, fetch, signal: visitor.signal })).toEqual({ kind: "cancelled" });
        expect(fetch).not.toHaveBeenCalled();
    });

    it("stops listening to the visitor's signal once the request ends", async () => {
        const visitor = new AbortController();
        const added = vi.spyOn(visitor.signal, "addEventListener");
        const removed = vi.spyOn(visitor.signal, "removeEventListener");

        await ask("Q?", [], { apiUrl, fetch: serve(capturedResponses.answer), signal: visitor.signal });

        expect(removed).toHaveBeenCalledWith("abort", added.mock.calls[0]?.[1]);
    });
});

describe("warmUp", () => {
    it("wakes the API through its health endpoint", () => {
        const fetch = respond(200, { build: "abc" });

        warmUp({ apiUrl, fetch });

        expect(fetch).toHaveBeenCalledWith("https://api.test/api/health", expect.anything());
    });

    it("never throws, even when the API is down", async () => {
        const fetch = vi.fn(async () => { throw new TypeError("Failed to fetch"); });

        expect(() => warmUp({ apiUrl, fetch })).not.toThrow();
        await Promise.resolve();
    });
});

// a fetch that only ends when its request is aborted, as a slow API would
function hangingFetch() {
    return vi.fn((_: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
    }));
}
