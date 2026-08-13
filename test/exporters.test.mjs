import assert from "node:assert/strict";
import test from "node:test";

import { createDiagram } from "../src/model.js";
import { htmlDocument, renderForExport, slug } from "../src/exporters.js";

test("slug produces a safe filename", () => {
  assert.equal(slug("Customer Journey: Q1 / Q2"), "customer-journey-q1-q2");
  assert.equal(slug(""), "diagram");
  assert.equal(slug(null), "diagram");
});

test("export output drops editor affordances but keeps semantics", () => {
  const diagram = createDiagram("architecture");
  const svg = renderForExport(diagram);
  assert.match(svg, /role="img"/);
  assert.match(svg, /<title id="/);
  assert.ok(svg.includes("data-node-id"), "node identity is kept for round-tripping");
  assert.doesNotMatch(svg, /NaN|undefined/);
});

test("no diagram type emits NaN or undefined into its output", () => {
  for (const type of ["architecture", "sequence", "gantt", "radar", "venn", "journey", "scatter", "swimlane", "er", "matrix"]) {
    const svg = renderForExport(createDiagram(type));
    assert.doesNotMatch(svg, /NaN/, type);
    assert.doesNotMatch(svg, /="undefined"/, type);
  }
});

test("html export is self-contained and carries the description", () => {
  const diagram = createDiagram("flowchart");
  const html = htmlDocument(diagram);
  assert.match(html, /^<!doctype html>/);
  assert.ok(html.includes("<svg"));
  assert.ok(html.includes(diagram.description));
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /src="http/);
});

test("export ids are stable for the same project", () => {
  const diagram = createDiagram("tree");
  assert.equal(renderForExport(diagram), renderForExport(diagram));
});
