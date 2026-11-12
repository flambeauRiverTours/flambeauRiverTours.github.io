import { describe, expect, it } from "vitest";
import config from "../public/staticwebapp.config.json";
import deployWorkflow from "../.github/workflows/deploy.yml?raw";

type Route = { route: string; redirect?: string; statusCode?: number; headers?: Record<string, string> };
const routes: Route[] = config.routes;

//the project sites are GitHub Pages sites that only appeared under this domain through its custom domain;
//old links to them now go to their github.io homes (tasks/azure-static-web-apps-plan.md)
describe("the project-site redirects", () => {
    it.each(["FantasyFootballWebsite", "dailyDriver"])("sends /%s, with or without a path, to its github.io home", (project) => {
        const home = `https://flambeaurivertours.github.io/${project}/`;

        for (const route of [`/${project}`, `/${project}/*`]) {
            expect(routes).toContainEqual({ route, redirect: home, statusCode: 301 });
        }
    });
});

describe("the Static Web App config", () => {
    //the site has no client-side router, so a missing page is a 404, as it was on GitHub Pages
    it("has no navigation fallback", () => {
        expect(config).not.toHaveProperty("navigationFallback");
    });

    it("sends the same security headers as the ff app", () => {
        expect(config.globalHeaders).toEqual({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin" });
    });

    //Vite puts a content hash in every name under assets/, so a cached copy is never stale
    it("caches the hashed assets for a year", () => {
        expect(routes).toContainEqual({ route: "/assets/*", headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
    });
});

//the job that deploys to the Static Web App, up to the next job
const swaJob = deployWorkflow.replace(/\r\n/g, "\n").match(/^ {2}swa:\n(?: {4,}.*\n|\n)+/m)?.[0] ?? "";

describe("deploy.yml's Static Web App job", () => {
    it("exists", () => {
        expect(swaJob).not.toBe("");
    });

    it("deploys only what the site check passed", () => {
        expect(swaJob).toMatch(/^ {4}needs: check$/m);
    });

    //the deploy identity's federated credentials trust main and pull requests; an environment changes the token's subject
    it("has no environment, so its Azure sign-in works", () => {
        expect(swaJob).not.toMatch(/^ {4}environment:/m);
    });

    //Oryx would otherwise build the site again, outside the check, and could pick up api/
    it("uploads the build as it is", () => {
        expect(swaJob).toMatch(/skip_app_build: true/);
        expect(swaJob).toMatch(/app_location: dist/);
        expect(swaJob).toMatch(/api_location: ''/);
    });

    it("masks the deployment token before using it", () => {
        expect(swaJob).toMatch(/::add-mask::/);
    });

    it("smoke-tests the deployed site", () => {
        expect(swaJob).toMatch(/scripts\/site-smoke\.sh/);
    });
});

//a half-applied deploy is worse than a queue (docs/standards.md)
describe("deploy.yml", () => {
    it("never cancels a deploy midway", () => {
        expect(deployWorkflow).toMatch(/cancel-in-progress: false/);
    });
});
