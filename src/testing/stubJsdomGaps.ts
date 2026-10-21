/**
 * Fills in what the drawer uses and jsdom doesn't implement: media queries (react-bootstrap's Offcanvas checks them,
 * and the drawer reads reduced motion and touch) and scrolling an element. Every media query answers "no match".
 */
export function stubJsdomGaps(): void {
    stubJsdomGapsMatching();
}

/** As stubJsdomGaps, but the given media queries match, e.g. "(prefers-reduced-motion: reduce)" */
export function stubJsdomGapsMatching(...matching: string[]): void {
    window.matchMedia = (query: string) => ({
        matches: matching.includes(query), media: query, onchange: null,
        addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    });
    Element.prototype.scrollTo ??= () => {};
}
