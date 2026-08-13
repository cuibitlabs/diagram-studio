import assert from "node:assert/strict";
import test from "node:test";

import { extractBrandFromHTML, parseMermaid, parseProject } from "../src/importers.js";
import { collectColors, collectTokens, extractBrand, seededBrand } from "../src/theme/brand.js";
import { auditTheme } from "../src/theme/contrast.js";
import { saturationOf } from "../src/theme/color.js";

test("imports Mermaid flowcharts", () => {
  const diagram = parseMermaid("flowchart LR\n A[Idea] --> B[Prototype]\n B --> C[Launch]");
  assert.equal(diagram.nodes.length, 3);
  assert.equal(diagram.edges.length, 2);
  assert.equal(diagram.nodes[1].label, "Prototype");
});

test("imports Mermaid sequences", () => {
  const diagram = parseMermaid("sequenceDiagram\n participant U as User\n participant A as API\n U->>A: Request\n A->>U: Response");
  assert.equal(diagram.type, "sequence");
  assert.equal(diagram.edges.length, 2);
});

test("an import inherits no starter content from its type", () => {
  const diagram = parseMermaid("flowchart LR\n A[Only node] --> B[Second]");
  assert.equal(diagram.nodes.length, 2);
  assert.equal(diagram.groups, undefined);
  assert.equal(diagram.axes, undefined);
  // Geometry is left to the layout engine rather than baked in by the importer.
  assert.equal(diagram.nodes[0].w, 0);
});

test("parseProject rejects anything that is not a project", () => {
  assert.throws(() => parseProject('{"hello":true}'), /not a Diagram Studio project/);
});

test("collects colours in every syntax and counts repeats", () => {
  const counts = collectColors("a{color:#ff0000}b{color:rgb(255,0,0)}c{color:#00f}");
  assert.equal(counts.get("#ff0000"), 2);
  assert.equal(counts.get("#0000ff"), 1);
});

test("custom properties are mapped to roles by name", () => {
  const tokens = collectTokens(":root{--brand-primary:#2f62d6;--surface-card:#fbfbfd;--text-strong:#101828}");
  assert.equal(tokens.get("accent"), "#2f62d6");
  assert.equal(tokens.get("panel"), "#fbfbfd");
  assert.equal(tokens.get("ink"), "#101828");
});

test("brand extraction classifies by role, not by document order", () => {
  // The first colour in the source is a near-black body colour; the accent is
  // the saturated link colour that appears later.
  const { theme } = extractBrandFromHTML("<style>body{color:#112233;font-family:'Acme',sans-serif}a{color:#ee5533}</style>");
  assert.equal(theme.ink, "#112233");
  assert.equal(theme.accent, "#ee5533");
  assert.equal(theme.font, "Acme");
  assert.ok(saturationOf(theme.accent) > saturationOf(theme.ink));
});

test("brand extraction prefers design tokens over ad-hoc values", () => {
  const { theme } = extractBrand(":root{--color-primary:#7a1fa2}.promo{color:#ff9900}.promo2{color:#ff9900}");
  assert.equal(theme.accent, "#7a1fa2");
});

test("an extracted theme always meets the contrast contract", () => {
  const sources = [
    "<style>body{background:#fff;color:#999}a{color:#ffe08a}</style>",
    ":root{--bg:#0b0b0c;--text:#e8e8ea;--primary:#3b82f6}",
    "<style>body{background:#ffffff;color:#000000}a{color:#0000ee}</style>",
  ];
  for (const source of sources) {
    const { theme, report } = extractBrand(source);
    for (const row of auditTheme(theme)) {
      if (row.decorative) continue;
      assert.ok(row.pass, `${source}: ${row.pair} is ${row.ratio}:1, needs ${row.target}:1`);
    }
    assert.deepEqual(report.unresolved, []);
  }
});

test("the domain fallback is deterministic and accessible", () => {
  const first = seededBrand("example.com");
  const second = seededBrand("example.com");
  assert.deepEqual(first.theme, second.theme);
  assert.notDeepEqual(first.theme, seededBrand("other.example").theme);
  assert.equal(first.report.source, "domain-derived");
  for (const row of auditTheme(first.theme)) {
    if (row.decorative) continue;
    assert.ok(row.pass, `${row.pair} is ${row.ratio}:1`);
  }
});
