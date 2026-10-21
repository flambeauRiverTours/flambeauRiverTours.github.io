import { describe, expect, it } from "vitest";
import apiWorkflow from "../.github/workflows/api.yml?raw";
import ciWorkflow from "../.github/workflows/ci.yml?raw";

//each `paths:` list in a workflow, as its patterns in order
function pathFilters(workflow: string): string[][] {
    return [...workflow.replace(/\r\n/g, "\n").matchAll(/^(\s*)paths:\n((?:\1\s+- .*\n)+)/gm)]
        .map((match) => [...(match[2] ?? "").matchAll(/- '([^']+)'/g)].map((pattern) => pattern[1] ?? ""));
}

//the knowledge files are Markdown, but they ship with the Function and feed the page's drift check;
//in GitHub's path filters later patterns win, so they must come back after any Markdown exclusion
describe.each([["api.yml", apiWorkflow], ["ci.yml", ciWorkflow]])("%s", (_, workflow) => {
    it("has path filters to check", () => {
        expect(pathFilters(workflow).length).toBeGreaterThan(0);
    });

    it("runs for changes to the knowledge files", () => {
        for (const patterns of pathFilters(workflow)) {
            const markdownExcluded = patterns.indexOf("!**/*.md");
            expect(patterns.lastIndexOf("api/knowledge/**")).toBeGreaterThan(markdownExcluded);
        }
    });
});
