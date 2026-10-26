// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import AssistantDrawer from "./AssistantDrawer";
import { AskOptions, AskResult, HistoryMessage } from "./askAssistant";
import { stubJsdomGaps, stubJsdomGapsMatching } from "../testing/stubJsdomGaps";

const spie = { id: "experience-spie", label: "Experience › Senior Software Engineer" };
const starter = "What is Jack working on at SPIE?";

//what's on screen, not the screen-reader announcement that repeats the latest reply
const shown = { ignore: ".visually-hidden" };

type FakeAsk = (question: string, history: HistoryMessage[], options?: AskOptions) => Promise<AskResult>;

function replying(result: AskResult) {
    return vi.fn<FakeAsk>(async () => result);
}

//an ask whose answer arrives only when the test says so, or is cancelled with the request
function pending() {
    let reply: (result: AskResult) => void = () => {};
    const ask = vi.fn<FakeAsk>((_question, _history, options) => new Promise<AskResult>((resolve) => {
        reply = resolve;
        options?.signal?.addEventListener("abort", () => resolve({ kind: "cancelled" }));
    }));
    return { ask, reply: (result: AskResult) => act(() => reply(result)) };
}

//the page's side: opens the drawer and closes it when asked, as App does
function Page({ ask, modal = false }: { ask: FakeAsk; modal?: boolean }) {
    const [show, setShow] = useState(true);
    return <>
        <button onClick={() => setShow(true)}>Reopen</button>
        <AssistantDrawer show={show} onHide={() => setShow(false)} modal={modal} ask={ask} warmUp={() => {}} />
    </>;
}

describe("AssistantDrawer", () => {
    beforeAll(stubJsdomGaps);

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        window.history.replaceState(null, "", "/");
    });

    it("sends a starter question and shows the answer with its links", async () => {
        const ask = replying({ kind: "answer", answer: "Jack is migrating a large .NET app.", links: [spie] });
        render(<Page ask={ask} />);

        await userEvent.click(screen.getByRole("button", { name: starter }));

        expect(ask).toHaveBeenCalledWith(starter, [], expect.objectContaining({ signal: expect.any(AbortSignal) }));
        expect(await screen.findByText("Jack is migrating a large .NET app.", shown)).toBeTruthy();
        expect(screen.getByRole("button", { name: "See: Experience › Senior Software Engineer" })).toBeTruthy();
    });

    it("sends a typed question with the earlier turns as history", async () => {
        const ask = replying({ kind: "answer", answer: "SPIE.", links: [] });
        render(<Page ask={ask} />);
        const input = screen.getByRole("textbox", { name: "Your question" });

        await userEvent.type(input, "Where does Jack work?{Enter}");
        await screen.findByText("SPIE.", shown);
        await userEvent.type(input, "Since when?{Enter}");

        expect(ask).toHaveBeenLastCalledWith("Since when?", [{ role: "user", content: "Where does Jack work?" }, { role: "assistant", content: "SPIE." }], expect.anything());
    });

    it("doesn't send a blank question", async () => {
        const ask = replying({ kind: "unavailable" });
        render(<Page ask={ask} />);

        await userEvent.type(screen.getByRole("textbox", { name: "Your question" }), "   {Enter}");

        expect(ask).not.toHaveBeenCalled();
    });

    it("shows answers as plain text, never as markup", async () => {
        render(<Page ask={replying({ kind: "answer", answer: "<b>Bold</b> claim", links: [] })} />);

        await userEvent.click(screen.getByRole("button", { name: starter }));

        expect(await screen.findByText("<b>Bold</b> claim", shown)).toBeTruthy();
    });

    it("announces each answer once through a status region, not the whole conversation", async () => {
        const { ask, reply } = pending();
        render(<Page ask={ask} />);
        const status = screen.getByRole("status");

        await userEvent.click(screen.getByRole("button", { name: starter }));
        expect(status.textContent).toBe("");

        await reply({ kind: "answer", answer: "Jack is migrating a large .NET app.", links: [spie] });
        expect(status.textContent).toBe("Jack is migrating a large .NET app.");
        expect(document.querySelector("[aria-live]")).toBeNull();
    });

    it("locks the input while waiting, then frees it", async () => {
        const { ask, reply } = pending();
        render(<Page ask={ask} />);
        const input = screen.getByRole("textbox", { name: "Your question" });

        await userEvent.click(screen.getByRole("button", { name: starter }));
        expect((input as HTMLInputElement).disabled).toBe(true);
        expect(screen.getByText("Thinking…")).toBeTruthy();

        reply({ kind: "answer", answer: "Done.", links: [] });
        await waitFor(() => expect((input as HTMLInputElement).disabled).toBe(false));
    });

    //the spinner first sat inside a <p>, which React warns is invalid HTML
    it("renders the waiting state without React warnings", async () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        render(<Page ask={pending().ask} />);

        await userEvent.click(screen.getByRole("button", { name: starter }));

        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it("says it is still thinking after 8 seconds", () => {
        vi.useFakeTimers();
        render(<Page ask={pending().ask} />);

        fireEvent.click(screen.getByRole("button", { name: starter }));
        act(() => vi.advanceTimersByTime(8_000));

        expect(screen.getByText("Still thinking…")).toBeTruthy();
    });

    it("tells a rate-limited visitor when to come back, and offers email instead", async () => {
        render(<Page ask={replying({ kind: "rateLimited", retryAfterSeconds: 300 })} />);

        await userEvent.click(screen.getByRole("button", { name: starter }));

        expect(await screen.findByText(/question limit for now\. Try again in 5 minutes/, shown)).toBeTruthy();
        expect(screen.getAllByRole("link", { name: /email/i }).length).toBeGreaterThan(0);
    });

    it("offers email and the resume when the assistant is unavailable", async () => {
        render(<Page ask={replying({ kind: "unavailable" })} />);

        await userEvent.click(screen.getByRole("button", { name: starter }));

        expect(await screen.findByText(/unavailable right now/, shown)).toBeTruthy();
        expect(screen.getByRole("link", { name: "the resume" }).getAttribute("href")).toBe("/Jack-Treadwell-Resume.pdf");
    });

    it("counts characters once a question nears the limit", async () => {
        render(<Page ask={replying({ kind: "unavailable" })} />);
        const input = screen.getByRole("textbox", { name: "Your question" });

        fireEvent.change(input, { target: { value: "x".repeat(399) } });
        expect(screen.queryByText("399 / 500")).toBeNull();
        fireEvent.change(input, { target: { value: "x".repeat(400) } });
        expect(screen.getByText("400 / 500")).toBeTruthy();
        expect(input.getAttribute("maxlength")).toBe("500");
    });

    it("cancels a waiting question when closed, and keeps it in the box", async () => {
        const { ask } = pending();
        render(<Page ask={ask} />);
        await userEvent.click(screen.getByRole("button", { name: starter }));

        await userEvent.click(screen.getByRole("button", { name: "Close" }));
        await userEvent.click(screen.getByRole("button", { name: "Reopen" }));

        const input = await screen.findByRole("textbox", { name: "Your question" }) as HTMLInputElement;
        await waitFor(() => expect(input.value).toBe(starter));
        expect(screen.queryByText("Thinking…")).toBeNull();
    });

    it("on a wide screen, jumps to a linked section and stays open", async () => {
        render(<Page ask={replying({ kind: "answer", answer: "SPIE.", links: [spie] })} />);
        await userEvent.click(screen.getByRole("button", { name: starter }));

        await userEvent.click(await screen.findByRole("button", { name: /^See:/ }));

        expect(window.location.hash).toBe("#experience-spie");
        expect(screen.getByRole("textbox", { name: "Your question" })).toBeTruthy();
    });

    it("on a phone, closes first and then jumps to the linked section", async () => {
        render(<Page ask={replying({ kind: "answer", answer: "SPIE.", links: [spie] })} modal />);
        await userEvent.click(screen.getByRole("button", { name: starter }));

        await userEvent.click(await screen.findByRole("button", { name: /^See:/ }));

        await waitFor(() => expect(window.location.hash).toBe("#experience-spie"));
        await waitFor(() => expect(screen.queryByRole("textbox", { name: "Your question" })).toBeNull());
    });

    it("always shows the AI notice and the privacy link", () => {
        render(<Page ask={replying({ kind: "unavailable" })} />);

        expect(screen.getByText(/AI-generated from this site/)).toBeTruthy();
        expect(screen.getByRole("link", { name: "Privacy" }).getAttribute("href")).toBe("/privacy.html");
    });
});

//the conversation scrolls on its own, so the input and the notice stay in view however long it gets
describe("AssistantDrawer's conversation", () => {
    beforeEach(stubJsdomGaps);

    afterEach(() => {
        cleanup();
        window.history.replaceState(null, "", "/");
    });

    //jsdom has no layout, so each test gives the scroll area the size it needs
    function conversationArea(scrollTop: number, overflowing = true) {
        const area = document.querySelector<HTMLElement>(".conversation")!;
        Object.defineProperty(area, "scrollHeight", { configurable: true, value: overflowing ? 1000 : 300 });
        Object.defineProperty(area, "clientHeight", { configurable: true, value: 400 });
        area.scrollTop = scrollTop;
        area.scrollTo = vi.fn() as unknown as typeof area.scrollTo;
        return area;
    }

    it("follows a new reply when the visitor is at the bottom", async () => {
        const { ask, reply } = pending();
        render(<Page ask={ask} />);
        const area = conversationArea(600);

        await userEvent.click(screen.getByRole("button", { name: starter }));
        await reply({ kind: "answer", answer: "Jack is migrating a large .NET app.", links: [] });

        expect(area.scrollTo).toHaveBeenLastCalledWith({ top: 1000, behavior: "smooth" });
    });

    it("leaves a visitor who scrolled up to reread where they are", async () => {
        const { ask, reply } = pending();
        render(<Page ask={ask} />);
        const area = conversationArea(600);
        await userEvent.click(screen.getByRole("button", { name: starter }));
        vi.mocked(area.scrollTo).mockClear();

        area.scrollTop = 100;
        fireEvent.scroll(area);
        await reply({ kind: "answer", answer: "Jack is migrating a large .NET app.", links: [] });

        expect(area.scrollTo).not.toHaveBeenCalled();
    });

    it("jumps instead of animating when the visitor prefers reduced motion", async () => {
        stubJsdomGapsMatching("(prefers-reduced-motion: reduce)");
        const { ask, reply } = pending();
        render(<Page ask={ask} />);
        const area = conversationArea(600);

        await userEvent.click(screen.getByRole("button", { name: starter }));
        await reply({ kind: "answer", answer: "Jack is migrating a large .NET app.", links: [] });

        expect(area.scrollTo).toHaveBeenLastCalledWith({ top: 1000, behavior: "auto" });
    });

    //a scrollable region a keyboard can't reach can't be scrolled without a mouse
    it("can be reached by keyboard once it overflows", async () => {
        const { ask, reply } = pending();
        render(<Page ask={ask} />);
        const area = conversationArea(600, false);
        expect(area.getAttribute("tabindex")).toBeNull();

        Object.defineProperty(area, "scrollHeight", { configurable: true, value: 1000 });
        await userEvent.click(screen.getByRole("button", { name: starter }));
        await reply({ kind: "answer", answer: "Jack is migrating a large .NET app.", links: [] });

        expect(area.getAttribute("tabindex")).toBe("0");
        expect(screen.getByRole("region", { name: "Conversation" })).toBe(area);
    });
});

//the input is disabled while waiting, which drops its focus; the next question shouldn't need a click
describe("AssistantDrawer's input after a reply", () => {
    beforeEach(stubJsdomGaps);

    afterEach(() => {
        cleanup();
        window.history.replaceState(null, "", "/");
    });

    it.each<[string, AskResult]>([
        ["an answer", { kind: "answer", answer: "Jack is migrating a large .NET app.", links: [] }],
        ["the rate limit", { kind: "rateLimited", retryAfterSeconds: 300 }],
        ["an outage", { kind: "unavailable" }],
    ])("takes focus back after %s", async (_, result) => {
        const { ask, reply } = pending();
        render(<Page ask={ask} />);

        await userEvent.click(screen.getByRole("button", { name: starter }));
        await reply(result);

        expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Your question" }));
    });

    //on a touch screen, focusing the input opens the keyboard over the answer the visitor is about to read
    it("leaves focus alone on a touch screen", async () => {
        stubJsdomGapsMatching("(pointer: coarse)");
        const { ask, reply } = pending();
        render(<Page ask={ask} />);

        await userEvent.click(screen.getByRole("button", { name: starter }));
        await reply({ kind: "answer", answer: "Jack is migrating a large .NET app.", links: [] });

        expect(document.activeElement).not.toBe(screen.getByRole("textbox", { name: "Your question" }));
    });

    it("doesn't take focus once the drawer has closed", async () => {
        const { ask } = pending();
        render(<Page ask={ask} />);

        await userEvent.click(screen.getByRole("button", { name: starter }));
        await userEvent.keyboard("{Escape}");

        expect(document.activeElement).not.toBe(screen.queryByRole("textbox", { name: "Your question", hidden: true }));
    });
});
