/**
 * Skin linter.
 *
 * The visual system is only a system if it is enforced. This checks that:
 *  - the skin uses tokens, not literal colours
 *  - nothing shipped uses a shadow, glow, blur or gradient
 *  - renderers do not inline styles that belong in the skin
 *  - the accent budget is respected by every type's starter content
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { SKIN_RULES } from "../src/render/skin.js";
import { DIAGRAM_TYPES, LIMITS, createDiagram } from "../src/model.js";

const failures = [];
const fail = (scope, detail) => failures.push({ scope, detail });

const BANNED = [
  { pattern: /drop-shadow|box-shadow|filter\s*:\s*blur|feGaussianBlur|feDropShadow/i, why: "no shadows, glows or blurs" },
  { pattern: /linearGradient|radialGradient|gradient\(/i, why: "no gradients" },
  { pattern: /text-shadow/i, why: "no text shadows" },
];

// 1. the skin itself
for (const line of SKIN_RULES.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("/*")) continue;
  for (const rule of BANNED) {
    if (rule.pattern.test(trimmed)) fail("skin", `${rule.why}: ${trimmed}`);
  }
  // Literal colours are only allowed as `transparent` or `none`.
  const literal = trimmed.match(/:\s*(#[0-9a-f]{3,8}|rgb\(|hsl\()/i);
  if (literal) fail("skin", `literal colour outside the token set: ${trimmed}`);
}

// 2. renderers must not inline styles the skin owns
const typesDir = new URL("../src/types/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
for (const file of await readdir(typesDir)) {
  if (!file.endsWith(".js")) continue;
  const source = await readFile(join(typesDir, file), "utf8");
  for (const rule of BANNED) {
    if (rule.pattern.test(source)) fail(`types/${file}`, rule.why);
  }
  const inlineFill = source.match(/fill="#[0-9a-f]{3,8}"/i);
  if (inlineFill) fail(`types/${file}`, `hardcoded fill ${inlineFill[0]} — use a skin class`);
}

// 3. accent budget in starter content
for (const type of DIAGRAM_TYPES) {
  const diagram = createDiagram(type.id);
  const accents = diagram.nodes.filter((node) => node.tone === "accent").length;
  if (accents > LIMITS.accent) fail(`sample:${type.id}`, `${accents} accent nodes, budget is ${LIMITS.accent}`);
  if (diagram.nodes.length > LIMITS.budgetNodes) {
    fail(`sample:${type.id}`, `${diagram.nodes.length} nodes, budget is ${LIMITS.budgetNodes}`);
  }
  if (diagram.edges.length > LIMITS.budgetEdges) {
    fail(`sample:${type.id}`, `${diagram.edges.length} edges, budget is ${LIMITS.budgetEdges}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`${failure.scope}: ${failure.detail}`);
  console.error(`\nlint-skin: ${failures.length} failures`);
  process.exit(1);
}

console.log(`lint-skin: skin, ${DIAGRAM_TYPES.length} renderers and their starter content are within the system`);
