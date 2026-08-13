/**
 * Brand extraction.
 *
 * Reads a stylesheet or page and maps what it finds onto the diagram's semantic
 * roles. It does not copy the first two hex values it sees: colours are
 * classified by saturation, lightness and how often they appear, and custom
 * properties are trusted over ad-hoc values because they are the site's own
 * design tokens. The result is then contrast-repaired, and every adjustment is
 * reported so the correction can be explained rather than hidden.
 */

import { lightnessOf, mix, normaliseColor, parseColor, rgbToHsl, saturationOf } from "./color.js";
import { bestOn, repairTheme } from "./contrast.js";
import { PALETTES, completeTheme } from "./palettes.js";

const COLOR_PATTERN = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)/gi;
const CUSTOM_PROPERTY = /--([\w-]+)\s*:\s*([^;}]+)/g;

/** Token-name hints, strongest first. */
const HINTS = [
  { role: "accent", pattern: /(primary|brand|accent|cta|link|highlight)/i },
  { role: "accent2", pattern: /(secondary|tertiary|alt|complement)/i },
  { role: "paper", pattern: /(background|bg|page|canvas|body)/i },
  { role: "panel", pattern: /(surface|card|panel|elevated|paper)/i },
  { role: "ink", pattern: /(foreground|text|ink|fg|heading|body-?color)/i },
  { role: "muted", pattern: /(muted|subtle|secondary-text|caption|placeholder)/i },
  { role: "line", pattern: /(border|divider|outline|rule|stroke)/i },
];

const hintFor = (name) => HINTS.find((hint) => hint.pattern.test(name))?.role ?? null;

/** Every concrete colour in the source, with how often it appears. */
export function collectColors(source) {
  const counts = new Map();
  for (const match of String(source).matchAll(COLOR_PATTERN)) {
    const hex = normaliseColor(match[0]);
    if (!hex) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  return counts;
}

/** Colours declared as custom properties, keyed by the role their name implies. */
export function collectTokens(source) {
  const tokens = new Map();
  for (const match of String(source).matchAll(CUSTOM_PROPERTY)) {
    const hex = normaliseColor(match[2].trim());
    if (!hex) continue;
    const role = hintFor(match[1]);
    if (role && !tokens.has(role)) tokens.set(role, hex);
  }
  return tokens;
}

const hueOf = (hex) => rgbToHsl(parseColor(hex) ?? { r: 0, g: 0, b: 0 }).h;
const hueDistance = (a, b) => {
  const delta = Math.abs(hueOf(a) - hueOf(b)) % 360;
  return delta > 180 ? 360 - delta : delta;
};

/** Score a colour's fitness as a foreground accent. */
const accentScore = (hex, count) => {
  const s = saturationOf(hex);
  const l = lightnessOf(hex);
  if (s < 0.18) return 0;                       // a neutral is not an accent
  if (l < 0.12 || l > 0.88) return 0;           // near-black and near-white are surfaces
  const midweight = 1 - Math.abs(l - 0.45) * 1.2;
  return s * Math.max(0.15, midweight) * Math.log2(1 + count);
};

/**
 * @param {string} source  HTML or CSS text
 * @param {string} [name]
 * @returns {{theme: object, report: {source: string, changes: object[], unresolved: string[], sampled: number, font: string|null}}}
 */
export function extractBrand(source, name = "Imported brand") {
  const counts = collectColors(source);
  const tokens = collectTokens(source);
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const font = String(source).match(/font-family\s*:\s*([^;}]+)/i)?.[1]?.split(",")[0].replace(/["']/g, "").trim() ?? null;

  const ranked = entries
    .map(([hex, count]) => ({ hex, count, score: accentScore(hex, count) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const accent = tokens.get("accent") ?? ranked[0]?.hex ?? PALETTES.editorial.accent;
  const accent2 =
    tokens.get("accent2") ??
    ranked.find((entry) => entry.hex !== accent && hueDistance(entry.hex, accent) > 40)?.hex ??
    mix(accent, PALETTES.editorial.accent2, 0.7);

  const surfaces = entries.filter(([hex]) => saturationOf(hex) < 0.35 && lightnessOf(hex) > 0.82);
  const inks = entries.filter(([hex]) => lightnessOf(hex) < 0.35);

  const paper = tokens.get("paper") ?? surfaces[0]?.[0] ?? "#ffffff";
  const dark = lightnessOf(paper) < 0.5;
  const ink = tokens.get("ink") ?? (dark ? "#f1efe7" : inks[0]?.[0] ?? PALETTES.editorial.ink);

  // A panel is a sibling surface of the page, one step away from it. On a dark
  // page that step goes lighter; on a light page it goes toward white. Deriving
  // it from `paper` alone flipped dark brands into an unreadable mix of a dark
  // page and a light card.
  const panel = tokens.get("panel") ?? (dark ? mix(paper, "#ffffff", 0.08) : lightnessOf(paper) > 0.95 ? paper : mix(paper, "#ffffff", 0.6));

  const draft = completeTheme({
    name,
    mode: dark ? "dark" : "light",
    paper,
    panel,
    ink,
    muted: tokens.get("muted") ?? mix(ink, paper, 0.42),
    accent,
    accent2,
    line: tokens.get("line") ?? mix(ink, paper, 0.76),
    lineStrong: mix(ink, paper, 0.18),
    onAccent: bestOn(accent, ["#ffffff", ink]),
    ...(font ? { font } : {}),
    source: "extracted",
  });

  const { theme, changes, unresolved } = repairTheme(draft);
  return {
    theme: { ...theme, name, source: "extracted", ...(font ? { font } : {}) },
    report: { source: "extracted", changes, unresolved, sampled: counts.size, font },
  };
}

/**
 * Deterministic fallback when a site cannot be read.
 * Derived from the domain so the same site always produces the same palette,
 * and clearly reported as derived rather than extracted.
 */
export function seededBrand(seed) {
  let hash = 0;
  for (const char of String(seed)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  const accent = `hsl(${hue} 58% 38%)`;
  const paper = `hsl(${hue} 20% 96%)`;
  const ink = `hsl(${hue} 30% 14%)`;

  const draft = completeTheme({
    name: String(seed),
    paper: normaliseColor(paper),
    panel: "#ffffff",
    ink: normaliseColor(ink),
    muted: mix(normaliseColor(ink), normaliseColor(paper), 0.42),
    accent: normaliseColor(accent),
    accent2: normaliseColor(`hsl(${(hue + 150) % 360} 46% 32%)`),
    line: mix(normaliseColor(ink), normaliseColor(paper), 0.76),
    lineStrong: mix(normaliseColor(ink), normaliseColor(paper), 0.18),
    onAccent: "#ffffff",
    source: "domain-derived",
  });

  const { theme, changes, unresolved } = repairTheme(draft);
  return {
    theme: { ...theme, name: String(seed), source: "domain-derived" },
    report: { source: "domain-derived", changes, unresolved, sampled: 0, font: null },
  };
}

/** One-line summary of what the extractor did, for the status bar. */
export function describeBrandReport(report) {
  if (report.source === "domain-derived") return "Coordinated palette derived from the domain (the site could not be read).";
  const parts = [`${report.sampled} colours sampled`];
  if (report.font) parts.push(`type: ${report.font}`);
  if (report.changes.length) parts.push(`${report.changes.length} adjusted for contrast`);
  if (report.unresolved.length) parts.push(`${report.unresolved.length} still below target`);
  return parts.join(" · ");
}
