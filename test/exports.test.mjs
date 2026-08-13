import assert from "node:assert/strict";
import test from "node:test";

import { createDiagram } from "../src/model.js";
import { toExcalidraw, toExcalidrawJSON } from "../src/export/excalidraw.js";
import { toReact, toWebComponent } from "../src/export/component.js";
import { toFlatSVG } from "../src/export/flat.js";
import { toPPTX } from "../src/export/pptx.js";
import { crc32, zip } from "../src/export/zip.js";

test("excalidraw scene contains real, bound elements", () => {
  const diagram = createDiagram("architecture");
  const scene = toExcalidraw(diagram);

  assert.equal(scene.type, "excalidraw");
  assert.equal(scene.appState.viewBackgroundColor, diagram.theme.paper);

  const boxes = scene.elements.filter((element) => ["rectangle", "diamond", "ellipse"].includes(element.type));
  const labels = scene.elements.filter((element) => element.type === "text");
  const arrows = scene.elements.filter((element) => element.type === "arrow");

  assert.equal(boxes.length, diagram.nodes.length);
  assert.equal(labels.length, diagram.nodes.length);
  assert.equal(arrows.length, diagram.edges.length);

  // Labels are bound to their box, and arrows to both endpoints, so the scene
  // is editable rather than a pile of loose shapes.
  assert.ok(labels.every((label) => boxes.some((box) => box.id === label.containerId)));
  assert.ok(arrows.every((arrow) => arrow.startBinding && arrow.endBinding));

  const ids = scene.elements.map((element) => element.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("excalidraw arrow points are relative to the arrow origin", () => {
  const scene = toExcalidraw(createDiagram("flowchart"));
  const arrow = scene.elements.find((element) => element.type === "arrow");
  assert.deepEqual(arrow.points[0], [0, 0]);
  assert.ok(arrow.points.length >= 2);
});

test("excalidraw json is parseable and stable", () => {
  const diagram = createDiagram("tree");
  const first = toExcalidrawJSON(diagram);
  assert.deepEqual(JSON.parse(first).type, "excalidraw");
  assert.equal(first, toExcalidrawJSON(diagram));
});

test("shape roles survive into excalidraw", () => {
  const diagram = createDiagram("flowchart");
  const scene = toExcalidraw(diagram);
  assert.ok(scene.elements.some((element) => element.type === "diamond"), "the decision stays a diamond");
});

test("the react component keeps the accessible name and takes theme props", () => {
  const source = toReact(createDiagram("architecture"), { name: "Architecture" });
  assert.match(source, /export default function Architecture\(/);
  assert.match(source, /role="img"/);
  assert.match(source, /aria-labelledby=/);
  assert.match(source, /const THEME = \{/);
  assert.match(source, /tokens\.accent/);
  // The drawing is injected as generated markup rather than transliterated into
  // JSX, so it stays byte-identical to the SVG export.
  assert.match(source, /dangerouslySetInnerHTML/);
  assert.match(source, /className=\{className\}/);
});

test("the react component name is a valid identifier whatever the title", () => {
  const diagram = createDiagram("bar");
  diagram.title = "2024 spend — by team!";
  assert.match(toReact(diagram), /export default function SpendByTeam\(/);
});

test("the web component registers a custom element and maps theme attributes", () => {
  const diagram = createDiagram("loop");
  diagram.title = "Delivery flywheel";
  const source = toWebComponent(diagram);
  assert.match(source, /customElements\.define\("diagram-delivery-flywheel"/);
  assert.match(source, /attachShadow/);
  assert.match(source, /observedAttributes/);
  assert.match(source, /setProperty\(ROLES\[name\], value\)/);
});

test("the web component template escapes backticks and interpolation", () => {
  const diagram = createDiagram("flowchart");
  diagram.nodes[0].label = "Use `npm` and ${x}";
  const source = toWebComponent(diagram);
  assert.ok(source.includes("\\`npm\\`"));
  assert.ok(source.includes("\\${x}"));
});

test("the flat svg resolves classes into presentation attributes", () => {
  const diagram = createDiagram("architecture");
  const flat = toFlatSVG(diagram);

  assert.doesNotMatch(flat, /<style/, "the stylesheet is dropped");
  assert.doesNotMatch(flat, /edge-hit/, "editor hit targets are dropped");
  assert.ok(flat.includes(`fill="${diagram.theme.panel}"`), "node fill is resolved");
  assert.ok(flat.includes(`stroke="${diagram.theme.lineStrong}"`), "connector stroke is resolved");
  assert.ok(flat.includes(`fill="${diagram.theme.ink}"`), "text fill is resolved");
});

test("the flat svg resolves accent nodes through their ancestor class", () => {
  const diagram = createDiagram("architecture");
  const accent = diagram.nodes.find((node) => node.tone === "accent");
  assert.ok(accent, "the sample has an accent node");
  const flat = toFlatSVG(diagram);
  // An accent node is a tinted card behind an accent border, not a solid block,
  // so a design tool has to receive the tint and the heavier stroke.
  assert.ok(flat.includes(`fill="${diagram.theme.accentTint}"`), "the accent card carries the tint");
  assert.ok(flat.includes(`stroke="${diagram.theme.accent}"`), "and the accent border");
  assert.ok(flat.includes('stroke-width="1.75"'), "at the heavier accent weight");
});

test("a solid-toned node still resolves to a filled block", () => {
  const diagram = createDiagram("architecture");
  diagram.nodes[2].tone = "solid";
  const flat = toFlatSVG(diagram);
  assert.ok(flat.includes(`fill="${diagram.theme.accent}"`));
  assert.ok(flat.includes(`fill="${diagram.theme.onAccent}"`));
});

test("the flat svg names its layers after the nodes", () => {
  const diagram = createDiagram("architecture");
  const flat = toFlatSVG(diagram);
  for (const node of diagram.nodes) {
    assert.ok(flat.includes(`data-name="${node.label}"`), `${node.label} is not a named layer`);
  }
});

test("crc32 matches the reference value", () => {
  // The canonical CRC-32 of "123456789".
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("the zip writer produces a readable archive", () => {
  const archive = zip([{ name: "a.txt", data: "hello" }, { name: "dir/b.txt", data: "world" }]);
  const bytes = Buffer.from(archive);
  assert.equal(bytes.readUInt32LE(0), 0x04034b50, "local file header signature");
  assert.ok(bytes.includes(Buffer.from("a.txt")));
  assert.ok(bytes.includes(Buffer.from("dir/b.txt")));
  // End-of-central-directory record, with both entries counted.
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(end > 0);
  assert.equal(bytes.readUInt16LE(end + 10), 2);
});

test("pptx contains every required part", () => {
  const bytes = Buffer.from(toPPTX(createDiagram("architecture")));
  for (const part of [
    "[Content_Types].xml",
    "_rels/.rels",
    "ppt/presentation.xml",
    "ppt/slideMasters/slideMaster1.xml",
    "ppt/slideLayouts/slideLayout1.xml",
    "ppt/theme/theme1.xml",
    "ppt/slides/slide1.xml",
    "ppt/slides/_rels/slide1.xml.rels",
  ]) {
    assert.ok(bytes.includes(Buffer.from(part)), `${part} is missing`);
  }
});

test("pptx ships real shapes, not a picture", () => {
  const diagram = createDiagram("architecture");
  const text = Buffer.from(toPPTX(diagram)).toString("latin1");

  const shapes = (text.match(/<p:sp>/g) ?? []).length;
  assert.equal(shapes, diagram.nodes.length + diagram.edges.length, "one shape per node and connector");
  assert.ok(text.includes("<a:prstGeom prst="), "nodes use preset geometry");
  assert.ok(text.includes("<a:custGeom>"), "connectors keep their elbows as freeform paths");
  assert.ok(text.includes("<a:tailEnd type=\"triangle\""), "connectors keep their arrowheads");
  assert.ok(!text.includes("<p:pic>"), "nothing is embedded as an image");

  for (const node of diagram.nodes) {
    assert.ok(text.includes(node.label), `${node.label} is not editable text`);
  }
});

test("pptx uses the diagram's own palette", () => {
  const diagram = createDiagram("flowchart");
  const text = Buffer.from(toPPTX(diagram)).toString("latin1");
  assert.ok(text.includes(diagram.theme.accent.slice(1).toUpperCase()), "the accent reaches the slide");
  assert.ok(text.includes(diagram.theme.paper.slice(1).toUpperCase()), "the page colour becomes the slide background");
});

test("pptx keeps the diagram inside the slide", () => {
  const text = Buffer.from(toPPTX(createDiagram("er"))).toString("latin1");
  const offsets = [...text.matchAll(/<a:off x="(\d+)" y="(\d+)"\/>/g)].map((match) => [Number(match[1]), Number(match[2])]);
  assert.ok(offsets.length > 0);
  for (const [x, y] of offsets) {
    assert.ok(x >= 0 && x <= 12192000, `x offset ${x} is off the slide`);
    assert.ok(y >= 0 && y <= 6858000, `y offset ${y} is off the slide`);
  }
});

test("pptx export is deterministic", () => {
  const diagram = createDiagram("tree");
  assert.deepEqual(Buffer.from(toPPTX(diagram)), Buffer.from(toPPTX(structuredClone(diagram))));
});

test("the flat svg stays well formed for every family", () => {
  for (const type of ["sequence", "gantt", "venn", "radar", "swimlane", "er", "quadrant", "journey"]) {
    const flat = toFlatSVG(createDiagram(type));
    assert.match(flat, /^<svg/, type);
    assert.match(flat, /<\/svg>$/, type);
    const opens = (flat.match(/<g\b/g) ?? []).length;
    const closes = (flat.match(/<\/g>/g) ?? []).length;
    assert.equal(opens, closes, `${type}: ${opens} <g> vs ${closes} </g>`);
    assert.doesNotMatch(flat, /NaN|undefined/, type);
  }
});
