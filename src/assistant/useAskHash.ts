import { useEffect } from "react";

const askHash = "#ask";

/**
 * Opens the assistant for links to #ask: the entry points, the About text and shared jacktreadwell.com/#ask links.
 * The hash is taken out of the address once handled, so Back doesn't reopen the drawer and a second click still works.
 * @param open Kept stable with useCallback; a new function each render would re-register the listener every time
 */
export function useAskHash(open: () => void): void {
    useEffect(() => {
        if (window.location.hash === askHash) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
            open();
        }

        const onHashChange = (event: HashChangeEvent) => {
            if (window.location.hash === askHash) {
                window.history.replaceState(null, "", event.oldURL);
                open();
            }
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, [open]);
}
