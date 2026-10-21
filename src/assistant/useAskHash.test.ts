// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAskHash } from "./useAskHash";

//moves the address to `url` as a link click would, then tells the page
function followLink(url: string) {
    const oldURL = window.location.href;
    window.history.pushState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: window.location.href }));
}

describe("useAskHash", () => {
    //without Vitest's globals, Testing Library doesn't unmount between tests by itself
    afterEach(() => {
        cleanup();
        window.history.replaceState(null, "", "/");
    });

    it("opens the drawer when the page is loaded at #ask, and drops the hash", () => {
        window.history.replaceState(null, "", "/#ask");
        const open = vi.fn();

        renderHook(() => useAskHash(open));

        expect(open).toHaveBeenCalledOnce();
        expect(window.location.hash).toBe("");
    });

    it("opens the drawer when a link goes to #ask, and puts back the address it came from", () => {
        window.history.replaceState(null, "", "/#experience");
        const open = vi.fn();
        renderHook(() => useAskHash(open));

        followLink("/#ask");

        expect(open).toHaveBeenCalledOnce();
        expect(window.location.hash).toBe("#experience");
    });

    it("ignores links to the page's sections", () => {
        const open = vi.fn();
        renderHook(() => useAskHash(open));

        followLink("/#projects");

        expect(open).not.toHaveBeenCalled();
        expect(window.location.hash).toBe("#projects");
    });

    it("stops listening once unmounted", () => {
        const open = vi.fn();
        const { unmount } = renderHook(() => useAskHash(open));
        unmount();

        followLink("/#ask");

        expect(open).not.toHaveBeenCalled();
    });
});
