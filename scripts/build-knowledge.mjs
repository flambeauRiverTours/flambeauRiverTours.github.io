/**
 * Writes the assistant's knowledge files from the page content:
 * api/knowledge/site.md (what the assistant knows) and api/knowledge/links.json (anchors it may link to).
 * Runs the TSX page data through Vite so its image imports resolve. Usage: npm run build:knowledge
 */

import { mkdir, writeFile } from "node:fs/promises";
import { runnerImport } from "vite";

const outDir = new URL("../api/knowledge/", import.meta.url);

const { module: knowledge } = await runnerImport("/scripts/knowledge.tsx");
const { siteMd, links } = knowledge.buildSiteKnowledge();

await mkdir(outDir, { recursive: true });
await writeFile(new URL("site.md", outDir), siteMd);
await writeFile(new URL("links.json", outDir), JSON.stringify(links, null, 2) + "\n");
console.log(`Wrote api/knowledge/site.md (${siteMd.length} chars) and links.json (${links.length} links)`);
