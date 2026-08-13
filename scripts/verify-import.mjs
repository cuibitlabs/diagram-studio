/**
 * Import verifier.
 *
 * Runs every fixture in `examples/` through the importers and checks that the
 * result is a valid project that renders, and that the fidelity ledger is
 * populated. Catches the class of regression where an importer silently
 * produces an empty or unrenderable diagram.
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { parseDrawio } from "../src/import/drawio.js";
import { parseMermaid } from "../src/import/mermaid.js";
import { parse as parseDSL } from "../src/dsl/index.js";
import { toDrawio } from "../src/export/drawio.js";
import { toMermaid } from "../src/export/mermaid.js";
import { DIAGRAM_TYPES, createDiagram, validateDiagram } from "../src/model.js";
import { buildSVG } from "../src/render/svg.js";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const examplesDir = join(root, "examples");
const failures = [];
const fail = (scope, detail) => failures.push({ scope, detail });

let checked = 0;

for (const file of await readdir(examplesDir)) {
  const source = await readFile(join(examplesDir, file), "utf8");
  let diagram;
  try {
    if (/\.(mmd|mermaid|md)$/i.test(file)) diagram = parseMermaid(source);
    else if (/\.(drawio|xml)$/i.test(file)) diagram = await parseDrawio(source);
    else if (/\.ds$/i.test(file)) diagram = parseDSL(source);
    else continue;
  } catch (error) {
    fail(file, `import threw: ${error.message}`);
    continue;
  }

  checked++;
  const errors = validateDiagram(diagram);
  if (errors.length) fail(file, `invalid project: ${errors.join("; ")}`);
  if (!diagram.nodes.length) fail(file, "produced no nodes");
  // The diagram language is authored, not imported, so it has nothing to record.
  if (!diagram.provenance && !/\.ds$/i.test(file)) fail(file, "no fidelity ledger recorded");

  try {
    const svg = buildSVG(diagram, { uid: "verify", interactive: false });
    if (!svg.includes("<svg")) fail(file, "did not render");
  } catch (error) {
    fail(file, `render threw: ${error.message}`);
  }
}

// Every type must survive a Mermaid and a draw.io export without throwing.
for (const type of DIAGRAM_TYPES) {
  const diagram = createDiagram(type.id);
  try {
    const { text } = toMermaid(diagram);
    if (!text.trim()) fail(type.id, "mermaid export was empty");
  } catch (error) {
    fail(type.id, `mermaid export threw: ${error.message}`);
  }
  try {
    const xml = toDrawio(diagram);
    if (!xml.includes("<mxGraphModel")) fail(type.id, "draw.io export was malformed");
    const reimported = await parseDrawio(xml);
    if (reimported.nodes.length !== diagram.nodes.length) {
      fail(type.id, `draw.io round trip lost nodes: ${diagram.nodes.length} → ${reimported.nodes.length}`);
    }
  } catch (error) {
    fail(type.id, `draw.io export threw: ${error.message}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`${failure.scope}: ${failure.detail}`);
  console.error(`\nverify-import: ${failures.length} failures`);
  process.exit(1);
}

console.log(`verify-import: ${checked} fixtures import and render; ${DIAGRAM_TYPES.length} types survive Mermaid and draw.io export`);
