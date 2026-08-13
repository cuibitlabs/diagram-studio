/**
 * Generate the example asset library.
 *
 * Every registered type in every delivery variant, as a self-contained HTML
 * file that opens offline with no build step and no network request.
 *
 * These are generated, never hand-edited. A hand-maintained example library
 * drifts from the design system within a release — the examples keep showing an
 * older skin while the engine has moved on, and nobody notices because nobody
 * diffs an HTML file against a renderer. `scripts/verify-examples.mjs` fails the
 * build the moment one of these is stale.
 */

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { DIAGRAM_TYPES, createDiagram } from "../src/model.js";
import { buildSVG } from "../src/render/svg.js";
import { PALETTES, paletteOf } from "../src/theme/palettes.js";
import { MOTION_CONTROL_CSS, isStepped, motionControls, motionController, stepTotal } from "../src/render/motion.js";
import { getType } from "../src/types/index.js";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outDir = join(root, "skills", "create-editorial-diagrams", "assets");

/**
 * The five ways a diagram actually ships. Each one is a real delivery target,
 * not a colour swatch: a reader should be able to open the variant that matches
 * their destination and use it as-is.
 */
export const VARIANTS = [
  {
    id: "light",
    label: "Minimal light",
    note: "Inline in a document. The canvas follows the drawing.",
    apply: (diagram) => {
      diagram.theme = paletteOf("editorial");
    },
  },
  {
    id: "dark",
    label: "Minimal dark",
    note: "A separately audited dark palette, not an inverted light one.",
    apply: (diagram) => {
      diagram.theme = paletteOf("midnight");
    },
  },
  {
    id: "full",
    label: "Full editorial",
    note: "Title and standfirst drawn on the canvas, for a standalone figure.",
    apply: (diagram) => {
      diagram.theme = paletteOf("editorial");
      diagram.settings.showTitle = true;
    },
  },
  {
    id: "slide",
    label: "Slide 16:9",
    note: "Pinned to a 1600x900 stage and centred, so a deck stays consistent.",
    apply: (diagram) => {
      diagram.theme = paletteOf("cobalt");
      diagram.settings.preset = "slide-16x9";
      diagram.settings.showTitle = true;
    },
  },
  {
    id: "terminal",
    label: "Terminal",
    note: "Monospace, unfilled shapes, accent carried by stroke. For docs beside code.",
    apply: (diagram) => {
      diagram.theme = paletteOf("graphite");
      diagram.settings.style = "terminal";
    },
  },
];

const esc = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

/** One self-contained example page. */
export function examplePage(type, variant) {
  const diagram = createDiagram(type.id);
  variant.apply(diagram);
  const svg = buildSVG(diagram, { interactive: false, uid: `${type.id}-${variant.id}` });
  const theme = diagram.theme;
  const stepped = isStepped(diagram);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(diagram.title)} — ${esc(variant.label)}</title>
<meta name="description" content="${esc(diagram.description ?? "")}">
<meta name="generator" content="Diagram Studio">
<style>
  :root{color-scheme:${theme.mode === "dark" ? "dark" : "light"}}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:40px;
       background:${theme.paper};color:${theme.ink};
       font:16px/1.6 Inter,system-ui,-apple-system,'Segoe UI',sans-serif}
  figure{margin:0;max-width:100%;display:grid;gap:20px;justify-items:start}
  svg{max-width:100%;height:auto;display:block}
  figcaption{max-width:72ch;color:${theme.muted};font-size:14px}
  .meta{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;
        text-transform:uppercase;color:${theme.soft ?? theme.muted}}
${stepped ? MOTION_CONTROL_CSS : ""}
</style>
</head>
<body>
<figure data-motion-figure>
  <p class="meta">${esc(type.label)} · ${esc(variant.label)} · ${diagram.width}×${diagram.height}</p>
  ${svg}
  <figcaption>${esc(diagram.description ?? "")} ${esc(variant.note)}</figcaption>
  ${stepped ? motionControls(stepTotal(svg)) : ""}
</figure>
${stepped ? `<script>${motionController()}</script>` : ""}
</body>
</html>
`;
}

/** The index that ties the library together. */
function indexPage(entries) {
  const rows = DIAGRAM_TYPES.map((type) => {
    const links = VARIANTS.map(
      (variant) => `<a href="example-${type.id}-${variant.id}.html">${variant.id}</a>`,
    ).join(" · ");
    return `<tr><td><b>${esc(type.label)}</b><br><span class="muted">${esc(type.description)}</span></td><td class="links">${links}</td></tr>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagram Studio — example library</title>
<style>
  :root{--paper:#f3f0e9;--ink:#1d211f;--muted:#5f665f;--hair:#c3bfb5;--accent:#c2452a}
  body{margin:0;padding:48px;background:var(--paper);color:var(--ink);
       font:16px/1.6 Inter,system-ui,sans-serif;max-width:86ch}
  h1{font:400 44px/1.1 'Instrument Serif',Georgia,serif;margin:0 0 8px}
  p.lede{color:var(--muted);margin:0 0 8px;max-width:70ch}
  p.note{color:var(--muted);font-size:14px;margin:0 0 32px;max-width:70ch}
  table{width:100%;border-collapse:collapse}
  td{padding:12px 8px 12px 0;border-bottom:1px solid var(--hair);vertical-align:top}
  .muted{color:var(--muted);font-size:13px}
  .links{text-align:right;font:12px ui-monospace,monospace;white-space:nowrap}
  a{color:var(--accent)}
  dl{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin:0 0 32px;
     font-size:14px;border-left:2px solid var(--accent);padding-left:16px}
  dt{font:12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em}
  dd{margin:0;color:var(--muted)}
</style>
</head>
<body>
<h1>Example library</h1>
<p class="lede">${DIAGRAM_TYPES.length} diagram types in ${VARIANTS.length} delivery variants — ${entries} self-contained files. Each opens offline with no build step, no JavaScript unless the diagram is stepped, and no network request.</p>
<p class="note">Generated by <code>scripts/build-examples.mjs</code> from the same engine the studio and the CLI use. <code>scripts/verify-examples.mjs</code> fails the build if any file drifts from it, so an example can never show a skin the code has moved on from.</p>
<dl>
${VARIANTS.map((variant) => `<dt>${variant.id}</dt><dd>${esc(variant.note)}</dd>`).join("\n")}
</dl>
<table>
${rows}
</table>
</body>
</html>
`;
}

export function allExamples() {
  const files = [];
  for (const type of DIAGRAM_TYPES) {
    for (const variant of VARIANTS) {
      files.push({ name: `example-${type.id}-${variant.id}.html`, content: examplePage(getType(type.id), variant) });
    }
  }
  return files;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  // Clear stale examples so a removed type cannot leave an orphan behind.
  for (const file of await readdir(outDir)) {
    if (file.startsWith("example-") && file.endsWith(".html")) await rm(join(outDir, file));
  }

  const files = allExamples();
  for (const file of files) await writeFile(join(outDir, file.name), file.content, "utf8");
  await writeFile(join(outDir, "index.html"), indexPage(files.length), "utf8");

  console.log(
    `wrote ${files.length} examples (${DIAGRAM_TYPES.length} types × ${VARIANTS.length} variants) and an index to skills/create-editorial-diagrams/assets/`,
  );
}

if (process.argv[1]?.endsWith("build-examples.mjs")) main();
