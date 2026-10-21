import { describe, expect, it } from "vitest";
import { installedLicence, refusedPackages } from "./licences";

const lockfile = (packages: Record<string, { version?: string; license?: string; dev?: boolean; devOptional?: boolean }>) =>
    ({ packages: { "": { version: "0.0.0" }, ...packages } });

describe("refusedPackages", () => {
    it("allows a shipped package under a licence on the shipped list", () => {
        expect(refusedPackages(lockfile({ "node_modules/react": { version: "18.3.1", license: "MIT" } }))).toEqual([]);
    });

    it("refuses a shipped package under a build-only licence", () => {
        expect(refusedPackages(lockfile({ "node_modules/a": { version: "1.0.0", license: "MPL-2.0" } })))
            .toEqual(["a@1.0.0: MPL-2.0"]);
    });

    it("allows a build-only licence in a dev package", () => {
        expect(refusedPackages(lockfile({ "node_modules/a": { version: "1.0.0", license: "MPL-2.0", dev: true } }))).toEqual([]);
        expect(refusedPackages(lockfile({ "node_modules/b": { version: "1.0.0", license: "CC0-1.0", devOptional: true } }))).toEqual([]);
    });

    it("refuses a package with no licence", () => {
        expect(refusedPackages(lockfile({ "node_modules/a": { version: "1.0.0", dev: true } })))
            .toEqual(["a@1.0.0: no licence (dev)"]);
    });

    it("passes an OR expression when any term is allowed", () => {
        expect(refusedPackages(lockfile({ "node_modules/a": { version: "1.0.0", license: "(GPL-3.0 OR MIT)" } }))).toEqual([]);
    });

    it("needs every term of an AND expression to be allowed", () => {
        expect(refusedPackages(lockfile({ "node_modules/a": { version: "1.0.0", license: "MIT AND GPL-3.0" } })))
            .toEqual(["a@1.0.0: MIT AND GPL-3.0"]);
    });

    it("names a nested package by its own name", () => {
        expect(refusedPackages(lockfile({ "node_modules/a/node_modules/b": { version: "2.0.0", license: "GPL-3.0" } })))
            .toEqual(["b@2.0.0: GPL-3.0"]);
    });

    //entries written by older npm versions have no license field
    it("falls back to the installed package's licence when the lockfile has none", () => {
        const installed = (path: string) => (path === "node_modules/a" ? "ISC" : undefined);
        expect(refusedPackages(lockfile({ "node_modules/a": { version: "1.0.0" } }), installed)).toEqual([]);
        expect(refusedPackages(lockfile({ "node_modules/b": { version: "1.0.0" } }), installed)).toEqual(["b@1.0.0: no licence"]);
    });

    it("knows fsevents 2.3.3's licence, since it's only installed on macOS", () => {
        expect(refusedPackages(lockfile({ "node_modules/fsevents": { version: "2.3.3", dev: true } }))).toEqual([]);
        expect(refusedPackages(lockfile({ "node_modules/fsevents": { version: "2.3.4", dev: true } }))).toEqual(["fsevents@2.3.4: no licence (dev)"]);
    });

    it("accepts argparse 2.0.1's Python-2.0 licence as a dev package only", () => {
        expect(refusedPackages(lockfile({ "node_modules/argparse": { version: "2.0.1", license: "Python-2.0", dev: true } }))).toEqual([]);
        expect(refusedPackages(lockfile({ "node_modules/argparse": { version: "2.0.1", license: "Python-2.0" } })))
            .toEqual(["argparse@2.0.1: Python-2.0"]);
        expect(refusedPackages(lockfile({ "node_modules/argparse": { version: "2.0.2", license: "Python-2.0", dev: true } })))
            .toEqual(["argparse@2.0.2: Python-2.0 (dev)"]);
    });

    it("prefers the lockfile's licence to the installed one", () => {
        expect(refusedPackages(lockfile({ "node_modules/a": { version: "1.0.0", license: "GPL-3.0" } }), () => "MIT"))
            .toEqual(["a@1.0.0: GPL-3.0"]);
    });
});

describe("installedLicence", () => {
    it("reads a licence string", () => {
        expect(installedLicence({ license: "MIT" })).toBe("MIT");
    });

    it("reads the old object and array forms", () => {
        expect(installedLicence({ license: { type: "BSD-3-Clause" } })).toBe("BSD-3-Clause");
        expect(installedLicence({ licenses: [{ type: "MIT" }, { type: "Apache-2.0" }] })).toBe("MIT OR Apache-2.0");
    });

    it("is undefined when the package names none", () => {
        expect(installedLicence({})).toBeUndefined();
    });
});
