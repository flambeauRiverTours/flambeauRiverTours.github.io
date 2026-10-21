/** react-bootstrap's Offcanvas checks media queries, which jsdom doesn't implement; this answers "no match" to all of them */
export function stubMatchMedia(): void {
    window.matchMedia = (query: string) => ({
        matches: false, media: query, onchange: null,
        addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    });
}
