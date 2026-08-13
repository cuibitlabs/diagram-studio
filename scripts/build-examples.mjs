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
      diagram.theme = paletteOf("plate");
    },
  },
  {
    id: "dark",
    label: "Minimal dark",
    note: "A separately audited dark palette, not an inverted light one.",
    apply: (diagram) => {
      diagram.theme = paletteOf("graphite");
    },
  },
  {
    id: "full",
    label: "Full plate",
    note: "Title on the canvas and the plate furniture: the rules, the spec line, and module ticks at the 4 px grid the engine snaps to.",
    apply: (diagram) => {
      diagram.theme = paletteOf("plate");
      diagram.settings.showTitle = true;
      diagram.settings.plate = true;
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

/**
 * One self-contained example page, set as a drawing plate rather than an
 * article: a sheet on a table, a title block underneath, and a module ruler
 * down the left edge at the real 4 px spacing the engine snaps to. The ruler is
 * the one loud element; everything else stays quiet.
 */
export function examplePage(type, variant) {
  const diagram = createDiagram(type.id);
  variant.apply(diagram);
  const svg = buildSVG(diagram, { interactive: false, uid: `${type.id}-${variant.id}` });
  const theme = diagram.theme;
  const stepped = isStepped(diagram);

  const block = [
    ["Type", type.label],
    ["Family", type.family],
    ["Sheet", variant.label],
    ["Canvas", `${diagram.width} × ${diagram.height}`],
    ["Census", `${diagram.nodes.length} elements · ${diagram.edges.length} connections`],
    ["Module", "4 px"],
  ];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(diagram.title)} — ${esc(variant.label)}</title>
<meta name="description" content="${esc(diagram.description ?? "")}">
<meta name="generator" content="Diagram Studio">
<style>
  :root{
    color-scheme:${theme.mode === "dark" ? "dark" : "light"};
    --paper:${theme.paper}; --sheet:${theme.panel}; --ink:${theme.ink};
    --muted:${theme.muted}; --soft:${theme.soft ?? theme.muted};
    --rule:${theme.line}; --accent:${theme.accent};
    --mono:ui-monospace,SFMono-Regular,'Geist Mono',Menlo,monospace;
    --sans:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;
    --serif:'Instrument Serif',ui-serif,Georgia,serif;
  }
  *{box-sizing:border-box}
  body{margin:0;padding:clamp(20px,5vw,64px) clamp(16px,4vw,56px);
       background:var(--paper);color:var(--ink);font:16px/1.6 var(--sans)}
  .plate{max-width:min(100%,1280px);margin:0 auto;display:grid;
         grid-template-columns:20px minmax(0,1fr);gap:0 clamp(16px,3vw,32px)}

  /* The module ruler: 4px ticks, every fourth one long. Same grid the engine
     enforces, so the page and the drawing agree about what a unit is. */
  .ruler{border-left:1px solid var(--rule);
         background:repeating-linear-gradient(to bottom,
           var(--rule) 0 1px, transparent 1px 4px);
         opacity:.55;border-radius:1px}
  .ruler::after{content:"";display:block;width:9px;height:100%;
         background:repeating-linear-gradient(to bottom,
           var(--accent) 0 1px, transparent 1px 16px)}

  header{grid-column:2;display:flex;flex-wrap:wrap;gap:8px 20px;
         align-items:baseline;justify-content:space-between;
         padding-bottom:10px;border-bottom:1px solid var(--rule)}
  .eyebrow{font:600 11px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase}
  .eyebrow.sheet{color:var(--soft)}
  h1{grid-column:2;font:400 clamp(28px,4vw,42px)/1.1 var(--serif);
     margin:24px 0 6px;letter-spacing:-.01em}
  .standfirst{grid-column:2;margin:0 0 28px;max-width:66ch;color:var(--muted)}

  figure{grid-column:2;margin:0;padding:clamp(16px,3vw,32px);
         background:var(--sheet);border:1px solid var(--rule);overflow-x:auto}
  svg{max-width:100%;height:auto;display:block;margin:0 auto}

  .titleblock{grid-column:2;margin:24px 0 0;display:grid;
              grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
              gap:0;border-top:1px solid var(--rule)}
  .titleblock div{padding:12px 16px 12px 0;border-bottom:1px solid var(--rule)}
  .titleblock dt{font:600 10px/1.4 var(--mono);letter-spacing:.12em;
                 text-transform:uppercase;color:var(--soft);margin:0 0 2px}
  .titleblock dd{margin:0;font:13px/1.4 var(--mono)}
  .note{grid-column:2;margin:20px 0 0;max-width:66ch;color:var(--muted);font-size:14px}
  a{color:var(--accent)}
  a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  @media (max-width:640px){.plate{grid-template-columns:1fr}.ruler{display:none}
    header,h1,.standfirst,figure,.titleblock,.note{grid-column:1}}
  @media print{.ruler{display:none}figure{border-color:#999}}
${stepped ? MOTION_CONTROL_CSS : ""}
</style>
</head>
<body>
<div class="plate">
  <div class="ruler" aria-hidden="true"></div>
  <header>
    <span class="eyebrow">${esc(type.label)}</span>
    <span class="eyebrow sheet">${esc(variant.label)} · ${diagram.width}×${diagram.height}</span>
  </header>
  <h1>${esc(diagram.title)}</h1>
  <p class="standfirst">${esc(diagram.description ?? "")}</p>
  <figure data-motion-figure>
    ${svg}
    ${stepped ? motionControls(stepTotal(svg)) : ""}
  </figure>
  <dl class="titleblock">
${block.map(([term, value]) => `    <div><dt>${esc(term)}</dt><dd>${esc(value)}</dd></div>`).join("\n")}
  </dl>
  <p class="note">${esc(variant.note)} <a href="index.html">All sheets</a></p>
</div>
${stepped ? `<script>${motionController()}</script>` : ""}
</body>
</html>
`;
}

/**
 * The index, set as a drawing register rather than a marketing page: a numbered
 * schedule of plates and the sheets each one has. The numbering is real — it is
 * the order the library is generated in, and it is how you find a plate.
 */
function indexPage(entries) {
  const theme = paletteOf("plate");

  const rows = DIAGRAM_TYPES.map((type, index) => {
    const links = VARIANTS.map(
      (variant) => `<a href="example-${type.id}-${variant.id}.html">${variant.id}</a>`,
    ).join("<span class=\"sep\">·</span>");
    return `      <tr>
        <td class="no">${String(index + 1).padStart(2, "0")}</td>
        <td class="name"><b>${esc(type.label)}</b><span class="job">${esc(type.description)}</span></td>
        <td class="family">${esc(type.family)}</td>
        <td class="sheets">${links}</td>
      </tr>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagram Studio — plate register</title>
<meta name="description" content="${DIAGRAM_TYPES.length} diagram types in ${VARIANTS.length} delivery sheets: ${entries} self-contained pages.">
<style>
  :root{
    --paper:${theme.paper}; --sheet:${theme.panel}; --ink:${theme.ink};
    --muted:${theme.muted}; --soft:${theme.soft}; --rule:${theme.line};
    --accent:${theme.accent}; --accent2:${theme.accent2};
    --mono:ui-monospace,SFMono-Regular,'Geist Mono',Menlo,monospace;
    --sans:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;
    --serif:'Instrument Serif',ui-serif,Georgia,serif;
    color-scheme:light;
  }
  *{box-sizing:border-box}
  body{margin:0;padding:clamp(20px,5vw,64px) clamp(16px,4vw,56px);
       background:var(--paper);color:var(--ink);font:16px/1.6 var(--sans)}
  .plate{max-width:min(100%,1120px);margin:0 auto;display:grid;
         grid-template-columns:20px minmax(0,1fr);gap:0 clamp(16px,3vw,32px)}
  .ruler{border-left:1px solid var(--rule);
         background:repeating-linear-gradient(to bottom,var(--rule) 0 1px,transparent 1px 4px);
         opacity:.55}
  .ruler::after{content:"";display:block;width:9px;height:100%;
         background:repeating-linear-gradient(to bottom,var(--accent) 0 1px,transparent 1px 16px)}

  header,h1,.lede,.legend,table,.colophon{grid-column:2}
  header{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:baseline;
         justify-content:space-between;padding-bottom:10px;border-bottom:1px solid var(--rule)}
  .eyebrow{font:600 11px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase}
  .eyebrow.count{color:var(--soft)}
  h1{font:400 clamp(32px,5vw,52px)/1.05 var(--serif);margin:28px 0 8px;letter-spacing:-.015em}
  .lede{margin:0 0 32px;max-width:64ch;color:var(--muted)}

  .legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
          gap:0;margin:0 0 40px;border-top:1px solid var(--rule)}
  .legend div{padding:12px 20px 12px 0;border-bottom:1px solid var(--rule)}
  .legend dt{font:600 10px/1.4 var(--mono);letter-spacing:.12em;text-transform:uppercase;
             color:var(--accent);margin:0 0 3px}
  .legend dd{margin:0;font-size:13px;color:var(--muted);line-height:1.45}

  table{width:100%;border-collapse:collapse}
  th{font:600 10px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;
     color:var(--soft);text-align:left;padding:0 12px 10px 0;border-bottom:1px solid var(--rule)}
  td{padding:14px 12px 14px 0;border-bottom:1px solid var(--rule);vertical-align:baseline}
  .no{font:13px var(--mono);color:var(--soft);width:3ch}
  .name b{font-weight:650}
  .name .job{display:block;font-size:13px;color:var(--muted);line-height:1.4}
  .family{font:12px var(--mono);color:var(--accent2);white-space:nowrap}
  .sheets{text-align:right;font:12px var(--mono);white-space:nowrap}
  .sheets .sep{color:var(--rule);padding:0 6px}
  a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:3px}
  a:hover{text-decoration-thickness:2px}
  a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .colophon{margin:36px 0 0;font-size:13px;color:var(--muted);max-width:64ch}
  code{font:12px var(--mono);color:var(--ink)}
  @media (max-width:720px){
    .plate{grid-template-columns:1fr}.ruler{display:none}
    header,h1,.lede,.legend,table,.colophon{grid-column:1}
    .family{display:none}
    td,th{padding-right:8px}
    .sheets{text-align:left;padding-top:6px}
    tr{display:grid;grid-template-columns:3ch 1fr}
    .no{grid-row:1}.name{grid-row:1}.sheets{grid-column:2;border:0;padding-bottom:14px}
    td{border-bottom:0}tr{border-bottom:1px solid var(--rule)}
  }
</style>
</head>
<body>
<div class="plate">
  <div class="ruler" aria-hidden="true"></div>
  <header>
    <span class="eyebrow">Diagram Studio</span>
    <span class="eyebrow count">${DIAGRAM_TYPES.length} plates · ${VARIANTS.length} sheets each · ${entries} pages</span>
  </header>
  <h1>Plate register</h1>
  <p class="lede">Every diagram type in every way it ships. Each page opens offline: no build step, no network request, and no JavaScript unless the diagram steps.</p>

  <dl class="legend">
${VARIANTS.map((variant) => `    <div><dt>${variant.id}</dt><dd>${esc(variant.note)}</dd></div>`).join("\n")}
  </dl>

  <table>
    <thead><tr><th>№</th><th>Plate</th><th>Family</th><th>Sheets</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>

  <p class="colophon">Generated by <code>scripts/build-examples.mjs</code> from the engine the studio, the CLI and the MCP server all share. <code>scripts/verify-examples.mjs</code> regenerates every page in memory and fails the build on any difference, so a sheet here cannot show a skin the code has moved on from.</p>
</div>
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
