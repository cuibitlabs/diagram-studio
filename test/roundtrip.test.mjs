import assert from "node:assert/strict";
import test from "node:test";

import { createDiagram, validateDiagram } from "../src/model.js";
import { parseMermaid } from "../src/import/mermaid.js";
import { parseDrawio } from "../src/import/drawio.js";
import { toMermaid } from "../src/export/mermaid.js";
import { toDrawio } from "../src/export/drawio.js";

const labels = (diagram) => diagram.nodes.map((node) => node.label);

test("flowchart: shapes become roles, pipe labels become edge labels", () => {
  const diagram = parseMermaid(`flowchart TD
    A([Start]) --> B{Valid?}
    B -->|no| C[/Show errors/]
    B -->|yes| D[(Save record)]
    D --> E((Done))`);
  assert.equal(diagram.type, "flowchart");
  assert.equal(diagram.settings.direction, "TB");
  assert.deepEqual(labels(diagram), ["Start", "Valid?", "Show errors", "Save record", "Done"]);
  assert.equal(diagram.nodes[0].role, "terminal");
  assert.equal(diagram.nodes[1].role, "decision");
  assert.equal(diagram.nodes[2].role, "input");
  assert.equal(diagram.nodes[3].role, "store");
  assert.equal(diagram.nodes[4].role, "event");
  assert.deepEqual(diagram.edges.map((edge) => edge.label), ["", "no", "yes", ""]);
});

test("flowchart: subgraphs become groups and & fans out", () => {
  const diagram = parseMermaid(`flowchart LR
    subgraph Perimeter
      A[Edge]
      B[WAF]
    end
    A & B --> C[App]`);
  assert.equal(diagram.groups.length, 1);
  assert.equal(diagram.groups[0].label, "Perimeter");
  assert.equal(diagram.groups[0].nodes.length, 2);
  assert.equal(diagram.edges.length, 2);
});

test("flowchart: dotted and thick links keep their emphasis", () => {
  const diagram = parseMermaid("flowchart LR\n A --> B\n B -.-> C\n C ==> D");
  assert.equal(diagram.edges[0].dashed, false);
  assert.equal(diagram.edges[1].dashed, true);
  assert.equal(diagram.edges[2].tone, "accent");
});

test("flowchart: class assignment promotes a node to the accent", () => {
  const diagram = parseMermaid("flowchart LR\n A[One] --> B[Two]\n classDef accent fill:#f00\n class B accent");
  assert.equal(diagram.nodes[1].tone, "accent");
});

test("sequence: returns are distinguished from calls", () => {
  const diagram = parseMermaid(`sequenceDiagram
    participant U as User
    participant A as API
    U->>A: Request
    A-->>U: Response`);
  assert.equal(diagram.type, "sequence");
  assert.deepEqual(labels(diagram), ["User", "API"]);
  assert.equal(diagram.edges[0].kind, undefined);
  assert.equal(diagram.edges[1].kind, "return");
});

test("state: pseudo-states are converted, not drawn as nodes", () => {
  const diagram = parseMermaid(`stateDiagram-v2
    [*] --> Draft
    Draft --> Review : submit
    Review --> [*]`);
  assert.equal(diagram.type, "state");
  assert.ok(!labels(diagram).includes("[*]"));
  assert.deepEqual(labels(diagram), ["Draft", "Review"]);
  assert.equal(diagram.edges[0].label, "submit");
});

test("er: entity blocks become field lists", () => {
  const diagram = parseMermaid(`erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
      uuid id PK
      string email
    }`);
  assert.equal(diagram.type, "er");
  const customer = diagram.nodes.find((node) => node.label === "CUSTOMER");
  assert.equal(customer.fields.length, 2);
  assert.deepEqual(customer.fields[0], { type: "uuid", name: "id", key: "PK" });
  assert.equal(diagram.edges[0].label, "places");
});

test("gantt: durations become day offsets and undated tasks are reported", () => {
  const diagram = parseMermaid(`gantt
    title Delivery
    dateFormat YYYY-MM-DD
    section Build
    Design      :a1, 2024-01-01, 10d
    Development :a2, 2w
    Handover    :a3`);
  assert.equal(diagram.type, "gantt");
  assert.equal(diagram.title, "Delivery");
  assert.equal(diagram.nodes[0].duration, 10);
  assert.equal(diagram.nodes[1].duration, 14);
  assert.equal(diagram.nodes[1].start, 10);
  assert.equal(diagram.nodes[2].duration, undefined);
  assert.ok(diagram.provenance.dropped.some((entry) => entry.includes("Handover")));
});

test("journey: 1-5 scores are rescaled and reported", () => {
  const diagram = parseMermaid(`journey
    title Onboarding
    section Start
      Sign up: 3: Customer
      First value: 5: Customer`);
  assert.equal(diagram.type, "journey");
  assert.equal(diagram.nodes[0].value, 60);
  assert.equal(diagram.nodes[1].value, 100);
  assert.ok(diagram.provenance.collapsed.some((entry) => entry.includes("rescaled")));
});

test("mindmap: indentation becomes the hierarchy", () => {
  const diagram = parseMermaid(`mindmap
  Root
    Branch A
      Leaf A1
    Branch B`);
  assert.equal(diagram.type, "mind-map");
  assert.equal(diagram.nodes.length, 4);
  assert.equal(diagram.edges.length, 3);
});

test("quadrantChart: points carry real coordinates", () => {
  const diagram = parseMermaid(`quadrantChart
    title Reach and engagement
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    Campaign A: [0.3, 0.6]
    Campaign B: [0.75, 0.25]`);
  assert.equal(diagram.type, "quadrant");
  assert.equal(diagram.nodes[0].px, 30);
  assert.equal(diagram.nodes[0].py, 60);
  assert.equal(diagram.axes.x.low, "Low Reach");
});

test("pie is redrawn as a bar chart and says so", () => {
  const diagram = parseMermaid(`pie title Spend
    "Infrastructure" : 45
    "People" : 120`);
  assert.equal(diagram.type, "bar");
  assert.equal(diagram.nodes[1].value, 120);
  assert.ok(diagram.provenance.collapsed.some((entry) => entry.includes("bar chart")));
});

test("timeline: periods become markers", () => {
  const diagram = parseMermaid(`timeline
    title History
    2021 : Founded
    2023 : Series A`);
  assert.equal(diagram.type, "timeline");
  assert.equal(diagram.nodes[0].marker, "2021");
  assert.equal(diagram.nodes[0].label, "Founded");
});

test("an unsupported header fails loudly", () => {
  assert.throws(() => parseMermaid("gitGraph\n commit"), /Unsupported Mermaid diagram/);
  assert.throws(() => parseMermaid(""), /empty/);
});

test("every import records a fidelity ledger", () => {
  const diagram = parseMermaid("flowchart LR\n A --> B");
  assert.equal(diagram.provenance.format, "mermaid");
  assert.equal(diagram.provenance.drawnNodes, 2);
  assert.deepEqual(validateDiagram(diagram), []);
});

const PLAIN_DRAWIO = `<mxfile><diagram><mxGraphModel><root>
  <mxCell id="0"/><mxCell id="1" parent="0"/>
  <mxCell id="a" value="Client" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="60" as="geometry"/></mxCell>
  <mxCell id="b" value="Database" style="shape=cylinder3;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="160" height="80" as="geometry"/></mxCell>
  <mxCell id="e1" value="reads" style="dashed=1;" edge="1" parent="1" source="a" target="b"><mxGeometry relative="1" as="geometry"/></mxCell>
</root></mxGraphModel></diagram></mxfile>`;

test("draw.io: plain XML keeps geometry, labels and inferred roles", async () => {
  const diagram = await parseDrawio(PLAIN_DRAWIO);
  assert.deepEqual(labels(diagram), ["Client", "Database"]);
  assert.equal(diagram.nodes[1].role, "store");
  assert.equal(diagram.nodes[0].x, 40);
  assert.equal(diagram.nodes[0].fixedSize, true);
  assert.equal(diagram.settings.preserveLayout, true);
  assert.equal(diagram.edges[0].label, "reads");
  assert.equal(diagram.edges[0].dashed, true);
});

test("draw.io: a compressed payload is inflated in-process", async () => {
  const inner = "<mxGraphModel><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"a\" value=\"Packed\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"0\" y=\"0\" width=\"120\" height=\"60\" as=\"geometry\"/></mxCell></root></mxGraphModel>";
  const encoded = encodeURIComponent(inner);
  const stream = new Blob([new TextEncoder().encode(encoded)]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  const base64 = Buffer.from(bytes).toString("base64");

  const diagram = await parseDrawio(`<mxfile><diagram>${base64}</diagram></mxfile>`);
  assert.deepEqual(labels(diagram), ["Packed"]);
});

test("draw.io: XML entities are rejected", async () => {
  await assert.rejects(
    parseDrawio('<!DOCTYPE foo [<!ENTITY x "y">]><mxGraphModel><root/></mxGraphModel>'),
    /entities are not allowed/,
  );
});

test("draw.io: a connector with a free endpoint is reported, not dropped silently", async () => {
  const diagram = await parseDrawio(PLAIN_DRAWIO.replace('target="b"', 'target="missing"'));
  assert.equal(diagram.edges.length, 0);
  assert.ok(diagram.provenance.unsupported[0].includes("free endpoint"));
});

test("mermaid export round-trips a flowchart", () => {
  const original = createDiagram("flowchart");
  const { text } = toMermaid(original);
  assert.match(text, /^%% /m);
  assert.match(text, /flowchart TB/);
  const reimported = parseMermaid(text);
  assert.equal(reimported.nodes.length, original.nodes.length);
  assert.equal(reimported.edges.length, original.edges.length);
});

test("mermaid export states what a target format cannot carry", () => {
  const { notes } = toMermaid(createDiagram("radar"));
  assert.ok(notes.length > 0);
  assert.ok(notes[0].toLowerCase().includes("mermaid cannot express"));
});

test("mermaid export keeps sequence direction and returns", () => {
  const { text } = toMermaid(createDiagram("sequence"));
  assert.match(text, /sequenceDiagram/);
  assert.match(text, /-->>/);
  const reimported = parseMermaid(text);
  assert.equal(reimported.type, "sequence");
});

test("state export round-trips including entry and terminal markers", () => {
  const original = createDiagram("state");
  const { text } = toMermaid(original);
  assert.match(text, /stateDiagram-v2/);
  assert.match(text, /\[\*\] -->/);
  const reimported = parseMermaid(text);
  assert.equal(reimported.type, "state");
  assert.deepEqual(reimported.nodes.map((node) => node.label), original.nodes.map((node) => node.label));
  assert.equal(reimported.edges.length, original.edges.length);
  assert.equal(reimported.nodes[0].stateKind, "initial");
});

test("draw.io export round-trips through the importer", async () => {
  const original = createDiagram("architecture");
  const xml = toDrawio(original);
  assert.match(xml, /^<mxfile/);
  assert.ok(!/<diagram>[A-Za-z0-9+/=]{40,}<\/diagram>/.test(xml), "must be uncompressed");
  const reimported = await parseDrawio(xml);
  assert.equal(reimported.nodes.length, original.nodes.length);
  assert.equal(reimported.edges.length, original.edges.length);
  assert.equal(reimported.nodes[0].x, Math.round(original.nodes[0].x));
});

test("draw.io export escapes labels", () => {
  const diagram = createDiagram("flowchart");
  diagram.nodes[0].label = 'A & B <script>';
  const xml = toDrawio(diagram);
  assert.ok(xml.includes("A &amp; B &lt;script&gt;"));
  assert.doesNotMatch(xml, /value="A & B/);
});
