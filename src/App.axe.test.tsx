// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import App from "./App";
import { stubJsdomGaps } from "./testing/stubJsdomGaps";
import { capturedResponses, CapturedResponse, replay } from "./testing/capturedResponses";

//the page as it will be after the launch, with its entry points
vi.mock("./assistant/assistantApiUrl", () => ({ assistantApiUrl: "https://api.test" }));

const starter = "What is Jack working on at SPIE?";

//the whole page, drawer included (it renders outside the app's root), so anything added later is checked too
async function violations() {
    const results = await axe.run(document.body, {
        //both need layout, which jsdom doesn't have
        rules: { "color-contrast": { enabled: false }, "target-size": { enabled: false } },
    });
    return results.violations.map((violation) => `${violation.id}: ${violation.nodes.length} node(s)`);
}

function serveApi(captured: CapturedResponse) {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => replay(captured));
}

//opens the page at #ask, as a shared link does, and waits for the lazily loaded drawer
async function openAssistant(width: number) {
    window.innerWidth = width;
    window.history.replaceState(null, "", "/#ask");
    render(<App />);
    await screen.findByRole("textbox", { name: "Your question" });
}

describe.each([["a wide screen", 1280], ["a phone", 375]])("The page on %s", (_, width) => {
    beforeAll(() => {
        stubJsdomGaps();
        //the section highlighting watches the page, which jsdom can't lay out
        window.IntersectionObserver = class {
            observe() {}
            disconnect() {}
        } as unknown as typeof IntersectionObserver;
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        window.history.replaceState(null, "", "/");
    });

    it("has no axe violations with the drawer closed", async () => {
        window.innerWidth = width;
        render(<App />);

        expect(screen.getAllByRole("link", { name: "Ask a question" }).length).toBeGreaterThan(0);
        expect(await violations()).toEqual([]);
    });

    //only phones have the menu
    it.runIf(width < 1000)("has no axe violations with the section menu open", async () => {
        window.innerWidth = width;
        render(<App />);

        await userEvent.click(screen.getByRole("button", { name: "Open section menu" }));

        await screen.findByRole("dialog", { name: "Jack Treadwell" });
        expect(await violations()).toEqual([]);
    });

    it("has no axe violations with the drawer open and empty", async () => {
        serveApi(capturedResponses.answer);
        await openAssistant(width);

        expect(await violations()).toEqual([]);
    });

    it("has no axe violations while waiting for an answer", async () => {
        vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise<Response>(() => {}));
        await openAssistant(width);

        await userEvent.click(screen.getByRole("button", { name: starter }));

        expect(screen.getByText("Thinking…")).toBeTruthy();
        expect(await violations()).toEqual([]);
    });

    it.each([
        ["an answer and its link", capturedResponses.answer, /migrating a VB6 application/],
        ["the rate limit", capturedResponses.rateLimited, /question limit for now/],
        ["the assistant unavailable", capturedResponses.unavailable, /unavailable right now/],
    ])("has no axe violations showing %s", async (_state, captured, shown) => {
        serveApi(captured);
        await openAssistant(width);

        await userEvent.click(screen.getByRole("button", { name: starter }));

        //within the drawer: the page's own Experience section has some of the same words; and on screen, not the
        //screen-reader announcement that repeats the latest reply
        const drawer = screen.getByRole("dialog", { name: "Ask about Jack's experience" });
        await waitFor(() => expect(within(drawer).getByText(shown, { ignore: ".visually-hidden" })).toBeTruthy());
        expect(await violations()).toEqual([]);
    });
});
