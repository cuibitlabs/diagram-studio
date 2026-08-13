import assert from "node:assert/strict";
import test from "node:test";

import { createDiagram, makeId, validateDiagram } from "../src/model.js";
import { parseMermaid } from "../src/import/mermaid.js";
import { simplify } from "../src/edit/simplify.js";
import { describeDiff, diffProjects, matchNodes, stableRedraw } from "../src/edit/diff.js";
import { buildSVG } from "../src/render/svg.js";

const project = (nodes, edges = [], extra = {}) => ({
  version: 2,
  id: "test",
  type: "architecture",
  title: "Test",
  description: "",
  width: 0,
  height: 0,
  theme: createDiagram("architecture").theme,
  nodes: nodes.map((node) => ({ x: 0, y: 0, w: 160, h: 64, ...node })),
  edges,
  settings: { grid: false, corner: 8, autoFit: true },
  ...extra,
});

test("simplify merges duplicate labels and rewires their connections", () => {
  const source = project(
    [
      { id: "a", label: "Gateway" },
      { id: "b", label: "gateway ", sublabel: "Auth" },
      { id: "c", label: "Service" },
    ],
    [
      { id: "e1", source: "a", target: "c" },
      { id: "e2", source: "b", target: "c" },
    ],
  );
  const { diagram, ledger } = simplify(source);
  assert.equal(diagram.nodes.length, 2);
  assert.equal(diagram.nodes.find((node) => node.label !== "Service").sublabel, "Auth", "the richer node survives");
  assert.equal(diagram.edges.length, 1, "the duplicated connection folds away");
  assert.ok(ledger.some((line) => line.includes("Merged 1 duplicate")));
});

test("simplify folds parallel connections and keeps both labels", () => {
  const source = project(
    [{ id: "a", label: "A" }, { id: "b", label: "B" }],
    [
      { id: "e1", source: "a", target: "b", label: "read" },
      { id: "e2", source: "a", target: "b", label: "write" },
    ],
  );
  const { diagram } = simplify(source);
  assert.equal(diagram.edges.length, 1);
  assert.equal(diagram.edges[0].label, "read · write");
});

test("simplify at light level leaves orphans alone", () => {
  const source = project(
    [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "loose", label: "Loose" }],
    [{ id: "e1", source: "a", target: "b" }],
  );
  assert.equal(simplify(source, { level: "light" }).diagram.nodes.length, 3);
  assert.equal(simplify(source, { level: "balanced" }).diagram.nodes.length, 2);
});

test("simplify only collapses pass-through nodes when asked", () => {
  const source = project(
    [
      { id: "a", label: "Client" },
      { id: "b", label: "Relay" },
      { id: "c", label: "Service" },
    ],
    [
      { id: "e1", source: "a", target: "b" },
      { id: "e2", source: "b", target: "c", label: "forward" },
    ],
  );
  assert.equal(simplify(source, { level: "balanced" }).diagram.nodes.length, 3);

  const { diagram, ledger } = simplify(source, { level: "aggressive" });
  assert.equal(diagram.nodes.length, 2);
  assert.equal(diagram.edges.length, 1);
  assert.equal(diagram.edges[0].label, "Relay · forward");
  assert.ok(ledger.some((line) => line.includes("Collapsed 1 pass-through")));
});

test("simplify never collapses a node that carries meaning", () => {
  const source = project(
    [
      { id: "a", label: "Client" },
      { id: "b", label: "Cache", role: "store" },
      { id: "c", label: "Service" },
    ],
    [
      { id: "e1", source: "a", target: "b" },
      { id: "e2", source: "b", target: "c" },
    ],
  );
  assert.equal(simplify(source, { level: "aggressive" }).diagram.nodes.length, 3);
});

test("simplify records a fidelity ledger and leaves a valid project", () => {
  const source = parseMermaid("flowchart LR\n A[One] --> B[Two]\n A --> B\n C[One] --> B");
  const { diagram, ledger } = simplify(source, { level: "aggressive" });
  assert.deepEqual(validateDiagram(diagram), []);
  assert.match(ledger[0], /^Detail: aggressive/);
  assert.ok(diagram.provenance.simplified.actions.length > 0);
  assert.ok(buildSVG(diagram).includes("<svg"));
});

test("matchNodes pairs by id first, then by label and role", () => {
  const before = project([{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }]);
  const after = project([{ id: "a", label: "Alpha renamed" }, { id: "different", label: "Beta" }]);
  const { matches, unmatchedPrevious } = matchNodes(before, after);
  assert.equal(matches.get("a").id, "a");
  assert.equal(matches.get("different").id, "b");
  assert.deepEqual(unmatchedPrevious, []);
});

test("stableRedraw keeps the geometry of everything that survived", () => {
  const before = project([
    { id: "a", label: "Alpha", x: 100, y: 200 },
    { id: "b", label: "Beta", x: 400, y: 200 },
  ]);
  before.width = 800;
  before.height = 500;

  const after = project([
    { id: "a", label: "Alpha", x: 0, y: 0 },
    { id: "b", label: "Beta", x: 0, y: 0 },
    { id: "c", label: "Gamma", x: 0, y: 0 },
  ]);

  const { diagram, report } = stableRedraw(before, after);
  const byLabel = new Map(diagram.nodes.map((node) => [node.label, node]));
  assert.equal(byLabel.get("Alpha").x, 100);
  assert.equal(byLabel.get("Beta").x, 400);
  assert.equal(report.kept, 2);
  assert.deepEqual(report.added, ["Gamma"]);
  assert.ok(byLabel.get("Gamma").y > 200, "the new node is parked below the existing drawing");
  assert.equal(diagram.settings.preserveLayout, true);
});

test("stableRedraw reports what disappeared", () => {
  const before = project([{ id: "a", label: "Alpha", x: 10, y: 10 }, { id: "b", label: "Beta", x: 10, y: 200 }]);
  const after = project([{ id: "a", label: "Alpha" }]);
  const { report } = stableRedraw(before, after);
  assert.deepEqual(report.removed, ["Beta"]);
});

test("diffProjects separates edits, moves and structural change", () => {
  const before = project(
    [{ id: "a", label: "Alpha", x: 0, y: 0 }, { id: "b", label: "Beta", x: 100, y: 0 }],
    [{ id: "e1", source: "a", target: "b" }],
  );
  const after = project(
    [{ id: "a", label: "Alpha", x: 40, y: 0 }, { id: "b", label: "Beta renamed", x: 100, y: 0 }, { id: "c", label: "Gamma" }],
    [{ id: "e1", source: "a", target: "b" }, { id: "e2", source: "b", target: "c" }],
  );

  const diff = diffProjects(before, after);
  assert.equal(diff.nodes.added.length, 1);
  assert.equal(diff.nodes.removed.length, 0);
  assert.ok(diff.nodes.changed.find((node) => node.id === "a").moved);
  assert.ok(diff.nodes.changed.find((node) => node.id === "b").fields.includes("label"));
  assert.equal(diff.edges.added.length, 1);
  assert.match(describeDiff(diff), /\+1 node/);
});

test("an unchanged project diffs to nothing", () => {
  const before = createDiagram("flowchart");
  buildSVG(before);
  const after = structuredClone(before);
  assert.equal(describeDiff(diffProjects(before, after)), "no changes");
});

test("duplicate ids never appear after a merge", () => {
  const source = project(
    [{ id: "a", label: "Same" }, { id: "b", label: "Same" }, { id: "c", label: "Same" }],
    [{ id: "e1", source: "a", target: "b" }, { id: "e2", source: "b", target: "c" }],
  );
  const { diagram } = simplify(source);
  const ids = diagram.nodes.map((node) => node.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(validateDiagram(diagram), []);
  assert.equal(makeId("node") === makeId("node"), false);
});
