/**
 * The licence allow list from docs/standards.md, checked against every package in package-lock.json.
 * Adapted from FantasyFootball's scripts/check-npm-licences.mjs; run by check-licences.mjs.
 */

//what ships in the page
const shipped = new Set(["MIT", "MIT-0", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD"]);

//also allowed in tools that only build or test the page
const buildOnly = new Set([...shipped, "MPL-2.0", "BlueOak-1.0.0", "CC0-1.0"]);

//the self-hosted font ships with the page; OFL-1.1 is the usual licence for fonts (accepted 2026-10-21)
const fontLicence = "OFL-1.1";
const fontPackage = /^@fontsource\//;

//by exact version, so an upgrade is checked again
//fsevents is installed only on macOS, and its lockfile entry predates npm recording licences (MIT on the registry)
const knownLicences: Record<string, string> = { "fsevents@2.3.3": "MIT" };
//by name, dev only: caniuse-lite (CC-BY-4.0) is browser-support data that comes through eslint-plugin-react-hooks' Babel,
//never ships, and is republished almost weekly, so pinning a version would fail most Dependabot updates
const acceptedDevPackageNames = new Set(["caniuse-lite"]);

/**
 * Each package outside the allow list, as "name@version: licence", with "(dev)" for build and test tools.
 * @param installed The installed package's own licence, for lockfile entries older npm versions wrote without one
 */
export function refusedPackages(lockfile: ILockfile, installed: (path: string) => string | undefined = () => undefined): string[] {
    return Object.entries(lockfile.packages)
        .filter(([path]) => path !== "") //the site itself
        .flatMap(([path, pkg]) => {
            const dev = pkg.dev === true || pkg.devOptional === true;
            const name = path.replace(/^.*node_modules\//, "");
            const id = `${name}@${pkg.version}`;
            const licence = pkg.license ?? knownLicences[id] ?? installed(path);
            const listed = dev ? buildOnly : shipped;
            const allowed = fontPackage.test(id) ? new Set([...listed, fontLicence]) : listed;
            if (licence && passes(licence, allowed)) return [];
            if (dev && acceptedDevPackageNames.has(name)) return [];
            return [`${id}: ${licence ?? "no licence"}${dev ? " (dev)" : ""}`];
        });
}

/** The licence a package.json names, including the old object and array forms, as an SPDX expression. */
export function installedLicence(packageJson: IPackageJson): string | undefined {
    const { license, licenses } = packageJson;
    if (typeof license === "string") return license;
    if (license) return license.type;
    return licenses?.map((entry) => entry.type).join(" OR ");
}

//an SPDX expression of ORs passes if any term does; ANDs need every term
function passes(expression: string, allowed: Set<string>): boolean {
    const terms = expression.replace(/[()]/g, "").split(/\s+OR\s+/);
    return terms.some((term) => term.split(/\s+AND\s+/).every((licence) => allowed.has(licence)));
}

interface ILockfile {
    packages: Record<string, { version?: string; license?: string; dev?: boolean; devOptional?: boolean }>;
}

interface IPackageJson {
    license?: string | { type: string };
    licenses?: { type: string }[];
}
