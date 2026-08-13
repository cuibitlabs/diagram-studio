/**
 * Example library verifier.
 *
 * An example library is only worth shipping if it shows what the code does
 * today. Hand-maintained galleries drift silently: the examples keep rendering
 * an older skin while the engine moves on, and the drift is invisible because
 * nobody diffs an HTML file against a renderer.
 *
 * This regenerates every example in memory and fails on any difference, any
 * missing file, and any orphan left behind by a removed type. It also checks
 * the properties that make an example usable at all: self-contained, no network
 * request, accessible name intact, and no script unless the diagram is stepped.
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { DIAGRAM_TYPES } from "../src/model.js";
import { VARIANTS, allExamples } from "./build-examples.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const assets = join(root, "skills", "create-editorial-diagrams", "assets");

const failures = [];
const fail = (scope, detail) => failures.push({ scope, detail });
const normalise = (value) => value.replace(/\r\n/g, "\n");

const expected = allExamples();
const expectedNames = new Set(expected.map((file) => file.name));

let onDisk = [];
try {
  onDisk = await readdir(assets);
} catch {
  fail("assets", `directory is missing — run "npm run examples"`);
}

// 1. every expected example is present and current
for (const file of expected) {
  let actual;
  try {
    actual = await readFile(join(assets, file.name), "utf8");
  } catch {
    fail(file.name, `missing — run "npm run examples"`);
    continue;
  }
  if (normalise(actual) !== normalise(file.content)) {
    fail(file.name, `stale — run "npm run examples"`);
    continue;
  }

  // 2. the properties that make it usable
  if (!/<svg/.test(actual)) fail(file.name, "contains no diagram");
  if (/src="https?:|href="https?:|@import/.test(actual)) fail(file.name, "makes a network request");
  if (!/role="img"/.test(actual)) fail(file.name, "the diagram has no img role");
  if (!/aria-labelledby="/.test(actual)) fail(file.name, "the diagram has no accessible name");

  const stepped = /data-motion-controls/.test(actual);
  const scripted = /<script/.test(actual);
  if (scripted && !stepped) fail(file.name, "ships script for a diagram that does not step");
}

// 3. no orphans from a type or variant that no longer exists
for (const file of onDisk) {
  if (!file.startsWith("example-") || !file.endsWith(".html")) continue;
  if (!expectedNames.has(file)) fail(file, `orphan — run "npm run examples"`);
}

// 4. the index is present and links everything
try {
  const index = await readFile(join(assets, "index.html"), "utf8");
  for (const file of expected) {
    if (!index.includes(file.name)) fail("index.html", `${file.name} is not linked`);
  }
} catch {
  fail("index.html", `missing — run "npm run examples"`);
}

if (failures.length) {
  for (const failure of failures.slice(0, 30)) console.error(`${failure.scope}: ${failure.detail}`);
  if (failures.length > 30) console.error(`… and ${failures.length - 30} more`);
  console.error(`\nverify-examples: ${failures.length} failures`);
  process.exit(1);
}

console.log(
  `verify-examples: ${expected.length} examples (${DIAGRAM_TYPES.length} types × ${VARIANTS.length} variants) are current, self-contained and named`,
);
