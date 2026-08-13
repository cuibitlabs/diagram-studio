/**
 * SVG document shell: identity, defs, skin, canvas fit, and dispatch to the
 * per-type renderer.
 *
 * Accessible-name ids are prefixed per render, so two diagrams can sit on one
 * page without their `aria-labelledby` references colliding.
 */

import { ceilTo } from "../engine/text.js";
import { TYPE, fontAttrs } from "../engine/typography.js";
import { getRenderer } from "../types/index.js";
import { iconSymbols, iconsUsedBy } from "./icons.js";
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
  </defs>`;
}

/** CSS custom properties for one theme. */
export function themeVariables(theme, settings = {}) {
  return [
    `--paper:${theme.paper}`,
    `--panel:${theme.panel}`,
    `--ink:${theme.ink}`,
    `--muted:${theme.muted}`,
    `--accent:${theme.accent}`,
    `--accent-2:${theme.accent2}`,
    `--line:${theme.line}`,
    `--line-strong:${theme.lineStrong ?? theme.ink}`,
    `--on-accent:${theme.onAccent ?? "#ffffff"}`,
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

  const ctx = {
    uid,
    theme: diagram.theme,
    settings,
    selectedId: options.selectedId ?? null,
    interactive: options.interactive ?? true,
    corner: settings.corner ?? 8,
    dense: settings.density === "detailed",
    margin,
  };

  const layout = renderer.layout(diagram, ctx) ?? {};
  const fit = options.fit ?? settings.autoFit !== false;

  let width = diagram.width || CANVAS.minWidth;
  let height = diagram.height || CANVAS.minHeight;
  if (fit && layout.width && layout.height) {
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

  return `<svg xmlns="http://www.w3.org/2000/svg" class="ds-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${uid}-title ${uid}-desc" style="${themeVariables(diagram.theme, settings)}">
  <title id="${uid}-title">${esc(diagram.title)}</title>
  <desc id="${uid}-desc">${esc(diagram.description || `${diagram.type} diagram with ${diagram.nodes.length} elements.`)}</desc>
  ${defs(uid, diagram.theme, iconSymbols(iconsUsedBy(diagram), uid))}
  <style>${skinCSS()}</style>
  <rect class="canvas-bg" x="0" y="0" width="${width}" height="${height}"/>
  ${settings.grid ? `<rect class="canvas-grid" x="0" y="0" width="${width}" height="${height}" fill="url(#${uid}-grid)"/>` : ""}
  ${heading}
  <g class="diagram-content">${body}</g>
</svg>`;
}

/** Style attributes for a scale entry — re-exported for type renderers. */
export { fontAttrs };
