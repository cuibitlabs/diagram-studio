import assert from "node:assert/strict";
import test from "node:test";

import { DIAGRAM_TYPES, createDiagram } from "../src/model.js";
import { buildSVG, uidFor } from "../src/render/svg.js";
import { rectOf, rectsOverlap } from "../src/engine/geom.js";
import { getRenderer } from "../src/types/index.js";

const ID_RE = /aria-labelledby="(d[a-z0-9]+)-title \1-desc"/;

test("every diagram type produces an accessible SVG with unique ids", () => {
  const seen = new Set();
  for (const type of DIAGRAM_TYPES) {
    const svg = buildSVG(createDiagram(type.id));
    assert.match(svg, /^<svg[^>]+role="img"/, type.id);
    const match = svg.match(ID_RE);
    assert.ok(match, `${type.id} is missing a prefixed aria-labelledby pair`);
    assert.match(svg, new RegExp(`<title id="${match[1]}-title">`), type.id);
    assert.match(svg, new RegExp(`<desc id="${match[1]}-desc">`), type.id);
    seen.add(match[1]);
  }
  assert.ok(seen.size > 1, "ids should differ between diagrams");
});

test("the canvas fits the drawing instead of a fixed 1200x760", () => {
  const small = createDiagram("venn");
  const large = createDiagram("er");
  const smallSVG = buildSVG(small);
  const largeSVG = buildSVG(large);
  assert.match(smallSVG, new RegExp(`viewBox="0 0 ${small.width} ${small.height}"`));
  assert.match(largeSVG, new RegExp(`viewBox="0 0 ${large.width} ${large.height}"`));
  assert.ok(small.width > 0 && small.height > 0);
});

test("the background rect always matches the viewBox", () => {
  for (const type of DIAGRAM_TYPES) {
    const diagram = createDiagram(type.id);
    const svg = buildSVG(diagram);
    assert.match(
      svg,
      new RegExp(`class="canvas-bg" x="0" y="0" width="${diagram.width}" height="${diagram.height}"`),
      type.id,
    );
  }
});

test("labels are escaped, not executed", () => {
  const diagram = createDiagram();
  diagram.nodes[0].label = '<script>alert("x")</script>';
  const svg = buildSVG(diagram);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
});

test("every node label reaches the output", () => {
  for (const type of DIAGRAM_TYPES) {
    const diagram = createDiagram(type.id);
    const svg = buildSVG(diagram);
    for (const node of diagram.nodes) {
      const first = node.label.split(/\s+/)[0];
      assert.ok(svg.includes(first), `${type.id}: "${node.label}" missing from output`);
    }
  }
});

test("no renderer invents a label that is not in the model", () => {
  // Regression guard: the previous renderer printed "SHARED MEMORY",
  // "HIGH VALUE" and fabricated week counts regardless of the model.
  const banned = ["SHARED MEMORY", "HIGH VALUE", "HIGH EFFORT", "Shared value", "Double-click to edit", "Milestone"];
  for (const type of DIAGRAM_TYPES) {
    const diagram = createDiagram(type.id);
    diagram.nodes.forEach((node, index) => {
      node.label = `Node ${index}`;
      delete node.sublabel;
    });
    for (const field of ["hub", "overlaps", "axes", "lanes", "horizons", "unit", "timeUnit", "seriesLabel", "groups"]) {
      delete diagram[field];
    }
    const svg = buildSVG(diagram);
    for (const phrase of banned) {
      assert.ok(!svg.includes(phrase), `${type.id} emitted "${phrase}" with no model source`);
    }
  }
});

test("nodes do not overlap in the graph families", () => {
  const families = ["layered", "hierarchy", "er"];
  for (const type of DIAGRAM_TYPES.filter((entry) => families.includes(entry.family))) {
    const diagram = createDiagram(type.id);
    buildSVG(diagram);
    const rects = diagram.nodes.map(rectOf);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        assert.equal(rectsOverlap(rects[i], rects[j]), false, `${type.id}: ${diagram.nodes[i].label} overlaps ${diagram.nodes[j].label}`);
      }
    }
  }
});

test("connectors in the graph families are orthogonal", () => {
  const families = ["layered", "hierarchy", "er", "swimlane"];
  for (const type of DIAGRAM_TYPES.filter((entry) => families.includes(entry.family))) {
    const diagram = createDiagram(type.id);
    const renderer = getRenderer(type.id);
    const ctx = {
      uid: uidFor(type.id),
      theme: diagram.theme,
      settings: diagram.settings,
      corner: 8,
      margin: { top: 96, right: 96, bottom: 96, left: 96 },
      interactive: false,
      selectedId: null,
    };
    const layout = renderer.layout(diagram, ctx);
    for (const [id, route] of layout.routes ?? []) {
      route.points.forEach((point, index) => {
        if (index === 0) return;
        const previous = route.points[index - 1];
        const orthogonal = Math.abs(point.x - previous.x) < 0.01 || Math.abs(point.y - previous.y) < 0.01;
        assert.ok(orthogonal, `${type.id} edge ${id} has a diagonal segment`);
      });
      assert.equal(route.hits, 0, `${type.id} edge ${id} crosses a node`);
    }
  }
});

test("rendering the same project twice gives identical output", () => {
  for (const type of DIAGRAM_TYPES) {
    const diagram = createDiagram(type.id);
    const first = buildSVG(diagram, { uid: "fixed" });
    const second = buildSVG(structuredClone(diagram), { uid: "fixed" });
    assert.equal(first, second, type.id);
  }
});
