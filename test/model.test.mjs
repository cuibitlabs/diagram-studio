import test from "node:test";
import assert from "node:assert/strict";
import { createDiagram, createFromPrompt, DIAGRAM_TYPES, validateDiagram } from "../src/model.js";

test("ships a broad diagram library", () => {
  assert.ok(DIAGRAM_TYPES.length >= 43, `only ${DIAGRAM_TYPES.length} types`);
  // Every registered type must be distinct and renderable, not just counted.
  const ids = DIAGRAM_TYPES.map((type) => type.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate type id");
  const families = new Set(DIAGRAM_TYPES.map((type) => type.family));
  assert.ok(families.size >= 8, `only ${families.size} families`);
});
test("creates a valid architecture diagram", () => { const diagram = createDiagram("architecture"); assert.equal(diagram.type, "architecture"); assert.ok(diagram.nodes.length >= 5); assert.deepEqual(validateDiagram(diagram), []); });
test("prompt composer detects a sequence and explicit nodes", () => { const diagram = createFromPrompt("Create a sequence titled Login flow\nCustomer -> Web app -> Auth service -> Database"); assert.equal(diagram.type, "sequence"); assert.equal(diagram.nodes[0].label, "Customer"); assert.equal(diagram.nodes.length, 4); });
test("every registered type can be created", () => { for (const type of DIAGRAM_TYPES) assert.deepEqual(validateDiagram(createDiagram(type.id)), [], type.id); });
