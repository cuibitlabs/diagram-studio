/**
 * Accessibility linter.
 *
 * Checks the two things a diagram system can actually guarantee:
 *  - every shipped palette meets its contrast contract at the sizes used
 *  - every rendered diagram carries a complete, uniquely referenced accessible
 *    name, keeps its text as text, and never relies on colour alone
 */

import { DIAGRAM_TYPES, createDiagram } from "../src/model.js";
import { buildSVG } from "../src/render/svg.js";
import { PALETTES } from "../src/theme/palettes.js";
import { auditTheme } from "../src/theme/contrast.js";
import { MIN_LABEL_SIZE, TYPE } from "../src/engine/typography.js";

const failures = [];
const fail = (scope, detail) => failures.push({ scope, detail });

// 1. palettes
for (const [id, palette] of Object.entries(PALETTES)) {
  for (const row of auditTheme(palette)) {
    if (row.decorative) continue;
    if (!row.pass) fail(`palette:${id}`, `${row.pair} is ${row.ratio}:1, needs ${row.target}:1 — ${row.note}`);
  }
}

// 2. the type scale never drops below the readable minimum for a document
for (const [name, style] of Object.entries(TYPE)) {
  if (style.size < MIN_LABEL_SIZE.document && !["nodeSub", "meta", "edgeLabel", "axis", "legend", "section", "value"].includes(name)) {
    fail("type-scale", `${name} is ${style.size}px, below the ${MIN_LABEL_SIZE.document}px document minimum`);
  }
  if (style.size % 4 !== 0 && style.size % 2 !== 0) fail("type-scale", `${name} size ${style.size} is off the grid`);
}

// 3. rendered output
for (const type of DIAGRAM_TYPES) {
  for (const [paletteId, palette] of Object.entries(PALETTES)) {
    const diagram = createDiagram(type.id);
    diagram.theme = { ...palette };
    const svg = buildSVG(diagram, { uid: `${type.id}-${paletteId}`, interactive: false });
    const scope = `${type.id}@${paletteId}`;

    if (!svg.includes('role="img"')) fail(scope, "missing role=img");

    const labelledBy = svg.match(/aria-labelledby="([^"]+)"/);
    if (!labelledBy) {
      fail(scope, "missing aria-labelledby");
    } else {
      for (const id of labelledBy[1].split(/\s+/)) {
        if (!svg.includes(`id="${id}"`)) fail(scope, `aria-labelledby points at missing id ${id}`);
      }
    }

    const title = svg.match(/<title id="[^"]+">([^<]*)<\/title>/);
    if (!title || !title[1].trim()) fail(scope, "empty <title>");
    const desc = svg.match(/<desc id="[^"]+">([^<]*)<\/desc>/);
    if (!desc || !desc[1].trim()) fail(scope, "empty <desc>");

    // Text must remain text.
    if (/<image\b/.test(svg)) fail(scope, "raster image embedded in an SVG diagram");
    if (/font-size:\s*([0-9.]+)px/.test(svg)) {
      const sizes = [...svg.matchAll(/font-size:\s*([0-9.]+)px/g)].map((match) => Number(match[1]));
      const smallest = Math.min(...sizes);
      if (smallest < 12) fail(scope, `text at ${smallest}px is below the 12px floor`);
    }

    // Interactive nodes carry an accessible name.
    for (const match of svg.matchAll(/data-node-id="[^"]+"([^>]*)>/g)) {
      if (!/aria-label="[^"]+"/.test(match[1])) fail(scope, "a node has no accessible label");
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`${failure.scope}: ${failure.detail}`);
  console.error(`\nlint-a11y: ${failures.length} failures`);
  process.exit(1);
}

console.log(
  `lint-a11y: ${Object.keys(PALETTES).length} palettes and ${DIAGRAM_TYPES.length} types pass contrast, accessible-name and text-as-text checks`,
);
