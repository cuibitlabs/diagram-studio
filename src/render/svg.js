/**
 * SVG document shell: identity, defs, skin, canvas fit, and dispatch to the
 * per-type renderer.
 *
 * Accessible-name ids are prefixed per render, so two diagrams can sit on one
 * page without their `aria-labelledby` references colliding.
 */

import { ceilTo } from "../engine/text.js";
import { FONT_MONO, FONT_SANS, FONT_SERIF, FONT_STACK, TYPE, fontAttrs } from "../engine/typography.js";
import { assignRanks } from "../engine/layout/graph.js";
import { annotationMarkup } from "./annotations.js";
import { plateMarkup } from "./plate.js";
import { getRenderer } from "../types/index.js";
import { iconSymbols, iconsUsedBy } from "./icons.js";
import { seriesColour } from "../theme/palettes.js";
import { CANVAS_PRESETS, applyAudience, fitToPreset, presetFor } from "./presets.js";
import { esc, text } from "./primitives.js";
import { skinCSS } from "./skin.js";

export const CANVAS = {
  margin: { top: 96, right: 96, bottom: 96, left: 96 },
  minWidth: 640,
  minHeight: 480,
  maxWidth: 2400,
  maxHeight: 1800,
};

/** Deterministic short id from any string, used to namespace defs. */
export function uidFor(seed = "diagram") {
  let hash = 0;
  for (const char of String(seed)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `d${hash.toString(36).slice(0, 7)}`;
}

function defs(uid, theme, icons = "") {
  return `<defs>
    ${icons}
    <marker id="${uid}-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <path d="M 0 1 L 9 5 L 0 9 Z" fill="var(--line-strong)"/>
    </marker>
    <marker id="${uid}-arrow-start" markerWidth="10" markerHeight="10" refX="1" refY="5" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <path d="M 10 1 L 1 5 L 10 9 Z" fill="var(--line-strong)"/>
    </marker>
    <marker id="${uid}-arrow-open" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <path d="M 1 1 L 10 6 L 1 11" fill="none" stroke="var(--line-strong)" stroke-width="1.5"/>
    </marker>
    <marker id="${uid}-dot" markerWidth="8" markerHeight="8" refX="4" refY="4" markerUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="3" fill="var(--accent)"/>
    </marker>
    <marker id="${uid}-crowfoot" markerWidth="14" markerHeight="14" refX="12" refY="7" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <path d="M 12 1 L 2 7 L 12 13 M 2 7 H 12" fill="none" stroke="var(--line-strong)" stroke-width="1.2"/>
    </marker>
    <marker id="${uid}-bar" markerWidth="10" markerHeight="14" refX="6" refY="7" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <path d="M 6 1 V 13" fill="none" stroke="var(--line-strong)" stroke-width="1.4"/>
    </marker>
    <pattern id="${uid}-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="${theme.line}" stroke-opacity="0.25" stroke-width="1"/>
    </pattern>
    <pattern id="${uid}-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <path d="M 0 0 V 8" stroke="${theme.line}" stroke-width="2" stroke-opacity="0.5"/>
    </pattern>
    <filter id="${uid}-sketch" x="-5%" y="-5%" width="110%" height="110%" filterUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>`;
}

/** CSS custom properties for one theme. */
export function themeVariables(theme, settings = {}, uid = "d") {
  return [
    `--font-sans:${FONT_STACK[FONT_SANS]}`,
    `--font-mono:${FONT_STACK[FONT_MONO]}`,
    `--font-serif:${FONT_STACK[FONT_SERIF]}`,
    `--sketch:url(#${uid}-sketch)`,
    `--paper:${theme.paper}`,
    `--paper-2:${theme.paper2 ?? theme.paper}`,
    `--panel:${theme.panel}`,
    `--ink:${theme.ink}`,
    `--muted:${theme.muted}`,
    `--soft:${theme.soft ?? theme.muted}`,
    `--accent:${theme.accent}`,
    `--accent-tint:${theme.accentTint ?? "transparent"}`,
    `--accent-2:${theme.accent2}`,
    `--link:${theme.link ?? theme.accent2}`,
    `--line:${theme.line}`,
    `--line-strong:${theme.lineStrong ?? theme.ink}`,
    `--on-accent:${theme.onAccent ?? "#ffffff"}`,
    `--series-0:${seriesColour(theme, 0)}`,
    `--series-1:${seriesColour(theme, 1)}`,
    `--series-2:${seriesColour(theme, 2)}`,
    `--corner:${settings.corner ?? 8}px`,
  ].join(";");
}

/**
 * Build the SVG for a diagram.
 *
 * @param {object} diagram
 * @param {{selectedId?:string, interactive?:boolean, uid?:string, fit?:boolean, showTitle?:boolean}} [options]
 * @returns {string}
 */
export function buildSVG(diagram, options = {}) {
  const uid = options.uid ?? uidFor(diagram.id ?? diagram.title ?? diagram.type);
  const renderer = getRenderer(diagram.type);
  const settings = diagram.settings ?? {};
  const showTitle = options.showTitle ?? settings.showTitle ?? false;
  const margin = { ...CANVAS.margin, ...(settings.margin ?? {}) };
  if (showTitle) margin.top = Math.max(margin.top, 160);
  // The plate rules and their labels need room outside the drawing.
  if (settings.plate) {
    margin.top = Math.max(margin.top, showTitle ? 200 : 112);
    margin.bottom = Math.max(margin.bottom, 112);
  }

  const selectedIds = new Set(options.selectedIds ?? (options.selectedId ? [options.selectedId] : []));
  const ctx = {
    uid,
    theme: diagram.theme,
    settings,
    selectedId: options.selectedId ?? null,
    selectedIds,
    interactive: options.interactive ?? true,
    corner: settings.corner ?? 8,
    dense: settings.density === "detailed",
    margin,
  };

  // The audience dial runs before layout so boxes are measured against the text
  // that will actually be drawn.
  const audience = applyAudience(diagram, settings.audience);

  // Motion is opt-in and staggered by reading order, so a reveal follows the
  // same sequence a reader would take.
  if (settings.motion && diagram.edges?.length) {
    const ranks = assignRanks(diagram.nodes, diagram.edges);
    ctx.steps = new Map(diagram.nodes.map((node) => [node.id, ranks.get(node.id) ?? 0]));
    for (const edge of diagram.edges) {
      ctx.steps.set(edge.id, Math.max(ctx.steps.get(edge.source) ?? 0, ctx.steps.get(edge.target) ?? 0));
    }
  } else if (settings.motion) {
    ctx.steps = new Map(diagram.nodes.map((node, index) => [node.id, index]));
  }

  const layout = renderer.layout(diagram, ctx) ?? {};
  const fit = options.fit ?? settings.autoFit !== false;

  let width = diagram.width || CANVAS.minWidth;
  let height = diagram.height || CANVAS.minHeight;

  // A named preset pins the canvas and centres the drawing in it — a deck wants
  // every diagram on the same stage regardless of what it contains.
  const preset = presetFor(settings.preset);
  const pinned = preset.width ? fitToPreset(diagram, preset, margin) : null;

  if (pinned) {
    width = pinned.width;
    height = pinned.height;
  } else if (fit && layout.width && layout.height) {
    width = ceilTo(Math.min(CANVAS.maxWidth, Math.max(CANVAS.minWidth, layout.width + margin.left + margin.right)), 8);
    height = ceilTo(Math.min(CANVAS.maxHeight, Math.max(CANVAS.minHeight, layout.height + margin.top + margin.bottom)), 8);
  }
  diagram.width = width;
  diagram.height = height;
  ctx.width = width;
  ctx.height = height;

  const body = renderer.draw(diagram, ctx, layout);
  const heading = showTitle
    ? `<g class="diagram-heading">${text(diagram.title, margin.left, 72, TYPE.diagramTitle, { className: "diagram-title-text" })}${
        diagram.description ? text(diagram.description, margin.left, 108, TYPE.diagramLede, { className: "diagram-lede" }) : ""
      }</g>`
    : "";

  const contentClasses = [
    "diagram-content",
    settings.style && settings.style !== "editorial" ? `style-${settings.style}` : "",
    settings.motion ? `motion-${settings.motion}` : "",
    audience.audience !== "mixed" ? `audience-${audience.audience}` : "",
  ].filter(Boolean).join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" class="ds-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${uid}-title ${uid}-desc" style="${themeVariables(diagram.theme, settings, uid)}">
  <title id="${uid}-title">${esc(diagram.title)}</title>
  <desc id="${uid}-desc">${esc(diagram.description || `${diagram.type} diagram with ${diagram.nodes.length} elements.`)}</desc>
  ${defs(uid, diagram.theme, iconSymbols(iconsUsedBy(diagram), uid))}
  <style>${skinCSS()}</style>
  <rect class="canvas-bg" x="0" y="0" width="${width}" height="${height}"/>
  ${settings.grid ? `<rect class="canvas-grid" x="0" y="0" width="${width}" height="${height}" fill="url(#${uid}-grid)"/>` : ""}
  ${heading}
  ${settings.plate ? plateMarkup(diagram, ctx, { typeLabel: renderer.label }) : ""}
  <g class="${contentClasses}">${body}</g>
  ${annotationMarkup(diagram, ctx)}
</svg>`;
}

/** Style attributes for a scale entry — re-exported for type renderers. */
export { fontAttrs };
