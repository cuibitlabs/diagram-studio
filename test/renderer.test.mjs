import test from "node:test";
import assert from "node:assert/strict";
import { createDiagram, DIAGRAM_TYPES } from "../src/model.js";
import { buildSVG } from "../src/renderer.js";

test("every diagram family produces an accessible SVG", () => {
  for (const type of DIAGRAM_TYPES) {
    const svg = buildSVG(createDiagram(type.id));
    assert.match(svg, /^<svg[^>]+role="img"/, type.id);
    assert.match(svg, /aria-labelledby="diagram-title diagram-desc"/, type.id);
    assert.match(svg, /<title id="diagram-title">/, type.id);
    assert.match(svg, /<desc id="diagram-desc">/, type.id);
    assert.match(svg, /viewBox="0 0 1200 760"/, type.id);
  }
});

test("renderer escapes imported labels", () => {
  const diagram = createDiagram();
  diagram.nodes[0].label = '<script>alert("x")</script>';
  const svg = buildSVG(diagram);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
});
