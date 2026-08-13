/**
 * Deterministic text metrics.
 *
 * Layout must produce identical geometry in the browser studio, in `node --test`,
 * and in the Python CLI, so measurement never depends on a live font. Advance
 * widths come from a per-character table calibrated against Inter (sans) and
 * a fixed 0.6 em advance for monospace. Canvas measurement is deliberately not
 * used: a font that is still loading would silently change exported coordinates.
 */

const NARROW = "iljItfr.,;:!|'`()[]{}/\\-";
const WIDE = "mwMW";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Advance width in em units at weight 400. */
function baseAdvance(char) {
  if (char === " " || char === "\u00a0" || char === "\u2009") return 0.26;
  if (NARROW.includes(char)) return 0.3;
  if (WIDE.includes(char)) return 0.87;
  if (char >= "0" && char <= "9") return 0.57;
  if (UPPER.includes(char)) return 0.68;
  if (char >= "a" && char <= "z") return 0.55;
  // CJK, emoji and other full-width code points.
  if (char.codePointAt(0) > 0x2e7f) return 1;
  return 0.58;
}

/** Heavier weights track wider. 400 -> 1.00, 700 -> 1.04. */
const weightFactor = (weight) => 1 + Math.max(0, Math.min(900, weight) - 400) * 0.00013;

export const FONT_SANS = "sans";
export const FONT_MONO = "mono";
export const FONT_SERIF = "serif";

const familyFactor = { [FONT_SANS]: 1, [FONT_SERIF]: 0.98, [FONT_MONO]: null };

/**
 * @param {string} text
 * @param {{size?: number, weight?: number, family?: string, tracking?: number}} [style]
 * @returns {number} width in px
 */
export function measureText(text, style = {}) {
  const { size = 15, weight = 400, family = FONT_SANS, tracking = 0 } = style;
  const chars = [...String(text ?? "")];
  if (!chars.length) return 0;
  if (family === FONT_MONO) return chars.length * size * 0.6 + tracking * chars.length;
  const factor = weightFactor(weight) * (familyFactor[family] ?? 1);
  let em = 0;
  for (const char of chars) em += baseAdvance(char);
  return em * size * factor + tracking * chars.length;
}

/**
 * Greedy word wrap constrained by measured width.
 * Words longer than the line box are hard-broken rather than overflowing.
 *
 * @returns {string[]}
 */
export function wrapText(text, maxWidth, style = {}) {
  const source = String(text ?? "").trim();
  if (!source) return [];
  if (maxWidth <= 0) return [source];
  const lines = [];
  let current = "";

  const pushCurrent = () => {
    if (current) lines.push(current);
    current = "";
  };

  const hardBreak = (word) => {
    let piece = "";
    for (const char of word) {
      if (piece && measureText(piece + char, style) > maxWidth) {
        lines.push(piece);
        piece = char;
      } else {
        piece += char;
      }
    }
    return piece;
  };

  for (const word of source.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureText(candidate, style) <= maxWidth) {
      current = candidate;
      continue;
    }
    pushCurrent();
    current = measureText(word, style) > maxWidth ? hardBreak(word) : word;
  }
  pushCurrent();
  return lines;
}

/**
 * Wrap, then clamp to `maxLines`. The final line is ellipsised only when content
 * was actually dropped, and the caller is told so it can surface the truncation.
 *
 * @returns {{lines: string[], truncated: boolean, width: number, height: number}}
 */
export function layoutParagraph(text, maxWidth, style = {}, maxLines = Infinity, lineHeight) {
  const { size = 15 } = style;
  const leading = lineHeight ?? Math.round(size * 1.35);
  let lines = wrapText(text, maxWidth, style);
  let truncated = false;

  if (lines.length > maxLines) {
    truncated = true;
    lines = lines.slice(0, maxLines);
    const last = lines[maxLines - 1];
    let clipped = last;
    while (clipped && measureText(`${clipped}…`, style) > maxWidth) {
      clipped = clipped.slice(0, -1).trimEnd();
    }
    lines[maxLines - 1] = `${clipped}…`;
  }

  const width = lines.reduce((widest, line) => Math.max(widest, measureText(line, style)), 0);
  return { lines, truncated, width, height: lines.length * leading, leading };
}

/** Round up to the next multiple of `step` (default: the 4 px base grid). */
export const ceilTo = (value, step = 4) => Math.ceil(value / step) * step;
export const roundTo = (value, step = 4) => Math.round(value / step) * step;
export const floorTo = (value, step = 4) => Math.floor(value / step) * step;
