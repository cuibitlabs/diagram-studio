import assert from "node:assert/strict";
import test from "node:test";

import { align, distribute, duplicate, nodesInMarquee, selectionBounds, translate } from "../src/editor/selection.js";
import { SNAP, guideMarkup, snapToNeighbours } from "../src/editor/guides.js";
import { buildCommands, filterCommands, score } from "../src/editor/commands.js";
import { stepCount, stepsFor } from "../src/editor/present.js";
import { createDiagram } from "../src/model.js";

const node = (id, x, y, w = 160, h = 64) => ({ id, label: id, x, y, w, h });

test("marquee selects only the nodes it touches", () => {
  const nodes = [node("a", 0, 0), node("b", 400, 0), node("c", 0, 300)];
  assert.deepEqual(nodesInMarquee(nodes, { x1: -10, y1: -10, x2: 200, y2: 100 }), ["a"]);
  assert.deepEqual(nodesInMarquee(nodes, { x1: 200, y1: -10, x2: -10, y2: 400 }), ["a", "c"], "a backwards drag still selects");
  assert.deepEqual(nodesInMarquee(nodes, { x1: 900, y1: 900, x2: 1000, y2: 1000 }), []);
});

test("align snaps every node to the shared edge", () => {
  const nodes = [node("a", 10, 0), node("b", 90, 100), node("c", 50, 200)];
  const left = align(nodes, "left");
  assert.deepEqual(left.map((item) => item.x), [10, 10, 10]);

  const right = align(nodes, "right");
  assert.deepEqual(right.map((item) => item.x), [90, 90, 90]);

  const centred = align([node("a", 0, 0, 100), node("b", 0, 100, 200)], "centre-x");
  assert.equal(centred[0].x + 50, centred[1].x + 100);
});

test("align on the cross axis leaves the other coordinate alone", () => {
  const nodes = [node("a", 10, 0), node("b", 90, 100)];
  const top = align(nodes, "top");
  assert.deepEqual(top.map((item) => item.x), [10, 90]);
  assert.deepEqual(top.map((item) => item.y), [0, 0]);
});

test("align needs at least two nodes", () => {
  assert.deepEqual(align([node("a", 0, 0)], "left"), []);
});

test("distribute equalises gaps, not centres", () => {
  const nodes = [node("a", 0, 0, 100), node("b", 150, 0, 300), node("c", 800, 0, 100)];
  const spread = distribute(nodes, "horizontal");
  const byId = new Map(spread.map((item) => [item.id, item]));
  const gap1 = byId.get("b").x - (byId.get("a").x + 100);
  const gap2 = byId.get("c").x - (byId.get("b").x + 300);
  assert.ok(Math.abs(gap1 - gap2) <= 4, `gaps differ: ${gap1} vs ${gap2}`);
  assert.equal(byId.get("a").x, 0, "the first node does not move");
});

test("distribute needs at least three nodes", () => {
  assert.deepEqual(distribute([node("a", 0, 0), node("b", 100, 0)], "horizontal"), []);
});

test("translate snaps to the base grid", () => {
  const moved = translate([node("a", 0, 0)], 7, 11);
  assert.deepEqual(moved, [{ id: "a", x: 8, y: 12 }]);
});

test("duplicate copies internal edges only", () => {
  let counter = 0;
  const makeId = (prefix) => `${prefix}-${counter++}`;
  const nodes = [node("a", 0, 0), node("b", 200, 0)];
  const edges = [
    { id: "e1", source: "a", target: "b" },
    { id: "e2", source: "b", target: "outside" },
  ];
  const copy = duplicate(nodes, edges, makeId);
  assert.equal(copy.nodes.length, 2);
  assert.equal(copy.edges.length, 1, "an edge leaving the selection is not duplicated");
  assert.notEqual(copy.nodes[0].id, "a");
  assert.equal(copy.edges[0].source, copy.nodes[0].id);
  assert.equal(copy.nodes[0].x, 24, "copies are offset so they are visible");
});

test("selectionBounds pads the box and is null when empty", () => {
  assert.equal(selectionBounds([]), null);
  const bounds = selectionBounds([node("a", 100, 100)]);
  assert.equal(bounds.x, 92);
});

test("snapping pulls a near miss into alignment and reports a guide", () => {
  const others = [node("anchor", 100, 100)];
  const result = snapToNeighbours({ ...node("moving", 103, 300) }, others);
  assert.equal(result.x, 100, "left edges aligned");
  assert.ok(result.guides.some((guide) => guide.axis === "x" && guide.at === 100));
});

test("snapping ignores anything outside the threshold", () => {
  const others = [node("anchor", 100, 100)];
  const far = snapToNeighbours({ ...node("moving", 100 + SNAP.threshold + 4, 300) }, others);
  assert.equal(far.x, 100 + SNAP.threshold + 4);
  assert.deepEqual(far.guides, []);
});

test("snapping matches centres as well as edges", () => {
  const others = [node("anchor", 100, 100, 200, 80)];
  // anchor centre x is 200; a 160-wide box centred there starts at 120.
  const result = snapToNeighbours({ ...node("moving", 122, 400) }, others);
  assert.equal(result.x, 120);
});

test("palette scoring prefers substrings then word starts", () => {
  assert.ok(score("add", "Add node") > score("adn", "Add node"));
  assert.ok(score("adn", "Add node") > 0);
  assert.equal(score("zzz", "Add node"), 0);
  assert.equal(score("", "anything"), 1);
});

test("palette filtering ranks the obvious match first", () => {
  const commands = [
    { group: "Edit", label: "Add node" },
    { group: "Layout", label: "Align distribute nodes" },
    { group: "Export", label: "Export SVG" },
  ];
  assert.equal(filterCommands(commands, "add")[0].label, "Add node");
  assert.equal(filterCommands(commands, "svg")[0].label, "Export SVG");
  assert.deepEqual(filterCommands(commands, "qqq"), []);
});

test("commands that need a selection are hidden without one", () => {
  const noop = () => {};
  const actions = new Proxy({}, { get: () => noop });
  const none = buildCommands(actions, { selectionCount: 0, types: [], palettes: [] });
  assert.ok(!none.some((command) => command.id === "align-left"));
  assert.ok(!none.some((command) => command.id === "duplicate"));

  const two = buildCommands(actions, { selectionCount: 2, types: [], palettes: [] });
  assert.ok(two.some((command) => command.id === "align-left"));
  assert.ok(!two.some((command) => command.id === "distribute-h"), "distribute needs three");

  const three = buildCommands(actions, { selectionCount: 3, types: [], palettes: [] });
  assert.ok(three.some((command) => command.id === "distribute-h"));
});

test("commands include every type and palette offered", () => {
  const actions = new Proxy({}, { get: () => () => {} });
  const commands = buildCommands(actions, {
    selectionCount: 0,
    types: [{ id: "bar", label: "Bar chart", description: "" }],
    palettes: [{ id: "mono", name: "Monochrome" }],
  });
  assert.ok(commands.some((command) => command.id === "type-bar"));
  assert.ok(commands.some((command) => command.id === "palette-mono"));
});

test("presentation steps follow the graph rank, not model order", () => {
  const diagram = createDiagram("architecture");
  const steps = stepsFor(diagram);
  assert.equal(steps.get(diagram.nodes[0].id), 0);
  assert.ok(steps.get(diagram.nodes[3].id) > steps.get(diagram.nodes[1].id));
  assert.ok(stepCount(steps) >= 2);
});

test("a diagram with no edges steps one node at a time", () => {
  const diagram = createDiagram("timeline");
  const steps = stepsFor(diagram);
  assert.equal(stepCount(steps), diagram.nodes.length);
});

test("guide markup renders axis-aligned rules", () => {
  const markup = guideMarkup([{ axis: "x", at: 100, from: 0, to: 200 }, { axis: "y", at: 50, from: 0, to: 300 }]);
  assert.ok(markup.includes('d="M 100 0 V 200"'));
  assert.ok(markup.includes('d="M 0 50 H 300"'));
});
