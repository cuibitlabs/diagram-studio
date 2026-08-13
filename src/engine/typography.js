/**
 * Editorial type scale.
 *
 * Every size, weight and leading value here is on the 4 px grid. Renderers must
 * take styles from this module rather than inlining numbers, so the skin linter
 * can prove the whole system uses one scale.
 */

import { FONT_MONO, FONT_SANS, FONT_SERIF } from "./text.js";

export { FONT_MONO, FONT_SANS, FONT_SERIF };

export const TYPE = {
  /** Editorial page title above a diagram. */
  diagramTitle: { size: 32, weight: 400, family: FONT_SERIF, leading: 36 },
  /** Standfirst / description under the title. */
  diagramLede: { size: 16, weight: 400, family: FONT_SANS, leading: 24 },
  /** Group, lane and section headings inside the canvas. */
  section: { size: 12, weight: 700, family: FONT_MONO, leading: 16, tracking: 1.2, uppercase: true },
  /** Primary node label. */
  nodeTitle: { size: 16, weight: 700, family: FONT_SANS, leading: 20 },
  /** Node label in dense structures (trees, matrices, charts). */
  nodeTitleSmall: { size: 14, weight: 700, family: FONT_SANS, leading: 20 },
  /** Secondary node line: role, technology, owner. */
  nodeSub: { size: 12, weight: 500, family: FONT_SANS, leading: 16 },
  /** Technical metadata: ports, IDs, field types. */
  meta: { size: 12, weight: 500, family: FONT_MONO, leading: 16 },
  /** Connector label. */
  edgeLabel: { size: 12, weight: 600, family: FONT_MONO, leading: 16 },
  /** Axis ticks and scale captions. */
  axis: { size: 12, weight: 600, family: FONT_MONO, leading: 16, tracking: 1, uppercase: true },
  /** Numeric value printed on a chart mark. */
  value: { size: 14, weight: 700, family: FONT_MONO, leading: 16 },
  /** Legend entry. */
  legend: { size: 12, weight: 600, family: FONT_SANS, leading: 16 },
  /** Annotation / margin note. */
  annotation: { size: 14, weight: 400, family: FONT_SERIF, leading: 20, italic: true },
};

/** Minimum readable label size per destination, from output-spec.md. */
export const MIN_LABEL_SIZE = { document: 14, web: 14, slide: 16, social: 18 };

/** CSS font stacks. Kept in one place so exports and the editor agree. */
export const FONT_STACK = {
  [FONT_SANS]: "Inter, 'Geist Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  [FONT_MONO]: "'Geist Mono', ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, monospace",
  [FONT_SERIF]: "'Instrument Serif', ui-serif, Georgia, 'Times New Roman', serif",
};

/** Inline SVG style attributes for a scale entry. */
export function fontAttrs(style) {
  const parts = [
    `font-family:${FONT_STACK[style.family] ?? FONT_STACK[FONT_SANS]}`,
    `font-size:${style.size}px`,
    `font-weight:${style.weight}`,
  ];
  if (style.tracking) parts.push(`letter-spacing:${style.tracking}px`);
  if (style.italic) parts.push("font-style:italic");
  return parts.join(";");
}

/** Apply the scale entry's casing rule to a label. */
export const applyCase = (value, style) => (style.uppercase ? String(value ?? "").toUpperCase() : String(value ?? ""));
