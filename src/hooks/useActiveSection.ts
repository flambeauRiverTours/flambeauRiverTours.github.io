import { useEffect, useState } from "react";

/**
 * Tracks which section of the page is currently being read, for highlighting it in the navigation
 * @param ids The element ids of the page sections, in page order
 * @returns The id of the section nearest the top of the viewport
 */
export function useActiveSection(ids: string[]): string {
    const [activeId, setActiveId] = useState(ids[0]);

    useEffect(() => {
        //a section counts as active once its top passes the upper third of the viewport
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.filter((entry) => entry.isIntersecting);
            if (visible.length) {
                setActiveId(visible[0].target.id);
            }
        }, { rootMargin: "-30% 0px -65% 0px" });

        ids.forEach((id) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });
        return () => observer.disconnect();
    }, [ids]);

    return activeId;
}
