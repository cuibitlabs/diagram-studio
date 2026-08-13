import assert from "node:assert/strict";
import test from "node:test";

import { createDiagram } from "../src/model.js";
import { buildSVG } from "../src/render/svg.js";
import { MOTIONS, SKIN_RULES, STYLES } from "../src/render/skin.js";
import { toASCII } from "../src/export/ascii.js";
import { parse, stringify } from "../src/dsl/index.js";

test("the default render carries no style or motion class", () => {
  const svg = buildSVG(createDiagram("architecture"));
  // The rules always ship in the stylesheet; what matters is that nothing opts
  // into them.
  assert.match(svg, /class="diagram-content"/);
  assert.doesNotMatch(svg, /class="diagram-content (style|motion)-/);
});

test("style variants are applied to the content group, not the root", () => {
  for (const style of STYLES.filter((entry) => entry !== "editorial")) {
    const diagram = createDiagram("architecture");
    diagram.settings.style = style;
    const svg = buildSVG(diagram);
    assert.match(svg, new RegExp(`class="diagram-content style-${style}"`), style);
    // The root sets the font custom properties inline; only a descendant class
    // can redefine them.
    assert.match(svg, /--font-sans:/);
  }
});

test("the terminal variant redefines the sans family as monospace", () => {
  assert.match(SKIN_RULES, /\.style-terminal\{--font-sans:var\(--font-mono\)/);
});

test("the sketchy variant uses the displacement filter, not a blur", () => {
  const diagram = createDiagram("flowchart");
  diagram.settings.style = "sketchy";
  const svg = buildSVG(diagram);
  assert.match(svg, /feTurbulence/);
  assert.match(svg, /feDisplacementMap/);
  assert.doesNotMatch(svg, /feGaussianBlur|feDropShadow/);
  assert.match(SKIN_RULES, /\.style-sketchy .card[^{]*\{filter:var\(--sketch\)/);
});

test("motion is opt-in, staggered by reading order, and respects reduced motion", () => {
  const diagram = createDiagram("architecture");
  diagram.settings.motion = "reveal";
  const svg = buildSVG(diagram);
  assert.match(svg, /class="diagram-content motion-reveal"/);

  const steps = [...svg.matchAll(/--step:(\d+)/g)].map((match) => Number(match[1]));
  assert.ok(steps.length >= diagram.nodes.length, "every node carries a step");
  assert.equal(Math.min(...steps), 0);
  assert.ok(Math.max(...steps) > 0, "later ranks reveal later");

  assert.match(SKIN_RULES, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(SKIN_RULES, /animation-delay:calc\(var\(--step,0\)\*/);
});

test("looping motion animates the connector dash, not the layout", () => {
  const diagram = createDiagram("loop");
  diagram.settings.motion = "loop";
  const svg = buildSVG(diagram);
  assert.match(svg, /motion-loop/);
  assert.match(SKIN_RULES, /\.motion-loop .ds-edge .line\{stroke-dasharray/);
  assert.deepEqual(MOTIONS, ["", "reveal", "step", "loop"]);
});

test("annotations render in the margin with a leader to their target", () => {
  const diagram = createDiagram("architecture");
  diagram.annotations = [
    { id: "n1", text: "This is where retries are decided.", target: diagram.nodes[2].id },
    { id: "n2", text: "Free-floating note." },
  ];
  const svg = buildSVG(diagram);
  assert.match(svg, /class="annotation"/);
  assert.match(svg, /annotation-leader/);
  assert.match(svg, /data-annotates="/);
  assert.ok(svg.includes("This is where retries are decided."));
  assert.ok(svg.includes("Free-floating note."));
});

test("style and motion survive the DSL round trip", () => {
  const source = 'flowchart "T"\nstyle sketchy\nmotion reveal\na "A"\nb "B"\na -> b\n';
  const diagram = parse(source);
  assert.equal(diagram.settings.style, "sketchy");
  assert.equal(diagram.settings.motion, "reveal");
  assert.match(stringify(diagram), /style sketchy/);
  assert.match(stringify(diagram), /motion reveal/);
  assert.throws(() => parse('flowchart "T"\nstyle neon'), /unknown style/);
});

test("ascii output keeps every node and lists the labelled connections", () => {
  const diagram = createDiagram("architecture");
  const art = toASCII(diagram, { width: 140 });
  for (const node of diagram.nodes) {
    const first = node.label.split(/\s+/)[0].slice(0, 6);
    assert.ok(art.includes(first), `${node.label} missing from the ascii view`);
  }
  assert.ok(art.includes("read/write"), "labelled connections are listed");
  assert.ok(art.includes("* marks the focal element"));
  assert.ok(art.includes("┌") && art.includes("─"), "uses box drawing");
});

test("ascii scales to the requested width instead of clipping", () => {
  const diagram = createDiagram("architecture");
  const narrow = toASCII(diagram, { width: 80 });
  const widest = Math.max(...narrow.split("\n").map((line) => [...line].length));
  assert.ok(widest <= 82, `line of ${widest} characters exceeded the requested width`);
  for (const node of diagram.nodes) {
    assert.ok(narrow.includes(node.label.split(/\s+/)[0].slice(0, 5)), `${node.label} was clipped away`);
  }
});

test("ascii handles a diagram with no connections", () => {
  const art = toASCII(createDiagram("layers"));
  assert.ok(art.includes("Experience"));
  assert.ok(!art.includes("undefined"));
});
