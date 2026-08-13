/**
 * Documentation sync verifier.
 *
 * Fails when a diagram type has no guidance, when a generated reference is
 * missing or stale, or when the skill's own claims no longer match the code.
 * The point is that documentation cannot quietly describe a system that has
 * moved on.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { DIAGRAM_TYPES } from "../src/model.js";
import { GUIDANCE } from "../src/types/guidance.js";
import { PALETTES } from "../src/theme/palettes.js";
import { docFor } from "./build-type-docs.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const references = join(root, "skills", "create-editorial-diagrams", "references");
const failures = [];
const fail = (scope, detail) => failures.push({ scope, detail });

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

const readme = await read(join(root, "README.md"));
if (readme) {
  const claimed = readme.match(/(\d+)\s+diagram and chart structures/i);
  if (claimed && Number(claimed[1]) !== DIAGRAM_TYPES.length) {
    fail("README.md", `claims ${claimed[1]} structures, the registry has ${DIAGRAM_TYPES.length}`);
  }
  const palettes = readme.match(/(\d+)\s+audited palettes/i);
  if (palettes && Number(palettes[1]) !== Object.keys(PALETTES).length) {
    fail("README.md", `claims ${palettes[1]} palettes, there are ${Object.keys(PALETTES).length}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`${failure.scope}: ${failure.detail}`);
  console.error(`\nverify-docs-sync: ${failures.length} failures`);
  process.exit(1);
}

console.log(`verify-docs-sync: ${DIAGRAM_TYPES.length} type references, the index and the skill claims are current`);
