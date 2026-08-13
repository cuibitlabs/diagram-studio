#!/usr/bin/env node
/**
 * Diagram Studio CLI.
 *
 * Runs the same engine the browser studio runs, so a diagram produced here is
 * byte-identical to the one the editor would draw from the same project. That
 * is the point: an agent can generate, an author can open the result and edit
 * it, and neither side has to re-render the other's work differently.
 *
 * Usage:
 *   diagram-studio create <type> [--title T] [--theme id] [-o out.svg]
 *   diagram-studio import <file> [-o out.svg]
 *   diagram-studio render <project.diagram.json> [-o out.svg]
 *   diagram-studio convert <in> <out>          format taken from the extension
 *   diagram-studio batch <dir> --out <dir> [--theme id] [--variants]
 *   diagram-studio brand <file.html|css> [-o theme.json]
 *   diagram-studio validate <project.diagram.json>
 *   diagram-studio audit <project.diagram.json>
 *   diagram-studio types
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

import { DIAGRAM_TYPES, createDiagram, createFromPrompt, hasType, reviewDiagram, validateDiagram } from "../src/model.js";
import { buildSVG } from "../src/render/svg.js";
import { parseMermaid, describeProvenance } from "../src/import/mermaid.js";
import { parseDrawio } from "../src/import/drawio.js";
import { toMermaid } from "../src/export/mermaid.js";
import { toDrawio } from "../src/export/drawio.js";
import { PALETTES, paletteOf } from "../src/theme/palettes.js";
import { auditTheme } from "../src/theme/contrast.js";
import { extractBrand, describeBrandReport } from "../src/theme/brand.js";
import { LEVELS, simplify } from "../src/edit/simplify.js";
import { describeDiff, diffProjects, stableRedraw } from "../src/edit/diff.js";
import { parse as parseDSL, stringify as stringifyDSL } from "../src/dsl/index.js";
import { toASCII } from "../src/export/ascii.js";

const IMPORTABLE = new Set([".mmd", ".mermaid", ".md", ".drawio", ".xml", ".json", ".ds"]);

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "-o") flags.out = argv[++i];
    else if (token.startsWith("--")) {
      const [key, inline] = token.slice(2).split("=");
      flags[key] = inline ?? (argv[i + 1] && !argv[i + 1].startsWith("-") ? argv[++i] : true);
    } else positional.push(token);
  }
  return { positional, flags };
}

const die = (message) => {
  console.error(`error: ${message}`);
  process.exit(1);
};

/** Import any supported source file into a project. */
async function loadProject(path) {
  const extension = extname(path).toLowerCase();
  if (!IMPORTABLE.has(extension)) die(`unsupported input "${extension}". Use .mmd, .drawio or .diagram.json`);
  const source = await readFile(path, "utf8");
  if (extension === ".json") {
    const parsed = JSON.parse(source);
    const errors = validateDiagram(parsed);
    if (errors.length) die(`invalid project: ${errors.join("; ")}`);
    return parsed;
  }
  if (extension === ".drawio" || extension === ".xml") return parseDrawio(source);
  if (extension === ".ds") return parseDSL(source);
  return parseMermaid(source);
}

function applyTheme(diagram, id) {
  if (!id) return diagram;
  if (!PALETTES[id]) die(`unknown theme "${id}". Available: ${Object.keys(PALETTES).join(", ")}`);
  diagram.theme = paletteOf(id);
  return diagram;
}

/** Serialise a project into whatever the output extension asks for. */
function serialise(diagram, path, options = {}) {
  switch (extname(path).toLowerCase()) {
    case ".svg":
      return buildSVG(diagram, { interactive: false, showTitle: options.title === true });
    case ".html": {
      const svg = buildSVG(diagram, { interactive: false, showTitle: true });
      return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${diagram.title}</title>\n<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:${diagram.theme.paper};padding:32px}svg{max-width:100%;height:auto}</style>\n</head>\n<body>\n${svg}\n</body>\n</html>\n`;
    }
    case ".mmd":
    case ".mermaid":
      return `${toMermaid(diagram).text}\n`;
    case ".drawio":
      return toDrawio(diagram);
    case ".ds":
      return stringifyDSL(diagram);
    case ".txt":
      return toASCII(diagram, options.width ? { width: Number(options.width) } : {});
    case ".json":
      return `${JSON.stringify(diagram, null, 2)}\n`;
    default:
      return die(`unsupported output "${extname(path)}". Use .svg, .html, .mmd, .drawio, .ds, .txt or .json`);
  }
}

const write = async (path, content) => {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, content, "utf8");
  console.log(`wrote ${path}`);
};

/* ------------------------------------------------------------- commands */

const commands = {
  async types() {
    const width = Math.max(...DIAGRAM_TYPES.map((type) => type.id.length));
    for (const type of DIAGRAM_TYPES) {
      console.log(`${type.id.padEnd(width)}  ${type.label.padEnd(22)} ${type.description}`);
    }
  },

  async create({ positional, flags }) {
    const type = positional[0] ?? "architecture";
    if (!hasType(type)) die(`unknown type "${type}". Run "diagram-studio types" for the list.`);
    const diagram = flags.prompt
      ? createFromPrompt(String(flags.prompt))
      : createDiagram(type, flags.title ? String(flags.title) : undefined);
    applyTheme(diagram, flags.theme);
    const out = String(flags.out ?? `${type}.svg`);
    await write(out, serialise(diagram, out, { title: flags.title !== undefined }));
  },

  async import({ positional, flags }) {
    const input = positional[0] ?? die("an input file is required");
    let diagram = applyTheme(await loadProject(input), flags.theme);

    // `--onto` re-imports a changed source without throwing away the layout the
    // author had already settled on.
    if (flags.onto) {
      const existing = await loadProject(String(flags.onto));
      const { diagram: merged, report } = stableRedraw(existing, diagram);
      diagram = merged;
      console.log(`stable redraw: ${report.kept} kept, ${report.added.length} added, ${report.removed.length} removed`);
      if (report.added.length) console.log(`  added: ${report.added.join(", ")}`);
      if (report.removed.length) console.log(`  removed: ${report.removed.join(", ")}`);
    }

    const out = String(flags.out ?? `${basename(input, extname(input))}.svg`);
    await write(out, serialise(diagram, out));
    if (diagram.provenance) console.log(describeProvenance(diagram.provenance));
  },

  async simplify({ positional, flags }) {
    const input = positional[0] ?? die("an input file is required");
    const level = flags.level ? String(flags.level) : "balanced";
    if (!LEVELS.includes(level)) die(`unknown level "${level}". Use ${LEVELS.join(", ")}.`);
    const { diagram, ledger } = simplify(await loadProject(input), { level });
    applyTheme(diagram, flags.theme);
    for (const line of ledger) console.log(line);
    const out = String(flags.out ?? `${basename(input, extname(input))}-${level}.svg`);
    await write(out, serialise(diagram, out));
  },

  async diff({ positional }) {
    const [before, after] = positional;
    if (!before || !after) die("usage: diagram-studio diff <before> <after>");
    const diff = diffProjects(await loadProject(before), await loadProject(after));
    console.log(describeDiff(diff));
    for (const node of diff.nodes.added) console.log(`  + ${node.label}`);
    for (const node of diff.nodes.removed) console.log(`  − ${node.label}`);
    for (const node of diff.nodes.changed) {
      if (node.fields.length) console.log(`  ~ ${node.label} (${node.fields.join(", ")})`);
    }
  },

  async render({ positional, flags }) {
    const input = positional[0] ?? die("a project file is required");
    const diagram = applyTheme(await loadProject(input), flags.theme);
    const out = String(flags.out ?? `${basename(input, extname(input))}.svg`);
    await write(out, serialise(diagram, out, { title: flags.title === true }));
  },

  async convert({ positional, flags }) {
    const [input, output] = positional;
    if (!input || !output) die("usage: diagram-studio convert <in> <out>");
    const diagram = applyTheme(await loadProject(input), flags.theme);
    await write(output, serialise(diagram, output));
  },

  /** A folder of sources becomes a folder of branded diagrams. */
  async batch({ positional, flags }) {
    const dir = positional[0] ?? die("a source directory is required");
    const outDir = String(flags.out ?? "out");
    const wanted = String(flags.format ?? "svg").replace(/^\./, "");
    const entries = (await readdir(dir)).filter((file) => IMPORTABLE.has(extname(file).toLowerCase()));
    if (!entries.length) die(`no importable files in ${dir}`);

    let ok = 0;
    for (const file of entries) {
      try {
        const diagram = applyTheme(await loadProject(join(dir, file)), flags.theme);
        const stem = basename(file, extname(file));
        if (flags.variants) {
          for (const [suffix, palette] of [["light", flags.theme ?? "editorial"], ["dark", "midnight"]]) {
            const variant = { ...diagram, theme: paletteOf(palette) };
            const out = join(outDir, `${stem}-${suffix}.${wanted}`);
            await write(out, serialise(variant, out));
          }
        } else {
          const out = join(outDir, `${stem}.${wanted}`);
          await write(out, serialise(diagram, out));
        }
        ok++;
      } catch (error) {
        console.error(`skipped ${file}: ${error.message}`);
      }
    }
    console.log(`batch: ${ok}/${entries.length} sources converted`);
  },

  async brand({ positional, flags }) {
    const input = positional[0] ?? die("an HTML or CSS file is required");
    const { theme, report } = extractBrand(await readFile(input, "utf8"), basename(input));
    console.log(describeBrandReport(report));
    for (const change of report.changes) {
      console.log(`  adjusted ${change.role}: ${change.from} → ${change.to} (${change.ratio}:1)`);
    }
    if (flags.out) await write(String(flags.out), `${JSON.stringify(theme, null, 2)}\n`);
    else console.log(JSON.stringify(theme, null, 2));
  },

  async validate({ positional }) {
    const diagram = await loadProject(positional[0] ?? die("a project file is required"));
    const errors = validateDiagram(diagram);
    if (errors.length) {
      for (const error of errors) console.error(`  ${error}`);
      process.exit(1);
    }
    console.log(`valid: ${diagram.nodes.length} nodes, ${diagram.edges.length} edges, type ${diagram.type}`);
  },

  async audit({ positional }) {
    const diagram = await loadProject(positional[0] ?? die("a project file is required"));
    buildSVG(diagram, { interactive: false });

    console.log(`${diagram.title} — ${diagram.type}, ${diagram.width}×${diagram.height}`);
    console.log("\nContrast");
    let failures = 0;
    for (const row of auditTheme(diagram.theme)) {
      const status = row.pass ? "pass" : row.decorative ? "note" : "FAIL";
      if (!row.pass && !row.decorative) failures++;
      console.log(`  ${status}  ${row.pair.padEnd(22)} ${String(row.ratio).padStart(6)}:1  (needs ${row.target}:1) ${row.note}`);
    }

    const notes = reviewDiagram(diagram);
    console.log("\nComposition");
    if (notes.length) for (const note of notes) console.log(`  ${note}`);
    else console.log("  within the composition budget");

    if (diagram.provenance) {
      console.log("\nProvenance");
      console.log(describeProvenance(diagram.provenance).split("\n").map((line) => `  ${line}`).join("\n"));
    }
    if (failures) process.exit(1);
  },
};

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h") {
    console.log(String.raw`Diagram Studio — the same engine as the browser studio.

  create <type>            new diagram from a type's starter content
    --prompt "…"           compose from a description instead
    --title "…"  --theme id  -o out.svg
  import <file>            .mmd, .mermaid, .md, .drawio, .xml, .diagram.json
    --onto <project.json>  keep the existing layout for everything that survived
  simplify <file>          editorial simplification with a fidelity ledger
    --level light|balanced|aggressive
  diff <before> <after>    what changed between two projects
  render <project.json>    redraw a saved project
  convert <in> <out>       format taken from the output extension
  batch <dir> --out <dir>  a folder of sources into a folder of diagrams
    --theme id --variants --format svg
  brand <file.html|css>    extract and contrast-repair a palette
  validate <project.json>  structural check
  audit <project.json>     contrast, composition and import fidelity report
  types                    list the ${DIAGRAM_TYPES.length} diagram types

Formats in: .ds .mmd .mermaid .md .drawio .xml .json
Formats out: .ds .svg .html .mmd .drawio .json .txt (box-drawing, for a README)`);
    return;
  }
  const handler = commands[command];
  if (!handler) die(`unknown command "${command}". Run with --help.`);
  await handler(parseArgs(rest));
}

main().catch((error) => die(error.message));
