/**
 * Checks every package in package-lock.json against the licence allow list (docs/standards.md).
 * Reads node_modules for entries the lockfile has no licence for, so run it after npm ci. Usage: npm run check:licences
 */

import { readFileSync } from "node:fs";
import { runnerImport } from "vite";

const { module: licences } = await runnerImport("/scripts/licences.ts");

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const lockfile = readJson("package-lock.json");
//an optional package for another platform isn't installed, and has no licence to read
const installed = (path) => {
    try {
        return licences.installedLicence(readJson(`${path}/package.json`));
    } catch {
        return undefined;
    }
};

const refused = licences.refusedPackages(lockfile, installed);
if (refused.length > 0) {
    console.error("Licences outside the allow list:");
    refused.forEach((line) => console.error(`  ${line}`));
    process.exit(1);
}
console.log(`All ${Object.keys(lockfile.packages).length - 1} packages are under allowed licences`);
