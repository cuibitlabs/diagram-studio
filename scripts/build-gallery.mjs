/**
 * Render every diagram type to `docs/gallery/`.
 *
 * Doubles as visual QA: the tests prove the output is well formed, this proves
 * it is worth looking at. Run `node scripts/build-gallery.mjs` and open
 * `docs/gallery/index.html`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DIAGRAM_TYPES, createDiagram } from "../src/model.js";
import { buildSVG } from "../src/render/svg.js";
import { PALETTES } from "../src/theme/palettes.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs", "gallery");

const variants = [
  { id: "light", palette: "editorial" },
  { id: "dark", palette: "midnight" },
];

const escapeHTML = (value) => value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));

async function main() {
  await mkdir(outDir, { recursive: true });
  const cards = [];

  for (const type of DIAGRAM_TYPES) {
    for (const variant of variants) {
      const diagram = createDiagram(type.id);
      diagram.theme = { ...PALETTES[variant.palette] };
      const svg = buildSVG(diagram, { interactive: false, uid: `${type.id}-${variant.id}` });
      await writeFile(join(outDir, `${type.id}-${variant.id}.svg`), `${svg}\n`, "utf8");
      if (variant.id === "light") {
        cards.push({ type, svg, width: diagram.width, height: diagram.height, nodes: diagram.nodes.length, edges: diagram.edges.length });
      }
    }
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagram Studio — type gallery</title>
<style>
  :root{--paper:#e9e6df;--ink:#1d211f;--muted:#5f665f;--hair:#c8c4ba}
  body{margin:0;padding:48px;background:var(--paper);color:var(--ink);font:16px/1.5 Inter,system-ui,sans-serif}
  h1{font:400 40px/1.1 'Instrument Serif',Georgia,serif;margin:0 0 8px}
  p.lede{color:var(--muted);margin:0 0 40px;max-width:64ch}
  .grid{display:grid;gap:32px}
  figure{margin:0;background:#fffdf8;border:1px solid var(--hair);padding:24px;overflow-x:auto}
  figcaption{display:flex;justify-content:space-between;gap:16px;align-items:baseline;margin-bottom:16px;border-bottom:1px solid var(--hair);padding-bottom:12px}
  figcaption b{font-size:18px}
  figcaption span{font:12px ui-monospace,monospace;color:var(--muted)}
  svg{max-width:100%;height:auto}
</style>
</head>
<body>
<h1>Type gallery</h1>
<p class="lede">Every registered diagram type rendered from its starter content, at the size the layout engine chose. ${cards.length} types.</p>
<div class="grid">
${cards
  .map(
    (card) => `<figure>
  <figcaption><b>${escapeHTML(card.type.label)}</b><span>${card.type.id} · ${card.width}×${card.height} · ${card.nodes} nodes · ${card.edges} edges</span></figcaption>
  ${card.svg}
</figure>`,
  )
  .join("\n")}
</div>
</body>
</html>`;

  await writeFile(join(outDir, "index.html"), html, "utf8");
  console.log(`wrote ${cards.length} types (${cards.length * variants.length} SVGs) to docs/gallery/`);
}

main();
