import assert from "node:assert/strict";
import test from "node:test";

import { FONT_MONO, ceilTo, layoutParagraph, measureText, wrapText } from "../src/engine/text.js";
import { countHits, inflate, rectOf, roundedPath, simplify } from "../src/engine/geom.js";
import { ROUTER_DEFAULTS, routeEdges } from "../src/engine/router.js";
import { edgeLabelBox, measureNodeBox, sizeNodes } from "../src/engine/box.js";

const node = (id, x, y, w = 160, h = 64, extra = {}) => ({ id, label: id, x, y, w, h, ...extra });

const isOrthogonal = (points) =>
  points.every((point, index) => {
    if (index === 0) return true;
    const previous = points[index - 1];
    return Math.abs(point.x - previous.x) < 0.01 || Math.abs(point.y - previous.y) < 0.01;
  });

test("text measurement is deterministic and scales with size", () => {
  assert.equal(measureText("", {}), 0);
  const small = measureText("Gateway", { size: 12 });
  const large = measureText("Gateway", { size: 24 });
  assert.ok(large > small * 1.9 && large < small * 2.1);
  assert.equal(measureText("abcd", { size: 10, family: FONT_MONO }), 24);
  assert.equal(measureText("Core", { size: 16 }), measureText("Core", { size: 16 }));
});

test("wide glyphs measure wider than narrow glyphs", () => {
  assert.ok(measureText("mmmm", { size: 16 }) > measureText("llll", { size: 16 }) * 2);
});

test("wrapText never exceeds the line box", () => {
  const style = { size: 16, weight: 700 };
  const lines = wrapText("Customer identity and access management service", 200, style);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(measureText(line, style) <= 200);
});

test("wrapText hard-breaks a word longer than the box", () => {
  const lines = wrapText("supercalifragilisticexpialidocious", 60, { size: 16 });
  assert.ok(lines.length > 1);
});

test("layoutParagraph reports truncation instead of silently clipping", () => {
  const long = "One two three four five six seven eight nine ten eleven twelve";
  const clamped = layoutParagraph(long, 120, { size: 14 }, 2);
  assert.equal(clamped.lines.length, 2);
  assert.equal(clamped.truncated, true);
  assert.ok(clamped.lines[1].endsWith("…"));

  const short = layoutParagraph("API gateway", 200, { size: 14 }, 3);
  assert.equal(short.truncated, false);
});

test("node boxes size to their content and stay on the 4px grid", () => {
  const small = measureNodeBox({ label: "API" });
  const wide = measureNodeBox({ label: "Customer identity and access management" });
  assert.ok(wide.w >= small.w);
  assert.equal(wide.w % 4, 0);
  assert.equal(wide.h % 4, 0);
  assert.ok(small.h >= 64);

  const withSub = measureNodeBox({ label: "API", sublabel: "REST · 443" });
  assert.ok(withSub.h > small.h);
});

test("sizeNodes respects fixedSize and reports truncation", () => {
  const nodes = [
    { id: "a", label: "Short", w: 10, h: 10 },
    { id: "b", label: "Pinned", w: 300, h: 40, fixedSize: true },
  ];
  sizeNodes(nodes);
  assert.ok(nodes[0].w >= 160);
  assert.equal(nodes[1].w, 300);
});

test("edgeLabelBox returns null for blank labels", () => {
  assert.equal(edgeLabelBox("   "), null);
  assert.ok(edgeLabelBox("signal").w > 0);
});

test("ceilTo snaps up to the base grid", () => {
  assert.equal(ceilTo(161), 164);
  assert.equal(ceilTo(160), 160);
});

test("simplify collapses collinear runs", () => {
  const points = simplify([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 30 },
  ]);
  assert.equal(points.length, 3);
});

test("roundedPath emits arcs at corners and no diagonal line commands", () => {
  const d = roundedPath([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ], 8);
  assert.ok(d.includes("Q"));
  assert.ok(d.startsWith("M 0 0"));
});

test("routes are orthogonal and land on node borders", () => {
  const nodes = [node("a", 0, 0), node("b", 400, 0)];
  const routes = routeEdges([{ id: "e1", source: "a", target: "b" }], nodes);
  const route = routes.get("e1");
  assert.ok(route);
  assert.ok(isOrthogonal(route.points));
  assert.equal(route.points[0].x, 160);
  assert.equal(route.points.at(-1).x, 400);
  assert.equal(route.hits, 0);
});

test("routes bend around an obstacle instead of crossing it", () => {
  const nodes = [node("a", 0, 200), node("blocker", 240, 180, 160, 104), node("b", 600, 200)];
  const routes = routeEdges([{ id: "e1", source: "a", target: "b" }], nodes);
  const route = routes.get("e1");
  assert.ok(isOrthogonal(route.points));
  assert.equal(route.hits, 0, `route crossed a node: ${JSON.stringify(route.points)}`);

  const obstacle = inflate(rectOf(nodes[1]), ROUTER_DEFAULTS.clearance);
  assert.equal(countHits(route.points, [obstacle]), 0);
});

test("connectors sharing a side are spread apart", () => {
  const nodes = [
    node("hub", 400, 200, 200, 120),
    node("a", 0, 0),
    node("b", 0, 200),
    node("c", 0, 400),
  ];
  const edges = [
    { id: "e1", source: "a", target: "hub" },
    { id: "e2", source: "b", target: "hub" },
    { id: "e3", source: "c", target: "hub" },
  ];
  const routes = routeEdges(edges, nodes);
  const attach = edges
    .map((edge) => routes.get(edge.id).points.at(-1))
    .filter((point) => Math.abs(point.x - 400) < 0.01)
    .map((point) => point.y)
    .sort((first, second) => first - second);

  assert.ok(attach.length >= 2, "expected shared-side attach points");
  for (let i = 1; i < attach.length; i++) {
    assert.ok(attach[i] - attach[i - 1] >= ROUTER_DEFAULTS.portGap - 0.01, `gap ${attach[i] - attach[i - 1]} too small`);
  }
});

test("self loops stay outside the node", () => {
  const nodes = [node("a", 100, 100)];
  const routes = routeEdges([{ id: "loop", source: "a", target: "a" }], nodes);
  const route = routes.get("loop");
  assert.ok(isOrthogonal(route.points));
  assert.ok(route.points.some((point) => point.x > 260));
});

test("routing is stable across runs", () => {
  const nodes = [node("a", 0, 0), node("b", 300, 240), node("c", 600, 0)];
  const edges = [
    { id: "e1", source: "a", target: "b" },
    { id: "e2", source: "b", target: "c" },
  ];
  const first = routeEdges(edges, nodes);
  const second = routeEdges(edges, nodes);
  assert.equal(first.get("e1").d, second.get("e1").d);
  assert.equal(first.get("e2").d, second.get("e2").d);
});
