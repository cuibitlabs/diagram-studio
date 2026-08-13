import assert from "node:assert/strict";
import test from "node:test";

import { createDiagram } from "../src/model.js";
import { buildSVG } from "../src/render/svg.js";
import { htmlDocument } from "../src/exporters.js";
import { AUDIENCES, CANVAS_PRESETS, PRESET_IDS, applyAudience } from "../src/render/presets.js";
import { MOTION_MODES, isStepped, motionController, motionControls, stepTotal } from "../src/render/motion.js";
import { PALETTES, SERIES, completeTheme, seriesColour } from "../src/theme/palettes.js";
import { auditTheme } from "../src/theme/contrast.js";
import { rectOf } from "../src/engine/geom.js";

/* ------------------------------------------------------------- presets */

test("every preset is on the 4px grid and 'fit' stays unpinned", () => {
  for (const [id, preset] of Object.entries(CANVAS_PRESETS)) {
    if (id === "fit") {
      assert.equal(preset.width, null);
      continue;
    }
    assert.equal(preset.width % 4, 0, `${id} width`);
    assert.equal(preset.height % 4, 0, `${id} height`);
  }
  assert.ok(PRESET_IDS.includes("slide-16x9"));
});

test("a preset pins the canvas whatever the diagram contains", () => {
  const small = createDiagram("venn");
  const large = createDiagram("er");
  small.settings.preset = "slide-16x9";
  large.settings.preset = "slide-16x9";
  buildSVG(small);
  buildSVG(large);
  assert.equal(small.width, 1600);
  assert.equal(small.height, 900);
  assert.equal(large.width, 1600);
  assert.equal(large.height, 900);
});

test("a pinned canvas centres the drawing and never enlarges it", () => {
  const natural = createDiagram("venn");
  buildSVG(natural);
  const naturalWidth = rectOf(natural.nodes[0]).w;

  const diagram = createDiagram("venn");
  diagram.settings.preset = "slide-16x9";
  buildSVG(diagram);

  const after = diagram.nodes.map(rectOf);
  // Small diagram, big canvas: sizes are untouched, only the offset changed.
  assert.equal(after[0].w, naturalWidth, "a small diagram is not blown up to fill the slide");

  const left = Math.min(...after.map((rect) => rect.x));
  const right = Math.max(...after.map((rect) => rect.x2));
  assert.ok(Math.abs(left - (1600 - right)) <= 8, "the drawing is centred horizontally");
});

test("a diagram larger than the preset is scaled down to fit", () => {
  const natural = createDiagram("er");
  buildSVG(natural);
  const naturalWidth = Math.max(...natural.nodes.map((node) => node.x + node.w));

  const pinned = createDiagram("er");
  pinned.settings.preset = "doc-inline";
  buildSVG(pinned);
  const fitted = Math.max(...pinned.nodes.map((node) => node.x + node.w));

  assert.ok(naturalWidth > 720, `the ER sample (${naturalWidth}px) is wider than an inline document figure`);
  assert.ok(fitted <= 720, `content ran to ${fitted} on a 720px canvas`);
});

test("without a preset the canvas still follows the drawing", () => {
  const diagram = createDiagram("venn");
  buildSVG(diagram);
  assert.notEqual(diagram.width, 1600);
  assert.ok(diagram.width > 0);
});

/* ------------------------------------------------------------ audience */

test("the executive dial removes detail rather than shrinking it", () => {
  const diagram = createDiagram("architecture");
  assert.ok(diagram.nodes.some((node) => node.sublabel));
  const result = applyAudience(diagram, "executive");
  assert.ok(result.dropped > 0);
  assert.ok(diagram.nodes.every((node) => !node.sublabel));
  assert.ok(diagram.nodes.every((node) => !node.icon));
});

test("the engineer dial keeps everything", () => {
  const diagram = createDiagram("architecture");
  const before = JSON.stringify(diagram.nodes);
  applyAudience(diagram, "engineer");
  assert.equal(JSON.stringify(diagram.nodes), before);
});

test("the mixed dial drops bare protocol noise but keeps real detail", () => {
  const diagram = createDiagram("architecture");
  diagram.nodes[0].sublabel = "TLS 443";
  diagram.nodes[1].sublabel = "Where a customer starts";
  applyAudience(diagram, "mixed");
  assert.equal(diagram.nodes[0].sublabel, undefined, "a bare protocol is noise at this level");
  assert.equal(diagram.nodes[1].sublabel, "Where a customer starts");
});

test("an unknown audience falls back to mixed", () => {
  assert.equal(applyAudience(createDiagram("bar"), "nonsense").audience, "mixed");
  assert.deepEqual(AUDIENCES, ["executive", "mixed", "engineer"]);
});

test("the audience is applied before sizing, so boxes shrink with the text", () => {
  const detailed = createDiagram("architecture");
  buildSVG(detailed);
  const executive = createDiagram("architecture");
  executive.settings.audience = "executive";
  buildSVG(executive);

  // Compare the same node, not the tallest: the tallest box may be sized by a
  // wrapping label rather than by the sublabel that was removed.
  const withSub = detailed.nodes.findIndex((node) => node.sublabel);
  assert.ok(withSub >= 0);
  assert.ok(
    executive.nodes[withSub].h < detailed.nodes[withSub].h,
    `removing the sublabel should shorten "${detailed.nodes[withSub].label}"`,
  );
  assert.match(buildSVG(executive), /audience-executive/);
});

/* -------------------------------------------------------------- motion */

test("step is a motion mode and only step gets controls", () => {
  assert.deepEqual(MOTION_MODES, ["", "reveal", "step", "loop"]);
  assert.equal(isStepped(createDiagram("architecture")), false);

  const stepped = createDiagram("architecture");
  stepped.settings.motion = "step";
  assert.equal(isStepped(stepped), true);
});

test("a stepped html export is complete before its script runs", () => {
  const diagram = createDiagram("architecture");
  diagram.settings.motion = "step";
  const html = htmlDocument(diagram);

  // Nothing is hidden by the markup itself: the dimming rules all sit under
  // .motion-ready, which only the controller adds.
  assert.match(html, /data-motion-figure/);
  assert.match(html, /data-motion-controls hidden/);
  assert.match(html, /motion-ready/);
  // Labels are wrapped across one <text> per line, so check the first word.
  for (const node of diagram.nodes) {
    assert.ok(html.includes(node.label.split(/\s+/)[0]), `${node.label} is not in the static frame`);
  }
});

test("the step controller honours ?motion=static and never touches labels", () => {
  const script = motionController();
  assert.match(script, /motion.*===\s*"static"/s);
  assert.match(script, /classList\.toggle\("is-shown"/);
  assert.doesNotMatch(script, /innerHTML|textContent\s*=\s*element|fetch\(/);
  assert.match(script, /aria-live|ds-motion-count/);
});

test("an unstepped diagram ships no controls and no script", () => {
  const html = htmlDocument(createDiagram("architecture"));
  assert.doesNotMatch(html, /data-motion-controls/);
  assert.doesNotMatch(html, /<script/);
});

test("controls report the real number of steps", () => {
  const diagram = createDiagram("architecture");
  diagram.settings.motion = "step";
  const svg = buildSVG(diagram);
  const total = stepTotal(svg);
  assert.ok(total >= 2);
  assert.ok(motionControls(total).includes(`1 / ${total}`));
});

/* -------------------------------------------------------------- tokens */

test("every palette carries the extended token set", () => {
  for (const [id, palette] of Object.entries(PALETTES)) {
    for (const role of ["paper2", "soft", "accentTint", "link"]) {
      assert.ok(palette[role], `${id} is missing ${role}`);
    }
  }
});

test("the extended tokens are held to the same contrast contract", () => {
  for (const [id, palette] of Object.entries(PALETTES)) {
    for (const pair of ["soft-on-panel", "soft-on-paper2", "link-on-paper"]) {
      const row = auditTheme(palette).find((entry) => entry.pair === pair);
      assert.ok(row, `${pair} is not audited`);
      assert.ok(row.pass, `${id}: ${pair} is ${row.ratio}:1, needs ${row.target}:1`);
    }
  }
});

test("completeTheme derives the extended tokens from what it was given", () => {
  const theme = completeTheme({ paper: "#ffffff", ink: "#111111", accent: "#c2452a" });
  assert.ok(theme.paper2 && theme.paper2 !== theme.paper, "a recessed surface is derived");
  assert.ok(theme.soft);
  assert.match(theme.accentTint, /^rgba\(194,69,42,/);
  assert.ok(theme.link);
});

test("series colours cycle and follow the palette mode", () => {
  assert.equal(seriesColour(PALETTES.editorial, 0), SERIES.light[0]);
  assert.equal(seriesColour(PALETTES.midnight, 0), SERIES.dark[0]);
  assert.equal(seriesColour(PALETTES.editorial, SERIES.light.length), SERIES.light[0], "the set cycles");
});

test("series variables reach the rendered svg", () => {
  const svg = buildSVG(createDiagram("radar"));
  assert.match(svg, /--series-0:/);
  assert.match(svg, /--paper-2:/);
  assert.match(svg, /--soft:/);
  assert.match(svg, /--link:/);
  assert.match(svg, /--accent-tint:/);
});
