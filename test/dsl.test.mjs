import assert from "node:assert/strict";
import test from "node:test";

import { ParseError, parse, stringify } from "../src/dsl/index.js";
import { DIAGRAM_TYPES, createDiagram, validateDiagram } from "../src/model.js";
import { buildSVG } from "../src/render/svg.js";

const SOURCE = `architecture "Checkout platform"
theme cobalt
direction LR
describe "How an order reaches the ledger"

group "Perimeter" {
  customer: actor "Customer" #user
  web "Web app" / "Browser client" #browser
}
gateway "API gateway" *
orders "Orders service"
store: store "Order store"

customer -> web
web -> gateway "TLS"
gateway -> orders
orders ~> store "read/write"
`;

test("parses a full document", () => {
  const diagram = parse(SOURCE);
  assert.equal(diagram.type, "architecture");
  assert.equal(diagram.title, "Checkout platform");
  assert.equal(diagram.description, "How an order reaches the ledger");
  assert.equal(diagram.settings.direction, "LR");
  assert.equal(diagram.theme.accent, "#1f4fbf");
  assert.deepEqual(validateDiagram(diagram), []);

  assert.equal(diagram.nodes.length, 5);
  const byLabel = new Map(diagram.nodes.map((node) => [node.label, node]));
  assert.equal(byLabel.get("Customer").role, "actor");
  assert.equal(byLabel.get("Customer").icon, "user");
  assert.equal(byLabel.get("Web app").sublabel, "Browser client");
  assert.equal(byLabel.get("API gateway").tone, "accent");
  assert.equal(byLabel.get("Order store").role, "store");

  assert.equal(diagram.groups.length, 1);
  assert.equal(diagram.groups[0].label, "Perimeter");
  assert.equal(diagram.groups[0].nodes.length, 2);

  assert.equal(diagram.edges.length, 4);
  assert.equal(diagram.edges[1].label, "TLS");
  assert.equal(diagram.edges[3].dashed, true);
});

test("arrow forms carry their meaning", () => {
  const diagram = parse(`flowchart "T"\na "A"\nb "B"\na -> b\na ~> b\na => b\na <-> b`);
  assert.equal(diagram.edges[0].dashed, false);
  assert.equal(diagram.edges[1].dashed, true);
  assert.equal(diagram.edges[2].tone, "accent");
  assert.equal(diagram.edges[3].bidirectional, true);
});

test("a value and an axis survive the round trip", () => {
  const source = `bar "Spend"\nunit "Days"\naxis x "Phase" "Start" "End"\nresearch "Research" =18\nbuild "Build" =64 *\n`;
  const diagram = parse(source);
  assert.equal(diagram.nodes[0].value, 18);
  assert.equal(diagram.unit, "Days");
  assert.equal(diagram.axes.x.label, "Phase");
  assert.equal(parse(stringify(diagram)).nodes[1].value, 64);
});

test("referencing an undeclared key creates it", () => {
  const diagram = parse(`flowchart "Sketch"\nidea -> prototype\nprototype -> launch`);
  assert.deepEqual(diagram.nodes.map((node) => node.label), ["idea", "prototype", "launch"]);
  assert.equal(diagram.edges.length, 2);
});

test("comments and blank lines are ignored, quotes can contain slashes", () => {
  const diagram = parse(`flowchart "T"\n// a comment\n\na "A // not a comment"\nb "B"\na -> b // trailing\n`);
  assert.equal(diagram.nodes[0].label, "A // not a comment");
  assert.equal(diagram.edges.length, 1);
});

test("escaped quotes survive both directions", () => {
  const diagram = parse(String.raw`flowchart "The \"real\" flow"` + "\n" + String.raw`a "He said \"go\""`);
  assert.equal(diagram.title, 'The "real" flow');
  assert.equal(diagram.nodes[0].label, 'He said "go"');
  assert.equal(parse(stringify(diagram)).nodes[0].label, 'He said "go"');
});

test("errors name the line", () => {
  assert.throws(() => parse("nonsense \"x\""), (error) => error instanceof ParseError && /line 1/.test(error.message));
  assert.throws(() => parse('flowchart "T"\ntheme nope'), /line 2: unknown theme/);
  assert.throws(() => parse('flowchart "T"\na: wizard "A"'), /unknown role/);
  assert.throws(() => parse('flowchart "T"\ngroup "G" {\na "A"'), /unclosed group/);
  assert.throws(() => parse('flowchart "T"\n}'), /unexpected }/);
  assert.throws(() => parse(""), /empty/);
});

test("stringify then parse is stable for every type's starter content", () => {
  for (const type of DIAGRAM_TYPES) {
    const original = createDiagram(type.id);
    const round = parse(stringify(original));
    assert.equal(round.type, original.type, type.id);
    assert.equal(round.title, original.title, type.id);
    assert.deepEqual(
      round.nodes.map((node) => node.label),
      original.nodes.map((node) => node.label),
      type.id,
    );
    assert.equal(round.edges.length, original.edges.length, type.id);
    assert.deepEqual(validateDiagram(round), [], type.id);
  }
});

test("serialising twice gives identical text", () => {
  const diagram = parse(SOURCE);
  assert.equal(stringify(diagram), stringify(parse(stringify(diagram))));
});

test("a parsed document renders", () => {
  const svg = buildSVG(parse(SOURCE));
  assert.ok(svg.includes("Checkout platform"));
  assert.ok(svg.includes("API gateway"));
  // Group titles are set in the section style, which is uppercase.
  assert.ok(svg.includes("PERIMETER"));
});
