/**
 * Point the repository at an owner.
 *
 * The owner and repo name appear in badges, package metadata, plugin manifests
 * and documentation links. Editing six files by hand is how one of them ends up
 * pointing at the wrong account, which is a broken badge at best and a wrong
 * clone URL at worst.
 *
 *   node scripts/set-repo-owner.mjs <owner> [repo]
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const [owner, repo = "diagram-studio"] = process.argv.slice(2);
if (!owner) {
  console.error("usage: node scripts/set-repo-owner.mjs <owner> [repo]");
  process.exit(1);
}
if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
  console.error("owner and repo may only contain letters, numbers, dots, dashes and underscores");
  process.exit(1);
}

/** Anything that looks like a GitHub slug for this project. */
const SLUG = /github\.com\/[\w.-]+\/diagram-studio/g;
const FILES = [
  "README.md",
  "TUTORIAL.md",
  "package.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
  "adapters/MCP.md",
];

let changed = 0;
for (const file of FILES) {
  const path = join(root, file);
  let source;
  try {
    source = await readFile(path, "utf8");
  } catch {
    continue;
  }
  const next = source.replace(SLUG, `github.com/${owner}/${repo}`);
  if (next !== source) {
    await writeFile(path, next, "utf8");
    changed++;
    console.log(`updated ${file}`);
  }
}

console.log(`\nrepository is now github.com/${owner}/${repo} in ${changed} file${changed === 1 ? "" : "s"}`);
console.log("run `npm run docs` if any reference page embeds a link, then commit.");
