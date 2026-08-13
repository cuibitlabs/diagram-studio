import assert from "node:assert/strict";
import test from "node:test";

import { sizeNodes } from "../src/engine/box.js";
import { rectsOverlap, rectOf } from "../src/engine/geom.js";
import {
  axisTicks,
  bands,
  forestOf,
  grid,
  layeredLayout,
  niceMax,
  radialTreeLayout,
  ringLayout,
  slots,
  ticks,
  treeLayout,
} from "../src/engine/layout/index.js";

const makeNodes = (labels) => {
  const nodes = labels.map((label, index) => ({ id: `n${index}`, label, x: 0, y: 0, w: 0, h: 0 }));
  sizeNodes(nodes);
  return nodes;
};

const chain = (nodes) => nodes.slice(0, -1).map((node, index) => ({ id: `e${index}`, source: node.id, target: nodes[index + 1].id }));

function assertNoOverlap(nodes) {
  const rects = nodes.map(rectOf);
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      assert.equal(rectsOverlap(rects[i], rects[j]), false, `${nodes[i].label} overlaps ${nodes[j].label}`);
    }
  }
}

test("layered layout advances along the flow direction", () => {
  const nodes = makeNodes(["Customer", "Web app", "API gateway", "Core service", "Database"]);
  const result = layeredLayout(nodes, chain(nodes), { direction: "LR" });
  for (let i = 1; i < nodes.length; i++) assert.ok(nodes[i].x > nodes[i - 1].x, `rank ${i} did not advance`);
  assertNoOverlap(nodes);
  assert.ok(result.width > 0 && result.height > 0);
});

test("layered layout stacks ranks downward for TB", () => {
  const nodes = makeNodes(["Commit", "Build", "Test", "Deploy"]);
  layeredLayout(nodes, chain(nodes), { direction: "TB" });
  for (let i = 1; i < nodes.length; i++) assert.ok(nodes[i].y > nodes[i - 1].y);
  assertNoOverlap(nodes);
});

test("layered layout puts diamond branches in one rank without overlap", () => {
  const nodes = makeNodes(["Request", "Validate", "Enrich", "Respond"]);
  const [a, b, c, d] = nodes;
  layeredLayout(nodes, [
    { id: "e1", source: a.id, target: b.id },
    { id: "e2", source: a.id, target: c.id },
    { id: "e3", source: b.id, target: d.id },
    { id: "e4", source: c.id, target: d.id },
  ], { direction: "LR" });
  assert.equal(b.x, c.x, "branches should share a rank");
  assert.ok(d.x > b.x);
  assertNoOverlap(nodes);
});

test("layered layout terminates on a cycle", () => {
  const nodes = makeNodes(["Plan", "Build", "Measure", "Learn"]);
  const edges = [...chain(nodes), { id: "back", source: nodes[3].id, target: nodes[0].id }];
  const result = layeredLayout(nodes, edges, { direction: "LR" });
  assert.equal(result.reversed.size, 1);
  assertNoOverlap(nodes);
});

test("layered layout leaves isolated nodes on the first rank", () => {
  const nodes = makeNodes(["Alpha", "Beta", "Orphan"]);
  layeredLayout(nodes, [{ id: "e1", source: nodes[0].id, target: nodes[1].id }], { direction: "LR" });
  assert.equal(nodes[2].x, nodes[0].x);
  assertNoOverlap(nodes);
});

test("forestOf assigns every child exactly one parent", () => {
  const nodes = makeNodes(["Platform", "Experience", "Services", "Web", "Mobile", "Data"]);
  const [platform, experience, services, web, mobile, data] = nodes;
  const { children, roots } = forestOf(nodes, [
    { id: "e1", source: platform.id, target: experience.id },
    { id: "e2", source: platform.id, target: services.id },
    { id: "e3", source: experience.id, target: web.id },
    { id: "e4", source: experience.id, target: mobile.id },
    { id: "e5", source: services.id, target: data.id },
  ]);
  assert.deepEqual(roots, [platform.id]);
  assert.deepEqual(children.get(experience.id), [web.id, mobile.id]);
  assert.deepEqual(children.get(services.id), [data.id]);
  const claimed = [...children.values()].flat();
  assert.equal(new Set(claimed).size, claimed.length, "a child was claimed twice");
});

test("tree layout centres a parent over its children", () => {
  const nodes = makeNodes(["CEO", "Product", "Engineering", "Design"]);
  const [ceo, ...reports] = nodes;
  treeLayout(nodes, reports.map((child, index) => ({ id: `e${index}`, source: ceo.id, target: child.id })), { direction: "TB" });
  const first = reports[0].x + reports[0].w / 2;
  const last = reports.at(-1).x + reports.at(-1).w / 2;
  const parent = ceo.x + ceo.w / 2;
  assert.ok(Math.abs(parent - (first + last) / 2) <= 2, `parent ${parent} not centred over ${first}..${last}`);
  for (const child of reports) assert.ok(child.y > ceo.y);
  assertNoOverlap(nodes);
});

test("tree layout keeps deep branches from colliding", () => {
  const nodes = makeNodes(["Root", "Left", "Right", "LeftA", "LeftB", "RightA", "RightB"]);
  const [root, left, right, la, lb, ra, rb] = nodes;
  treeLayout(nodes, [
    { id: "1", source: root.id, target: left.id },
    { id: "2", source: root.id, target: right.id },
    { id: "3", source: left.id, target: la.id },
    { id: "4", source: left.id, target: lb.id },
    { id: "5", source: right.id, target: ra.id },
    { id: "6", source: right.id, target: rb.id },
  ], { direction: "TB" });
  assertNoOverlap(nodes);
  assert.ok(lb.x + lb.w <= ra.x, "left subtree bleeds into the right subtree");
});

test("ring layout spaces a cycle evenly and clear of overlap", () => {
  const nodes = makeNodes(["Discover", "Decide", "Deliver", "Measure", "Learn"]);
  const ring = ringLayout(nodes, { origin: { x: 600, y: 400 } });
  assertNoOverlap(nodes);
  const radii = nodes.map((node) => Math.hypot(node.x + node.w / 2 - 600, node.y + node.h / 2 - 400));
  const spread = Math.max(...radii) - Math.min(...radii);
  assert.ok(spread < 2, `ring radii varied by ${spread}`);
  assert.ok(ring.radius > 0);
});

test("radial tree keeps the hub at the centre with branches around it", () => {
  const nodes = makeNodes(["Product", "People", "Process", "Technology", "Market"]);
  const [hub, ...spokes] = nodes;
  radialTreeLayout(nodes, spokes.map((spoke, index) => ({ id: `e${index}`, source: hub.id, target: spoke.id })), {
    origin: { x: 600, y: 400 },
  });
  assert.ok(Math.abs(hub.x + hub.w / 2 - 600) <= 2);
  assert.ok(Math.abs(hub.y + hub.h / 2 - 400) <= 2);
  assertNoOverlap(nodes);
});

test("bands fill the area exactly", () => {
  const area = { x: 100, y: 100, w: 800, h: 400 };
  const result = bands(4, area, { axis: "y", gap: 16 });
  assert.equal(result.length, 4);
  assert.equal(result[0].y, 100);
  const bottom = result.at(-1).y + result.at(-1).h;
  assert.ok(Math.abs(bottom - (area.y + area.h)) <= 4, `bands ended at ${bottom}`);
});

test("weighted bands respect their shares", () => {
  const result = bands(2, { x: 0, y: 0, w: 100, h: 300 }, { axis: "y", gap: 0, weights: [2, 1] });
  assert.ok(result[0].h > result[1].h * 1.8);
});

test("grid produces rows and columns inside the area", () => {
  const cells = grid(6, { x: 0, y: 0, w: 600, h: 400 }, { columns: 3, gapX: 20, gapY: 20 });
  assert.equal(cells.length, 6);
  assert.equal(cells[3].row, 1);
  assert.equal(cells[3].column, 0);
  assert.ok(cells.at(-1).x + cells.at(-1).w <= 600);
});

test("axis helpers place ticks and slots", () => {
  assert.deepEqual(ticks(3, 0, 100), [0, 50, 100]);
  assert.deepEqual(slots(2, 0, 100), [25, 75]);
  assert.equal(niceMax(37), 50);
  assert.equal(niceMax(0), 1);
  assert.deepEqual(axisTicks(80, 4), [0, 25, 50, 75, 100]);
});
