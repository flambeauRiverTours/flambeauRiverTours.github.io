// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar/Sidebar";
import HeaderBar from "./Header/HeaderBar";
import { stubMatchMedia } from "../testing/stubMatchMedia";

describe("the assistant's entry points", () => {
    beforeAll(stubMatchMedia);
    afterEach(cleanup);

    it("show in the sidebar as a link to #ask once the assistant is launched", () => {
        render(<Sidebar sections={[]} activeId="" showAsk />);

        expect(screen.getByRole("link", { name: "Ask a question" }).getAttribute("href")).toBe("#ask");
    });

    it("stay hidden until then", () => {
        render(<><Sidebar sections={[]} activeId="" showAsk={false} /><HeaderBar sections={[]} activeId="" showAsk={false} /></>);

        expect(screen.queryByRole("link", { name: "Ask a question" })).toBeNull();
    });

    it("close the phone menu first, like the section links", () => {
        const onNavigate = vi.fn((_: string, event: React.MouseEvent) => event.preventDefault());
        render(<Sidebar sections={[]} activeId="" showAsk onNavigate={onNavigate} />);

        fireEvent.click(screen.getByRole("link", { name: "Ask a question" }));

        expect(onNavigate).toHaveBeenCalledWith("ask", expect.anything());
    });

    it("show in the phone header bar as an icon link", () => {
        render(<HeaderBar sections={[]} activeId="" showAsk />);

        expect(screen.getByRole("link", { name: "Ask a question" }).getAttribute("href")).toBe("#ask");
    });
});
