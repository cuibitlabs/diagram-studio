/**
 * Reusable SVG drawing primitives.
 *
 * Every type renderer composes these, so a change to the visual system lands
 * everywhere at once and the skin linter has a single place to check.
 */

import { BOX } from "../engine/box.js";
import { layoutParagraph, measureText } from "../engine/text.js";
import { TYPE, applyCase, fontAttrs } from "../engine/typography.js";
import { ROLE_SHAPE, shapePath } from "./shapes.js";

export const esc = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const num = (value) => (Math.round(value * 100) / 100).toString();

/** A single `<text>` element. */
export function text(content, x, y, style = TYPE.nodeTitle, options = {}) {
  const { anchor = "start", className = "", dominant } = options;
  if (content === "" || content === null || content === undefined) return "";
  return `<text class="${className}" x="${num(x)}" y="${num(y)}" text-anchor="${anchor}"${
    dominant ? ` dominant-baseline="${dominant}"` : ""
  } style="${fontAttrs(style)}">${esc(applyCase(content, style))}</text>`;
}

/** Multi-line text block, one `<text>` per line so exports stay editable. */
export function textBlock(lines, x, y, style, options = {}) {
  const leading = style.leading ?? Math.round(style.size * 1.35);
  return lines
    .map((line, index) => text(line, x, y + index * leading, style, options))
    .join("");
}

/** Resolve a node's shape from explicit `shape`, then `role`, then a default. */
export const shapeOf = (node, fallback = "box") => node.shape || ROLE_SHAPE[node.role] || fallback;

/**
 * Lay a node's text out inside its *current* box, so a manually resized node
 * re-wraps instead of overflowing.
 */
export function nodeText(node, spec = {}) {
  const shape = shapeOf(node, spec.shape);
  const geometry = shapePath(shape, { x: 0, y: 0, w: node.w, h: node.h }, spec.corner ?? 8);
  const padX = (spec.padX ?? BOX.padX) + (geometry.inset.x ?? 0);
  const padY = (spec.padY ?? BOX.padY) + (geometry.inset.y ?? 0);
  const titleStyle = spec.titleStyle ?? (spec.dense ? TYPE.nodeTitleSmall : TYPE.nodeTitle);
  const subStyle = spec.subStyle ?? TYPE.nodeSub;
  const iconAllowance = node.icon ? BOX.iconSize + BOX.iconGap : 0;
  const inner = Math.max(24, node.w - padX * 2 - iconAllowance);

  const title = layoutParagraph(node.label, inner, titleStyle, spec.maxTitleLines ?? BOX.maxTitleLines, titleStyle.leading);
  const subSource = node.sublabel ? String(node.sublabel).trim() : "";
  const sub = subSource ? layoutParagraph(subSource, inner, subStyle, spec.maxSubLines ?? BOX.maxSubLines, subStyle.leading) : null;

  const contentHeight = title.height + (sub ? BOX.gap + sub.height : 0);
  const centred = geometry.textAnchor === "middle" || spec.centre;
  const startY = node.y + Math.max(padY, (node.h - contentHeight) / 2) + titleStyle.size * 0.82;
  const startX = centred ? node.x + node.w / 2 : node.x + padX + iconAllowance;

  return { title, sub, startX, startY, centred, titleStyle, subStyle, geometry, shape, padX, padY };
}

/**
 * Draw a node.
 *
 * @param {object} node
 * @param {object} [spec] `{corner, dense, selectedId, shape, titleStyle, subStyle, interactive}`
 */
export function nodeCard(node, spec = {}) {
  const layout = nodeText(node, spec);
  const geometry = shapePath(layout.shape, { x: node.x, y: node.y, w: node.w, h: node.h }, spec.corner ?? 8);
  const classes = [
    "ds-node",
    `shape-${layout.shape}`,
    node.tone === "accent" ? "tone-accent" : node.tone === "muted" ? "tone-muted" : "tone-default",
    node.role ? `role-${node.role}` : "",
    node.dashed ? "is-dashed" : "",
    spec.selectedIds?.has(node.id) || spec.selectedId === node.id ? "is-selected" : "",
  ].filter(Boolean).join(" ");

  const anchor = layout.centred ? "middle" : "start";
  const titleMarkup = textBlock(layout.title.lines, layout.startX, layout.startY, layout.titleStyle, { anchor, className: "node-title" });
  const subMarkup = layout.sub
    ? textBlock(
        layout.sub.lines,
        layout.startX,
        layout.startY + layout.title.height + BOX.gap,
        layout.subStyle,
        { anchor, className: "node-sub" },
      )
    : "";

  const icon = node.icon && spec.uid
    ? `<use class="node-icon" href="#${spec.uid}-icon-${esc(node.icon)}" x="${num(node.x + layout.padX)}" y="${num(node.y + layout.padY)}" width="${BOX.iconSize}" height="${BOX.iconSize}"/>`
    : "";

  const badge = node.badge
    ? `<g class="node-badge"><rect x="${num(node.x + node.w - BOX.badge - 12)}" y="${num(node.y + 12)}" width="${BOX.badge}" height="20" rx="10"/>${text(
        node.badge,
        node.x + node.w - BOX.badge / 2 - 12,
        node.y + 26,
        TYPE.meta,
        { anchor: "middle", className: "badge-text" },
      )}</g>`
    : "";

  const interactive = spec.interactive === false
    ? ""
    : ` data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}${node.sublabel ? `. ${esc(node.sublabel)}` : ""}"`;
  const step = spec.steps?.has(node.id) ? ` style="--step:${spec.steps.get(node.id)}"` : "";

  return `<g class="${classes}"${interactive}${step}>
    <path class="card" d="${geometry.d}"/>${geometry.rim ? `<path class="card-rim" d="${geometry.rim}"/>` : ""}
    ${icon}${titleMarkup}${subMarkup}${badge}
  </g>`;
}

/**
 * Draw a routed connector.
 *
 * @param {object} edge
 * @param {{d:string, labelAnchor:object}} route
 */
export function connector(edge, route, spec = {}) {
  if (!route) return "";
  const classes = [
    "ds-edge",
    edge.dashed ? "is-dashed" : "",
    edge.tone === "accent" ? "tone-accent" : "",
    edge.kind ? `kind-${edge.kind}` : "",
    spec.selectedId === edge.id ? "is-selected" : "",
  ].filter(Boolean).join(" ");

  const marker = spec.marker ?? "arrow";
  const startMarker = edge.bidirectional ? ` marker-start="url(#${spec.uid}-${marker}-start)"` : "";
  const label = String(edge.label ?? "").trim();
  let labelMarkup = "";

  if (label) {
    const style = TYPE.edgeLabel;
    const width = measureText(label, style) + 16;
    const height = style.leading + 6;
    const anchor = route.labelAnchor;
    // Sit the label clear of the line rather than on top of it.
    const cx = anchor.horizontal ? anchor.x : anchor.x + width / 2 + 8;
    const cy = anchor.horizontal ? anchor.y - height / 2 - 4 : anchor.y;
    labelMarkup = `<g class="edge-label"><rect x="${num(cx - width / 2)}" y="${num(cy - height / 2)}" width="${num(width)}" height="${num(height)}" rx="6"/>${text(
      label,
      cx,
      cy + style.size * 0.35,
      style,
      { anchor: "middle", className: "edge-label-text" },
    )}</g>`;
  }

  const step = spec.steps?.has(edge.id) ? ` style="--step:${spec.steps.get(edge.id)}"` : "";

  return `<g class="${classes}" data-edge-id="${esc(edge.id)}"${step}>
    <path class="edge-hit" d="${route.d}"/>
    <path class="line" d="${route.d}" marker-end="url(#${spec.uid}-${marker})"${startMarker}/>
    ${labelMarkup}
  </g>`;
}

/** Lane or group container with a title strip. */
export function container(rect, label, options = {}) {
  const { className = "lane", titleStyle = TYPE.section, orientation = "horizontal", id } = options;
  const titleMarkup = label
    ? orientation === "vertical"
      ? `<g transform="translate(${num(rect.x + 20)} ${num(rect.y + rect.h - 20)}) rotate(-90)">${text(label, 0, 0, titleStyle, { className: "lane-title" })}</g>`
      : text(label, rect.x + 20, rect.y + 26, titleStyle, { className: "lane-title" })
    : "";
  return `<g class="${className}"${id ? ` data-group-id="${esc(id)}"` : ""}>
    <rect x="${num(rect.x)}" y="${num(rect.y)}" width="${num(rect.w)}" height="${num(rect.h)}" rx="10"/>
    ${titleMarkup}
  </g>`;
}

/** Horizontal or vertical rule. */
export const rule = (x1, y1, x2, y2, className = "grid-line") =>
  `<path class="${className}" d="M ${num(x1)} ${num(y1)} L ${num(x2)} ${num(y2)}"/>`;

/** Plot frame with optional value gridlines. */
export function plotFrame(area, options = {}) {
  const { gridValues = [], max = 1, axisLabel, formatter = (value) => String(value) } = options;
  const lines = gridValues
    .map((value) => {
      const y = area.y + area.h - (area.h * value) / (max || 1);
      return `${rule(area.x, y, area.x + area.w, y)}${text(formatter(value), area.x - 12, y + 4, TYPE.axis, { anchor: "end", className: "axis-label" })}`;
    })
    .join("");
  return `<rect class="plot-bg" x="${num(area.x)}" y="${num(area.y)}" width="${num(area.w)}" height="${num(area.h)}" rx="4"/>
    ${lines}
    <path class="axis-line" d="M ${num(area.x)} ${num(area.y)} V ${num(area.y + area.h)} H ${num(area.x + area.w)}"/>
    ${axisLabel ? text(axisLabel, area.x, area.y - 16, TYPE.axis, { className: "axis-label" }) : ""}`;
}

/** Legend row. Only emitted when a diagram actually encodes more than one series. */
export function legend(entries, x, y) {
  if (!entries.length) return "";
  let cursor = x;
  const items = entries
    .map((entry) => {
      const width = measureText(entry.label, TYPE.legend) + 34;
      const markup = `<g class="legend-item"><rect class="legend-swatch ${entry.className ?? ""}" x="${num(cursor)}" y="${num(y - 9)}" width="12" height="12" rx="3"/>${text(
        entry.label,
        cursor + 20,
        y + 1,
        TYPE.legend,
        { className: "legend-label" },
      )}</g>`;
      cursor += width;
      return markup;
    })
    .join("");
  return `<g class="legend">${items}</g>`;
}

/** Small caption used for units, sources and fidelity notes. */
export const caption = (value, x, y) => text(value, x, y, TYPE.meta, { className: "caption" });
