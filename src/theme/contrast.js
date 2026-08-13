/**
 * Contrast measurement and repair.
 *
 * This module implements WCAG 2.1 relative-luminance contrast only. APCA was
 * considered and left out on purpose: its constants have changed across draft
 * revisions and shipping a version that cannot be checked against the spec
 * would give false confidence in a number people rely on. WCAG 2.1 is stable,
 * exactly specified, and is what accessibility audits are run against.
 */

import { lightnessOf, parseColor, rgbToHsl, toHex } from "./color.js";

/** Text-size thresholds from WCAG 2.1 §1.4.3 and §1.4.11. */
export const TARGET = {
  bodyText: 4.5,   // normal-size text
  largeText: 3,    // >= 18.66px bold or >= 24px
  graphics: 3,     // essential graphical objects and UI boundaries
};

const channel = (value) => {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance, 0–1. */
export function luminance(color) {
  const rgb = parseColor(color);
  if (!rgb) return 0;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export const passes = (a, b, target = TARGET.bodyText) => contrastRatio(a, b) >= target;

/**
 * Move a colour's lightness — keeping its hue and saturation — until it meets
 * the target against `background`.
 *
 * Direction is chosen by which end has more headroom, so a mid-tone on a light
 * page darkens rather than being washed out to white.
 *
 * @returns {{color:string, ratio:number, adjusted:boolean, achieved:boolean}}
 */
export function repairContrast(color, background, target = TARGET.bodyText) {
  const start = parseColor(color);
  if (!start) return { color, ratio: 0, adjusted: false, achieved: false };

  const current = contrastRatio(color, background);
  if (current >= target) return { color: toHex(start), ratio: current, adjusted: false, achieved: true };

  const { h, s, l } = rgbToHsl(start);

  // Search both directions, nearest first. Committing to one direction up front
  // fails whenever the colour is already at that end of the range — white text
  // on a mid-tone accent can only be fixed by going darker, not lighter.
  const candidates = [];
  for (let step = 1; step <= 100; step++) {
    const up = l + step * 0.01;
    const down = l - step * 0.01;
    if (down >= 0) candidates.push(down);
    if (up <= 1) candidates.push(up);
    if (down < 0 && up > 1) break;
  }

  let best = { color: toHex(start), ratio: current };
  for (const nextL of candidates) {
    const candidate = hslHex(h, s, nextL);
    const ratio = contrastRatio(candidate, background);
    if (ratio > best.ratio) best = { color: candidate, ratio };
    if (ratio >= target) return { color: candidate, ratio, adjusted: true, achieved: true };
  }

  // Desaturating buys extra range when a vivid hue cannot reach the target.
  const away = lightnessOf(background) > 0.5 ? 0.08 : 0.96;
  for (let step = 1; step <= 10; step++) {
    const candidate = hslHex(h, Math.max(0, s - step * 0.1), away);
    const ratio = contrastRatio(candidate, background);
    if (ratio > best.ratio) best = { color: candidate, ratio };
    if (ratio >= target) return { color: candidate, ratio, adjusted: true, achieved: true };
  }

  return { ...best, adjusted: true, achieved: best.ratio >= target };
}

function hslHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((((h % 360) + 360) % 360) / 60) % 2 - 1));
  const m = l - c / 2;
  const hue = ((h % 360) + 360) % 360;
  const [r, g, b] =
    hue < 60 ? [c, x, 0] :
    hue < 120 ? [x, c, 0] :
    hue < 180 ? [0, c, x] :
    hue < 240 ? [0, x, c] :
    hue < 300 ? [x, 0, c] : [c, 0, x];
  return toHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

/** Pick whichever of two foregrounds reads better on `background`. */
export const bestOn = (background, options = ["#ffffff", "#111111"]) =>
  options.reduce((best, option) => (contrastRatio(option, background) > contrastRatio(best, background) ? option : best));

/**
 * The pairs a theme has to satisfy, with the size class each is used at.
 *
 * Ordered by dependency: a role that acts as someone else's background is
 * repaired before the foreground that sits on it, so one pass settles most
 * themes and `repairTheme` only needs a short fixed point loop.
 */
export const THEME_PAIRS = [
  { id: "accent-on-paper", fg: "accent", bg: "paper", target: TARGET.graphics, note: "accent marks and rules" },
  { id: "accent2-on-paper", fg: "accent2", bg: "paper", target: TARGET.graphics, note: "secondary marks" },
  { id: "ink-on-paper", fg: "ink", bg: "paper", target: TARGET.bodyText, note: "diagram titles and free text" },
  { id: "ink-on-panel", fg: "ink", bg: "panel", target: TARGET.bodyText, note: "node titles" },
  { id: "muted-on-panel", fg: "muted", bg: "panel", target: TARGET.bodyText, note: "lane and section labels" },
  { id: "muted-on-paper", fg: "muted", bg: "paper", target: TARGET.bodyText, note: "axis labels and captions" },
  { id: "soft-on-panel", fg: "soft", bg: "panel", target: TARGET.bodyText, note: "node sublabels at 12px" },
  { id: "soft-on-paper2", fg: "soft", bg: "paper2", target: TARGET.bodyText, note: "sublabels inside a filled lane" },
  { id: "link-on-paper", fg: "link", bg: "paper", target: TARGET.bodyText, note: "external call labels" },
  { id: "linestrong-on-paper", fg: "lineStrong", bg: "paper", target: TARGET.graphics, note: "connectors" },
  { id: "onaccent-on-accent", fg: "onAccent", bg: "accent", target: TARGET.bodyText, note: "text inside an accent node" },
  { id: "line-on-panel", fg: "line", bg: "panel", target: 1.4, decorative: true, note: "hairline borders (decorative)" },
];

/** Roles that are surfaces: repair never moves these. */
export const BACKGROUND_ROLES = new Set(["paper", "paper2", "panel"]);

/**
 * Audit a theme.
 *
 * @returns {{pair:string, fg:string, bg:string, ratio:number, target:number, pass:boolean, note:string}[]}
 */
export function auditTheme(theme) {
  return THEME_PAIRS.map((pair) => {
    const ratio = contrastRatio(theme[pair.fg], theme[pair.bg]);
    return {
      pair: pair.id,
      fg: pair.fg,
      bg: pair.bg,
      ratio: Math.round(ratio * 100) / 100,
      target: pair.target,
      pass: ratio >= pair.target,
      decorative: Boolean(pair.decorative),
      note: pair.note,
    };
  });
}

/**
 * Repair a theme in place of failing pairs, preserving hue.
 *
 * Backgrounds are never moved — a brand's page colour is the one value people
 * recognise. Foregrounds and `onAccent` are adjusted instead.
 *
 * @returns {{theme:object, changes:{role:string,from:string,to:string,ratio:number}[], unresolved:string[]}}
 */
export function repairTheme(theme, { passes: maxPasses = 3 } = {}) {
  const next = { ...theme };
  const original = { ...theme };
  const touched = new Map();

  // `accent` is both a foreground (marks on paper) and a background (text
  // inside an accent node), so one pass can invalidate an earlier fix. Iterate
  // until nothing moves, which for these nine pairs settles in two passes.
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;
    for (const pair of THEME_PAIRS) {
      if (pair.decorative) continue; // no text depends on it
      if (BACKGROUND_ROLES.has(pair.fg)) continue;
      const from = next[pair.fg];
      const result = repairContrast(from, next[pair.bg], pair.target);
      if (result.adjusted && result.color !== from) {
        next[pair.fg] = result.color;
        touched.set(pair.fg, { role: pair.fg, from: original[pair.fg], to: result.color, ratio: Math.round(result.ratio * 100) / 100 });
        changed = true;
      }
    }
    if (!changed) break;
  }

  const unresolved = auditTheme(next).filter((row) => !row.pass && !row.decorative).map((row) => row.pair);
  return { theme: next, changes: [...touched.values()], unresolved };
}

/**
 * Colour-vision simulation (Brettel/Viénot-style linear approximations).
 * Used by the editor preview to prove a diagram still reads without hue.
 */
const CVD_MATRICES = {
  protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
};

export const CVD_TYPES = Object.keys(CVD_MATRICES);

export function simulateCVD(color, kind) {
  const matrix = CVD_MATRICES[kind];
  const rgb = parseColor(color);
  if (!matrix || !rgb) return color;
  return toHex({
    r: rgb.r * matrix[0] + rgb.g * matrix[1] + rgb.b * matrix[2],
    g: rgb.r * matrix[3] + rgb.g * matrix[4] + rgb.b * matrix[5],
    b: rgb.r * matrix[6] + rgb.g * matrix[7] + rgb.b * matrix[8],
  });
}

/** Apply a simulation across every role in a theme. */
export const simulateTheme = (theme, kind) =>
  Object.fromEntries(
    Object.entries(theme).map(([key, value]) => [key, typeof value === "string" && value.startsWith("#") ? simulateCVD(value, kind) : value]),
  );
