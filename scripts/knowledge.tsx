/**
 * Turns the page content into the plain-text knowledge file the assistant answers from,
 * plus the list of anchors its answers may link to
 */

import type { JSX } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BodyBlockStyle, IBodyTextSection, IHighlight, ILink, IProfile, ISectionData, SectionGroup } from "../src/datamodel/SectionData";
import { FullPageData } from "../src/datamodel/FullPageData";

export interface ILinkTarget {
    id: string; //anchor id on the page
    label: string; //what the link button says, e.g. "Experience › Senior Software Engineer"
}

//the only entities React's renderToStaticMarkup produces
const entities: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" };

/**
 * Converts rendered body HTML to plain text: bullets for list items, "term: definition" lines, blank lines between paragraphs
 * @param html The HTML to convert
 * @returns The text, without markup or entities
 */
export function htmlToText(html: string): string {
    const text = html
        .replace(/<li[^>]*>/gi, "\n- ")
        .replace(/<dt[^>]*>/gi, "\n")
        .replace(/<\/dt>\s*<dd[^>]*>/gi, ": ")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&(amp|lt|gt|quot|#x27);/g, (entity) => entities[entity] ?? entity);
    return text
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Gets the text of an entry body, rendering JSX bodies first
 * @param body A plain string or JSX body from the page data
 * @returns The body as plain text
 */
export function bodyToText(body: string | JSX.Element): string {
    return typeof body === "string" ? body.trim() : htmlToText(renderToStaticMarkup(body));
}

/**
 * Builds the knowledge file and link list from the page content
 * @param profile The name, role, and location from the hero
 * @param highlights The headline numbers from the hero
 * @param sections The page sections, in page order
 * @returns The knowledge file as text, and every anchor an answer may link to
 */
export function buildKnowledge(profile: IProfile, highlights: IHighlight[], sections: ISectionData[]): { siteMd: string; links: ILinkTarget[] } {
    const blocks = [
        `# ${profile.name}\n${profile.role}\n${profile.location}`,
        "## Highlights\n" + highlights.map((highlight) => `- ${highlight.value}: ${highlight.label}`).join("\n"),
        ...sections.map(sectionToText),
    ];
    const links = sections.flatMap((section) => [
        { id: section.id, label: section.buttonTitle },
        ...section.bodyTextSections.flatMap((entry) => entry.id ? [{ id: entry.id, label: `${section.buttonTitle} › ${entry.title}` }] : []),
    ]);
    return { siteMd: blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n", links };
}

/**
 * Builds the knowledge file and link list from the site's own page data
 * @returns The knowledge file as text, and every anchor an answer may link to
 */
export function buildSiteKnowledge(): { siteMd: string; links: ILinkTarget[] } {
    const pageData = new FullPageData();
    return buildKnowledge(pageData.getProfile(), pageData.getHighlights(), pageData.getSectionDataArray());
}

function sectionToText(section: ISectionData): string {
    //personal sections keep only their introduction: books and trips matter least to recruiters, and each one costs tokens on
    //every question. (First chosen for Phi-4-mini's 4,096-token limit; Haiku has no such limit, so adding them is a product choice)
    if (section.group === SectionGroup.personal) {
        const introduction = section.bodyTextSections.filter((entry) => entry.style === BodyBlockStyle.titleBlock).map((entry) => entryToText(section, entry));
        return [...introduction, `The individual entries are in the ${section.buttonTitle} section of the page.`].join("\n");
    }
    return section.bodyTextSections.map((entry) => entryToText(section, entry)).filter((text) => text).join("\n\n");
}

function entryToText(section: ISectionData, entry: IBodyTextSection): string {
    const lines: string[] = [];
    if (entry.style === BodyBlockStyle.titleBlock) {
        lines.push(`# [${section.id}] ${entry.title}`);
    } else if (entry.title) {
        lines.push(entry.id ? `## [${entry.id}] ${entry.title}` : `## ${entry.title}`);
    }
    if (entry.subtitle) {
        lines.push(entry.subtitle);
    }
    lines.push(bodyToText(entry.body));
    if (entry.links?.length) {
        lines.push(linksToText(entry.links));
    }
    return lines.filter((line) => line).join("\n");
}

function linksToText(links: ILink[]): string {
    //not "Links:", which is the answer's own final line and may hold only link IDs
    return "External pages: " + links.map((link) => `${link.label} (${link.href})`).join(", ");
}
