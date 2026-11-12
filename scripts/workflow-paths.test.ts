import { describe, expect, it } from "vitest";
import apiWorkflow from "../.github/workflows/api.yml?raw";
import ciWorkflow from "../.github/workflows/ci.yml?raw";

//each `paths:` list in a workflow, as its patterns in order
function pathFilters(workflow: string): string[][] {
    return [...workflow.replace(/\r\n/g, "\n").matchAll(/^(\s*)paths:\n((?:\1\s+- .*\n)+)/gm)]
        .map((match) => [...(match[2] ?? "").matchAll(/- '([^']+)'/g)].map((pattern) => pattern[1] ?? ""));
}

//the knowledge files are Markdown, but they ship with the Function;
//in GitHub's path filters later patterns win, so they must come back after any Markdown exclusion
describe("api.yml", () => {
    it("has path filters to check", () => {
        expect(pathFilters(apiWorkflow).length).toBeGreaterThan(0);
    });

    it("runs for changes to the knowledge files", () => {
        for (const patterns of pathFilters(apiWorkflow)) {
            const markdownExcluded = patterns.indexOf("!**/*.md");
            expect(patterns.lastIndexOf("api/knowledge/**")).toBeGreaterThan(markdownExcluded);
        }
    });
});

//the templates each `az deployment group <command>` in a workflow names, in order
function templates(workflow: string, command: "what-if" | "create"): string[] {
    return [...workflow.matchAll(new RegExp(`az deployment group ${command}[^]*?--template-file (\\S+)`, "g"))]
        .map((match) => match[1] ?? "");
}

//infrastructure changes are reviewed as a diff before they merge (docs/standards.md)
describe("api.yml deployments", () => {
    it("deploys the site's Static Web App", () => {
        expect(templates(apiWorkflow, "create")).toContain("infra/site.bicep");
    });

    it("previews every template it deploys", () => {
        expect(templates(apiWorkflow, "what-if")).toEqual(templates(apiWorkflow, "create"));
    });
});

//main's ruleset requires ci.yml's check, and a run skipped by a path filter never reports, so the pull request would wait forever
describe("ci.yml", () => {
    it("runs on every pull request", () => {
        expect(pathFilters(ciWorkflow)).toEqual([]);
    });

    //api.yml's path filters skip a pull request that only changes deploy.yml or ci.yml
    it("lints every workflow, so a change to any of them is checked", () => {
        expect(ciWorkflow).toMatch(/^\s+\.\/actionlint\b/m);
        expect(apiWorkflow).not.toMatch(/actionlint/);
    });
});
