/**
 * Documentation sync verifier.
 *
 * Fails when a diagram type has no guidance, when a generated reference is
 * missing or stale, or when the skill's own claims no longer match the code.
 * The point is that documentation cannot quietly describe a system that has
 * moved on.
 */

import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { DIAGRAM_TYPES } from "../src/model.js";
import { GUIDANCE } from "../src/types/guidance.js";
import { PALETTES } from "../src/theme/palettes.js";
import { docFor } from "./build-type-docs.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const references = join(root, "skills", "create-editorial-diagrams", "references");
const failures = [];
const fail = (scope, detail) => failures.push({ scope, detail });

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Top-level `test(` declarations across the suite. `node --test` reports the
 * same figure, and counting the source keeps the verifier cheap — running the
 * tests to check a sentence in the README would double the build.
 */
async function countTests() {
  const dir = join(root, "test");
  const files = (await readdir(dir)).filter((name) => name.endsWith(".test.mjs"));
  let total = 0;
  for (const file of files) {
    const source = await readFile(join(dir, file), "utf8");
    total += (source.match(/^test\(/gm) ?? []).length;
  }
  return total;
}

const read = async (path) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
};

// 1. every type has guidance
for (const type of DIAGRAM_TYPES) {
  const guidance = GUIDANCE[type.id];
  if (!guidance) {
    fail(type.id, "no entry in src/types/guidance.js");
    continue;
  }
  for (const field of ["use", "avoid", "mistake"]) {
    if (!guidance[field]?.trim()) fail(type.id, `guidance.${field} is empty`);
  }
  if (!guidance.compose?.length) fail(type.id, "guidance.compose is empty");
}

// 2. no guidance for a type that no longer exists
const known = new Set(DIAGRAM_TYPES.map((type) => type.id));
for (const id of Object.keys(GUIDANCE)) {
  if (!known.has(id)) fail(id, "guidance exists for a type that is not registered");
}

// 3. generated references are present and current
for (const type of DIAGRAM_TYPES) {
  const path = join(references, `type-${type.id}.md`);
  const onDisk = await read(path);
  if (onDisk === null) {
    fail(type.id, `missing reference — run "npm run docs"`);
    continue;
  }
  if (onDisk.replace(/\r\n/g, "\n") !== docFor(type).replace(/\r\n/g, "\n")) {
    fail(type.id, `reference is stale — run "npm run docs"`);
  }
}

const index = await read(join(references, "diagram-types.md"));
if (!index) fail("index", "diagram-types.md is missing");
else {
  for (const type of DIAGRAM_TYPES) {
    if (!index.includes(`type-${type.id}.md`)) fail("index", `${type.id} is not linked from the index`);
  }
}

// 4. the skill's headline claims still hold
const skill = await read(join(root, "skills", "create-editorial-diagrams", "SKILL.md"));
if (!skill) fail("SKILL.md", "missing");
else {
  const claimed = skill.match(/(\d+)\s+diagram (?:and chart )?structures|(\d+)\s+types/i);
  const number = Number(claimed?.[1] ?? claimed?.[2] ?? 0);
  if (number && number !== DIAGRAM_TYPES.length) {
    fail("SKILL.md", `claims ${number} types, the registry has ${DIAGRAM_TYPES.length}`);
  }
}

// 5. the README is the landing page, so its claims and its images are checked
//    like anything else. "213 tests" survived three releases before anyone
//    noticed, and a broken hero image is the most visible bug the project can
//    ship.
const readme = await read(join(root, "README.md"));
if (readme) {
  const claims = [
    [/(\d+)\s+diagram(?: and chart)? (?:types|structures)/gi, DIAGRAM_TYPES.length, "diagram types"],
    [/All (\d+) types/gi, DIAGRAM_TYPES.length, "diagram types"],
    [/(\d+)\s+audited palettes/gi, Object.keys(PALETTES).length, "palettes"],
    [/(\d+)\s+tests\b/gi, await countTests(), "tests"],
  ];
  for (const [pattern, actual, noun] of claims) {
    for (const [, claimed] of readme.matchAll(pattern)) {
      if (Number(claimed) !== actual) fail("README.md", `claims ${claimed} ${noun}, there are ${actual}`);
    }
  }

  // Local images and links must resolve. Anything with a scheme is somebody
  // else's uptime and is left alone.
  const targets = [
    ...[...readme.matchAll(/(?:src|srcset)="([^"]+)"/g)].map((match) => match[1]),
    ...[...readme.matchAll(/\]\(([^)#\s]+)\)/g)].map((match) => match[1]),
  ];
  for (const target of new Set(targets)) {
    if (/^[a-z]+:/i.test(target)) continue;
    if (!(await exists(join(root, target)))) fail("README.md", `links to ${target}, which does not exist`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`${failure.scope}: ${failure.detail}`);
  console.error(`\nverify-docs-sync: ${failures.length} failures`);
  process.exit(1);
}

console.log(`verify-docs-sync: ${DIAGRAM_TYPES.length} type references, the index and the skill claims are current`);
