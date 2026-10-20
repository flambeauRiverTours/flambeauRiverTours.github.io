import { describe, expect, it } from "vitest";
import { bodyToText, buildKnowledge, buildSiteKnowledge, htmlToText } from "./knowledge";
import { BodyBlockStyle, ISectionData, SectionGroup } from "../src/datamodel/SectionData";

describe("htmlToText", () => {
    it("turns list items into bullets", () => {
        expect(htmlToText("<ul><li>One</li><li>Two</li></ul>")).toBe("- One\n- Two");
    });

    it("keeps link text and drops the markup", () => {
        expect(htmlToText('<p>Feel free to <a href="mailto:x@y.z">email me</a>.</p>')).toBe("Feel free to email me.");
    });

    it("decodes the entities React escapes", () => {
        expect(htmlToText("<p>.NET &amp; Frontend &lt;3 &gt; &quot;quoted&quot; it&#x27;s fine</p>")).toBe('.NET & Frontend <3 > "quoted" it\'s fine');
    });

    it("writes definition lists as term: definition lines", () => {
        expect(htmlToText("<dl><dt>Languages</dt><dd>C#, SQL</dd><dt>Cloud</dt><dd>Azure</dd></dl>")).toBe("Languages: C#, SQL\nCloud: Azure");
    });

    it("separates paragraphs with a blank line", () => {
        expect(htmlToText("<p>First</p><p>Second</p>")).toBe("First\n\nSecond");
    });
});

describe("bodyToText", () => {
    it("trims plain strings", () => {
        expect(bodyToText("  Hello there.  ")).toBe("Hello there.");
    });

    it("renders JSX bodies to text", () => {
        expect(bodyToText(<ul><li>Led 9 developers</li></ul>)).toBe("- Led 9 developers");
    });
});

describe("buildKnowledge", () => {
    const profile = { name: "Jane Doe", role: "Engineer", location: "Charlotte, NC" };
    const highlights = [{ value: "8 years", label: "building software" }];
    const sections: ISectionData[] = [
        {
            id: "about",
            buttonTitle: "About",
            group: SectionGroup.work,
            bodyTextSections: [
                { title: "About", body: "I build things.", style: BodyBlockStyle.titleBlock },
                { title: "", body: <p>Say <a href="mailto:a@b.c">hello</a>.</p>, style: BodyBlockStyle.contentBlock },
            ],
        },
        {
            id: "experience",
            buttonTitle: "Experience",
            group: SectionGroup.work,
            bodyTextSections: [
                { title: "Experience", body: "", style: BodyBlockStyle.titleBlock },
                {
                    id: "experience-acme",
                    title: "Senior Engineer",
                    subtitle: "Acme · 2020 – Present",
                    body: <ul><li>Shipped it</li></ul>,
                    style: BodyBlockStyle.contentBlock,
                    links: [{ label: "Code", href: "https://example.com/code" }],
                },
                { title: "Hobby", body: "Not linkable.", style: BodyBlockStyle.imageBlock, imagePath: "x.jpg" },
            ],
        },
        {
            id: "travel",
            buttonTitle: "Travel",
            group: SectionGroup.personal,
            bodyTextSections: [
                { title: "Travel", body: "I've visited 15 countries.", style: BodyBlockStyle.titleBlock },
                { title: "Japan", body: "We loved the noodles.", style: BodyBlockStyle.imageBlock, imagePath: "japan.jpg" },
            ],
        },
    ];

    const build = () => buildKnowledge(profile, highlights, sections);

    it("starts with the profile and highlights", () => {
        expect(build().siteMd.startsWith("# Jane Doe\nEngineer\nCharlotte, NC\n\n## Highlights\n- 8 years: building software\n")).toBe(true);
    });

    it("tags section headings with their link id", () => {
        expect(build().siteMd).toContain("# [about] About\nI build things.\n\nSay hello.");
    });

    it("tags entries that have an id, with subtitle, body and external links", () => {
        expect(build().siteMd).toContain("## [experience-acme] Senior Engineer\nAcme · 2020 – Present\n- Shipped it\nLinks: Code (https://example.com/code)");
    });

    it("leaves entries without an id untagged", () => {
        expect(build().siteMd).toContain("## Hobby\nNot linkable.");
    });

    it("ends with exactly one newline and never has more than one blank line in a row", () => {
        const { siteMd } = build();
        expect(siteMd.endsWith("\n")).toBe(true);
        expect(siteMd.endsWith("\n\n")).toBe(false);
        expect(siteMd).not.toMatch(/\n\n\n/);
    });

    it("lists every section and every entry with an id as a link target, in page order", () => {
        expect(build().links).toEqual([
            { id: "about", label: "About" },
            { id: "experience", label: "Experience" },
            { id: "experience-acme", label: "Experience › Senior Engineer" },
            { id: "travel", label: "Travel" },
        ]);
    });

    it("keeps only the introduction of a personal section, and points to the page for the rest", () => {
        const { siteMd } = build();
        expect(siteMd).toContain("# [travel] Travel\nI've visited 15 countries.\nThe individual entries are in the Travel section of the page.");
        expect(siteMd).not.toContain("noodles");
    });
});

describe("buildSiteKnowledge", () => {
    it("leaves out the individual books and trips but keeps the section introductions", () => {
        const { siteMd } = buildSiteKnowledge();
        expect(siteMd).not.toContain("Malazan");
        expect(siteMd).not.toContain("Hobbiton");
        expect(siteMd).toContain("15 countries and 5 continents");
        expect(siteMd).toContain("Kindle");
    });

    it("includes the hero facts", () => {
        expect(buildSiteKnowledge().siteMd).toContain("Relocating to Charlotte, NC in January 2027");
    });

    it("has a link target for each work entry anchor", () => {
        const ids = buildSiteKnowledge().links.map((link) => link.id);
        expect(ids).toEqual(expect.arrayContaining([
            "experience-spie",
            "experience-epic-lead",
            "experience-epic-developer",
            "experience-skills",
            "experience-certifications",
            "projects-fantasy-football",
            "projects-tidbyt",
        ]));
    });

    it("has unique link ids", () => {
        const ids = buildSiteKnowledge().links.map((link) => link.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("contains no leftover markup", () => {
        const { siteMd } = buildSiteKnowledge();
        expect(siteMd).not.toMatch(/<\/?[a-z][^>]*>/i);
        expect(siteMd).not.toMatch(/&(amp|lt|gt|quot|#x27);/);
    });
});
