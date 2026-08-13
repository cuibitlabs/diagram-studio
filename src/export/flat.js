/**
 * Flattened SVG for design tools.
 *
 * Figma, Illustrator and Sketch do not apply a `<style>` block on import: every
 * class-driven fill and stroke silently becomes black. This rewrites the same
 * drawing with presentation attributes resolved from the theme, drops the
 * editor-only hit targets, and names each group after its node so the layer
 * list is readable.
 */

import { buildSVG } from "../render/svg.js";
import { esc } from "../render/primitives.js";

/**
 * class → presentation attributes. `parent` entries apply when an ancestor
 * carries that class, which is how the skin expresses accent nodes.
 */
function styleTable(theme) {
  const t = theme;
  return {
    "canvas-bg": { fill: t.paper },
    "canvas-grid": { fill: "none" },
    card: { fill: t.panel, stroke: t.line, "stroke-width": "1.25" },
    "card-rim": { fill: "none", stroke: t.line, "stroke-width": "1.25" },
    "node-title": { fill: t.ink },
    "node-sub": { fill: t.muted },
    "badge-text": { fill: t.muted },
    "node-badge": {},
    line: { fill: "none", stroke: t.lineStrong, "stroke-width": "1.4", "stroke-linejoin": "round" },
    "edge-label-text": { fill: t.muted },
    "lane-title": { fill: t.muted },
    "plot-bg": { fill: t.panel, stroke: t.line, "stroke-width": "1" },
    "axis-line": { fill: "none", stroke: t.lineStrong, "stroke-width": "1.25" },
    "grid-line": { fill: "none", stroke: t.line, "stroke-width": "1" },
    "axis-label": { fill: t.muted },
    caption: { fill: t.muted },
    mark: { fill: t.accent2 },
    "mark-line": { fill: "none", stroke: t.accent, "stroke-width": "2.5", "stroke-linejoin": "round" },
    "mark-area": { fill: t.accent, "fill-opacity": "0.12", stroke: "none" },
    "mark-label": { fill: t.muted },
    "mark-value": { fill: t.ink },
    lifeline: { fill: "none", stroke: t.line, "stroke-width": "1", "stroke-dasharray": "5 6" },
    "timeline-axis": { fill: "none", stroke: t.lineStrong, "stroke-width": "1.25" },
    "timeline-stem": { fill: "none", stroke: t.line, "stroke-width": "1" },
    "timeline-dot": { fill: t.paper, stroke: t.lineStrong, "stroke-width": "1.5" },
    "set-ring": { fill: t.accent, "fill-opacity": "0.14", stroke: t.accent, "stroke-width": "1.5" },
    "set-label": { fill: t.ink },
    tier: { fill: t.panel, stroke: t.line, "stroke-width": "1.25" },
    "tier-label": { fill: t.ink },
    hub: { fill: t.accent2, stroke: "none" },
    "hub-label": { fill: t.onAccent },
    "entity-header": { fill: t.panel, stroke: t.line, "stroke-width": "1.25" },
    "entity-row": { fill: "none", stroke: t.line, "stroke-width": "1" },
    "entity-field": { fill: t.ink },
    "entity-type": { fill: t.muted },
    "legend-label": { fill: t.muted },
    "legend-swatch": { fill: t.accent },
    "annotation-text": { fill: t.muted },
    "annotation-rule": { fill: "none", stroke: t.accent, "stroke-width": "2" },
    "annotation-leader": { fill: "none", stroke: t.line, "stroke-width": "1", "stroke-dasharray": "3 4" },
    "message-mask": { fill: t.paper },
    "ring-arc": { fill: "none", stroke: t.lineStrong, "stroke-width": "1.4" },
    "radar-ring": { fill: "none", stroke: t.line },
  };
}

/** Overrides that depend on an ancestor's class. */
function contextual(theme) {
  return {
    // An accent node is a tinted, bordered card rather than a solid block, so a
    // design tool import has to resolve the tint and the border, not a fill.
    "tone-accent": {
      card: { fill: theme.accentTint ?? theme.accent, stroke: theme.accent, "stroke-width": "1.75" },
      "node-title": { fill: theme.ink },
      "node-sub": { fill: theme.muted },
      tier: { fill: theme.accent, stroke: theme.accent },
      "tier-label": { fill: theme.onAccent },
      "entity-header": { fill: theme.accent, stroke: theme.accent },
      line: { stroke: theme.accent, "stroke-width": "2" },
    },
    "is-focus": {
      mark: { fill: theme.accent },
      tier: { fill: theme.accent, stroke: theme.accent },
      "timeline-dot": { fill: theme.accent, stroke: theme.accent },
      "entity-header": { fill: theme.accent, stroke: theme.accent },
    },
    "is-dashed": {
      card: { "stroke-dasharray": "6 6" },
      line: { "stroke-dasharray": "7 6" },
    },
    "role-external": { card: { "stroke-dasharray": "6 6" } },
    "role-legacy": { card: { "stroke-dasharray": "6 6" }, "node-title": { fill: theme.muted } },
    "role-store": { card: { fill: theme.paper } },
    "tone-solid": {
      card: { fill: theme.accent, stroke: theme.accent },
      "node-title": { fill: theme.onAccent },
      "node-sub": { fill: theme.onAccent },
    },
    lane: { rect: { fill: "none", stroke: theme.line, "stroke-width": "1", "stroke-dasharray": "4 5" } },
    "is-filled": { rect: { fill: theme.panel, "stroke-dasharray": "none" } },
    "set-1": { "set-ring": { fill: theme.accent2, stroke: theme.accent2 } },
    "set-2": { "set-ring": { fill: theme.ink, stroke: theme.ink, "fill-opacity": "0.08" } },
  };
}

const attributesFor = (classes, stack, table, context) => {
  const result = {};
  for (const name of classes) Object.assign(result, table[name] ?? {});
  // Ancestor classes, outermost first, then this element's own.
  for (const ancestor of [...stack.flat(), ...classes]) {
    const rules = context[ancestor];
    if (!rules) continue;
    for (const name of classes) Object.assign(result, rules[name] ?? {});
  }
  return result;
};

const serialise = (attributes) =>
  Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${esc(value)}"`)
    .join("");

/**
 * @param {object} diagram
 * @returns {string} SVG with presentation attributes and named layers
 */
export function toFlatSVG(diagram) {
  // Rendered with identity attached so layers can be named, then the editor
  // affordances are stripped below — a design file wants names, not tab stops.
  const source = buildSVG(diagram, { interactive: true, uid: "flat" });
  const table = styleTable(diagram.theme);
  const context = contextual(diagram.theme);

  const stack = [];
  let output = "";
  let index = 0;

  while (index < source.length) {
    const open = source.indexOf("<", index);
    if (open === -1) {
      output += source.slice(index);
      break;
    }
    output += source.slice(index, open);

    const close = source.indexOf(">", open);
    if (close === -1) {
      output += source.slice(open);
      break;
    }
    const tag = source.slice(open, close + 1);
    index = close + 1;

    // Drop the stylesheet and the invisible editor hit targets.
    if (tag.startsWith("<style")) {
      const end = source.indexOf("</style>", index);
      index = end === -1 ? source.length : end + 8;
      continue;
    }
    if (/class="[^"]*\bedge-hit\b/.test(tag)) continue;

    const isClosing = tag.startsWith("</");
    const name = tag.match(/^<\/?([\w:-]+)/)?.[1] ?? "";
    const selfClosing = tag.endsWith("/>");

    if (isClosing) {
      if (name === "g") stack.pop();
      output += tag;
      continue;
    }

    const classes = (tag.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/).filter(Boolean);
    const attributes = attributesFor([...classes, name], stack, table, context);

    let rewritten = tag
      .replace(/\s+tabindex="[^"]*"/g, "")
      .replace(/\s+role="button"/g, "")
      .replace(/\s+aria-label="[^"]*"/g, "");
    if (Object.keys(attributes).length) {
      rewritten = `${rewritten.slice(0, -(selfClosing ? 2 : 1))}${serialise(attributes)}${selfClosing ? "/>" : ">"}`;
    }

    // Name the layer after the node so the design tool's layer list is usable.
    const nodeId = rewritten.match(/data-node-id="([^"]+)"/)?.[1];
    if (nodeId) {
      const node = diagram.nodes.find((item) => item.id === nodeId);
      if (node) {
        rewritten = rewritten.replace(/^<g/, `<g id="${esc(node.label)}" data-name="${esc(node.label)}"`);
      }
    }

    output += rewritten;
    if (name === "g" && !selfClosing) stack.push(classes);
  }

  return output;
}
