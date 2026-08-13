import assert from "node:assert/strict";
import test from "node:test";

import { createDiagram } from "../src/model.js";
import { auditReport, readingOrder, toReport } from "../src/export/report.js";
import { toDiffSVG } from "../src/export/diffview.js";
import { normaliseDeck, toDeckHTML, toDeckPPTX } from "../src/export/deck.js";
import { parseMermaid } from "../src/import/mermaid.js";

test("reading order follows the graph, not the model order", () => {
  const diagram = createDiagram("architecture");
  const order = readingOrder(diagram);
  assert.equal(order.length, diagram.nodes.length);
  assert.equal(order[0].step, 0);
  for (let i = 1; i < order.length; i++) assert.ok(order[i].step >= order[i - 1].step);
});

test("reading order falls back to model order without connections", () => {
  const diagram = createDiagram("layers");
  const order = readingOrder(diagram);
  assert.deepEqual(order.map((node) => node.label), diagram.nodes.map((node) => node.label));
});

test("the audit reports zero issues for a shipped palette", () => {
  const report = auditReport(createDiagram("architecture"));
  assert.equal(report.issues, 0);
  assert.ok(report.contrast.every((row) => row.pass));
  assert.ok(report.altText.startsWith("Architecture overview"));
});

test("the audit counts contrast and composition problems", () => {
  const diagram = createDiagram("architecture");
  diagram.theme.muted = diagram.theme.panel;
  for (const node of diagram.nodes) node.tone = "accent";
  const report = auditReport(diagram);
  assert.ok(report.issues >= 2);
});

test("the report is self-contained and states what is announced", () => {
  const html = toReport(createDiagram("flowchart"));
  assert.match(html, /^<!doctype html>/);
  assert.ok(html.includes("Announced name"));
  assert.ok(html.includes("Reading order"));
  assert.ok(html.includes("Contrast"));
  assert.ok(html.includes("<svg"));
  assert.doesNotMatch(html, /src="http/);
});

test("the report carries the import ledger when there is one", () => {
  const diagram = parseMermaid("flowchart LR\n A[One] --> B[Two]");
  const html = toReport(diagram);
  assert.ok(html.includes("Provenance"));
  assert.ok(html.includes("2 source nodes"));
});

test("the visual diff marks additions, removals and edits", () => {
  const before = createDiagram("architecture");
  const after = structuredClone(before);
  after.nodes[0].label = "Renamed";
  after.nodes.push({ id: "new-node", label: "New thing", x: 0, y: 0, w: 0, h: 0 });
  const removed = after.nodes.splice(2, 1)[0];

  const { svg, diff } = toDiffSVG(before, after);
  assert.equal(diff.nodes.added.length, 1);
  assert.equal(diff.nodes.removed.length, 1);
  assert.ok(diff.nodes.changed.some((node) => node.fields.includes("label")));

  assert.ok(svg.includes("diff-mark added"));
  assert.ok(svg.includes("diff-ghost"), "the removed node is drawn as a ghost");
  assert.ok(svg.includes(removed.label), "the removed node is still named");
  assert.match(svg, /<\/svg>$/);
});

test("an unchanged pair produces a diff with no marks", () => {
  const diagram = createDiagram("tree");
  const { svg, diff } = toDiffSVG(diagram, structuredClone(diagram));
  assert.equal(diff.nodes.added.length, 0);
  assert.equal(diff.nodes.removed.length, 0);
  assert.ok(!svg.includes("diff-mark added"));
});

test("a deck applies one theme to every diagram", () => {
  const deck = normaliseDeck({
    title: "Review",
    theme: createDiagram("architecture", undefined).theme,
    diagrams: [createDiagram("architecture"), createDiagram("flowchart")],
  });
  const accents = new Set(deck.diagrams.map((diagram) => diagram.theme.accent));
  assert.equal(accents.size, 1, "a deck cannot drift into mismatched palettes");
});

test("the deck html is a document first and a presentation second", () => {
  const html = toDeckHTML({
    title: "Platform review",
    description: "Overview then detail",
    diagrams: [createDiagram("high-level"), createDiagram("architecture")],
  });
  assert.match(html, /^<!doctype html>/);
  assert.equal((html.match(/class="slide"/g) ?? []).length, 2);
  assert.ok(html.includes("Platform review"));
  // Without the presenting class every slide is visible, so it still reads
  // with JavaScript disabled.
  assert.ok(html.includes("body.presenting .slide"));
  assert.ok(html.includes("@media print"));
});

test("the deck pptx has one slide per diagram", () => {
  const bytes = Buffer.from(
    toDeckPPTX({ title: "Review", diagrams: [createDiagram("architecture"), createDiagram("flowchart"), createDiagram("venn")] }),
  );
  for (const slide of ["slide1.xml", "slide2.xml", "slide3.xml"]) {
    assert.ok(bytes.includes(Buffer.from(`ppt/slides/${slide}`)), `${slide} is missing`);
  }
  const text = bytes.toString("latin1");
  assert.equal((text.match(/<p:sldId /g) ?? []).length, 3);
  assert.ok(text.includes("Architecture overview"));
  assert.ok(text.includes("Venn overview"));
});

test("a single-diagram pptx is still a one-slide deck", () => {
  const bytes = Buffer.from(toDeckPPTX({ diagrams: [createDiagram("bar")] }));
  const text = bytes.toString("latin1");
  assert.equal((text.match(/<p:sldId /g) ?? []).length, 1);
  assert.ok(!text.includes("slide2.xml"));
});
