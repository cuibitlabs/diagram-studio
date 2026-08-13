/**
 * Theme palettes.
 *
 * Roles, not colour names: `paper` is the page, `panel` is a surface, `ink` is
 * body text, `accent` is the one thing you want read first. Every palette here
 * has been checked with `src/theme/contrast.js` at the sizes the type scale
 * actually uses.
 */

/**
 * @typedef {{
 *   name:string, mode:"light"|"dark",
 *   paper:string, paper2:string, panel:string,
 *   ink:string, muted:string, soft:string,
 *   accent:string, accentTint:string, accent2:string, link:string,
 *   line:string, lineStrong:string, onAccent:string
 * }} Palette
 *
 * `paper2` is a recessed surface (lane fills, plot grounds), `soft` is a third
 * text weight below `muted` for sublabels and boundary labels, `accentTint` is
 * the fill behind an accent-bordered box, and `link` is reserved for calls that
 * leave the system — an external arrow that reads differently from an internal
 * one without spending the accent on it.
 */

/** @type {Record<string, Palette>} */
export const PALETTES = {
  editorial: {
    name: "Paper & coral",
    mode: "light",
    paper: "#f3f0e9",
    panel: "#fffdf8",
    ink: "#1d211f",
    muted: "#5f665f",
    accent: "#c2452a",
    accent2: "#174f46",
    line: "#c3bfb5",
    lineStrong: "#3a403c",
    onAccent: "#fffdf8",
    paper2: "#e7e3da",
    soft: "#5a615d",
    accentTint: "rgba(194,69,42,0.09)",
    link: "#1a4b9c",
  },
  midnight: {
    name: "Midnight",
    mode: "dark",
    paper: "#111512",
    panel: "#1a201c",
    ink: "#f1efe7",
    muted: "#a3ada5",
    accent: "#ff7557",
    accent2: "#64d8b0",
    line: "#3d453f",
    lineStrong: "#c9d1ca",
    onAccent: "#16110f",
    paper2: "#20261f",
    soft: "#b3bdb5",
    accentTint: "rgba(255,117,87,0.14)",
    link: "#7fb6ef",
  },
  cobalt: {
    name: "Cobalt",
    mode: "light",
    paper: "#eef3fb",
    panel: "#ffffff",
    ink: "#15233d",
    muted: "#5a6780",
    accent: "#1f4fbf",
    accent2: "#a8305a",
    line: "#bcc8de",
    lineStrong: "#2c3a55",
    onAccent: "#ffffff",
    paper2: "#e2e9f5",
    soft: "#556279",
    accentTint: "rgba(31,79,191,0.08)",
    link: "#0f5f8a",
  },
  moss: {
    name: "Moss",
    mode: "light",
    paper: "#eef0e5",
    panel: "#fafbf5",
    ink: "#232d23",
    muted: "#5b6459",
    accent: "#4a6438",
    accent2: "#a4522f",
    line: "#bcc2b4",
    lineStrong: "#3a453a",
    onAccent: "#fafbf5",
    paper2: "#e4e7d9",
    soft: "#565f54",
    accentTint: "rgba(74,100,56,0.09)",
    link: "#2a5c8f",
  },
  mono: {
    name: "Monochrome",
    mode: "light",
    paper: "#f4f4f2",
    panel: "#ffffff",
    ink: "#161616",
    muted: "#5d5d5b",
    accent: "#161616",
    accent2: "#6b6b66",
    line: "#c2c2be",
    lineStrong: "#2b2b2b",
    onAccent: "#ffffff",
    paper2: "#e9e9e6",
    soft: "#585856",
    accentTint: "rgba(22,22,22,0.07)",
    link: "#2b4f80",
  },
  graphite: {
    name: "Graphite",
    mode: "dark",
    paper: "#16181a",
    panel: "#202426",
    ink: "#eceef0",
    muted: "#a2a8ad",
    accent: "#f0a04b",
    accent2: "#6fb3d2",
    line: "#3a4045",
    lineStrong: "#c7ccd1",
    onAccent: "#1a1512",
    paper2: "#1d2124",
    soft: "#9aa1a7",
    accentTint: "rgba(240,160,75,0.14)",
    link: "#8fc4e8",
  },
  harbour: {
    name: "Harbour",
    mode: "light",
    paper: "#eef2f2",
    panel: "#ffffff",
    ink: "#12262b",
    muted: "#54666b",
    accent: "#0d6273",
    accent2: "#b2523a",
    line: "#bccacc",
    lineStrong: "#294146",
    onAccent: "#ffffff",
    paper2: "#e2e8e8",
    soft: "#4f6165",
    accentTint: "rgba(13,98,115,0.08)",
    link: "#8a4620",
  },
  terracotta: {
    name: "Terracotta",
    mode: "light",
    paper: "#f6efe8",
    panel: "#fffaf4",
    ink: "#2a1f18",
    muted: "#6a584c",
    accent: "#a8442a",
    accent2: "#3f5c52",
    line: "#cbbdb0",
    lineStrong: "#443428",
    onAccent: "#fffaf4",
    paper2: "#ece3d9",
    soft: "#645449",
    accentTint: "rgba(168,68,42,0.09)",
    link: "#3a5a8f",
  },
};

export const PALETTE_IDS = Object.keys(PALETTES);

/** Dark counterpart used by the dark variant export. */
export const DARK_FOR = {
  editorial: "midnight",
  cobalt: "midnight",
  moss: "graphite",
  mono: "graphite",
  harbour: "midnight",
  terracotta: "graphite",
  midnight: "midnight",
  graphite: "graphite",
};

export const paletteOf = (id) => ({ ...(PALETTES[id] ?? PALETTES.editorial) });

/**
 * Series colours for the chart types that genuinely compare more than one
 * entity. The accent stays reserved for the focal series, so these are
 * deliberately quieter than it: a chart with six equally loud series has no
 * focal point at all.
 */
export const SERIES = {
  light: ["#5d7c8a", "#8a6f4e", "#6c7f5a", "#7d6183", "#4f6f6a", "#8b5f5f"],
  dark: ["#8fb4c4", "#c4a274", "#a2bd8a", "#b493bb", "#7fada6", "#c08f8f"],
};

export const seriesColour = (theme, index) => {
  const set = SERIES[theme?.mode === "dark" ? "dark" : "light"];
  return set[index % set.length];
};

/**
 * Fill in derived roles for a theme that came from brand extraction.
 * Anything the source did not name is mixed from what it did.
 */
export function completeTheme(theme) {
  const fallback = PALETTES.editorial;
  const dark = (theme.mode ?? "light") === "dark";
  const paper = theme.paper ?? fallback.paper;
  const ink = theme.ink ?? fallback.ink;
  const accent = theme.accent ?? fallback.accent;

  return {
    mode: theme.mode ?? "light",
    paper,
    paper2: theme.paper2 ?? blend(paper, ink, dark ? 0.06 : 0.05),
    panel: theme.panel ?? fallback.panel,
    ink,
    muted: theme.muted ?? fallback.muted,
    soft: theme.soft ?? blend(theme.muted ?? fallback.muted, ink, 0.12),
    accent,
    accentTint: theme.accentTint ?? tint(accent, dark ? 0.14 : 0.09),
    accent2: theme.accent2 ?? fallback.accent2,
    link: theme.link ?? theme.accent2 ?? fallback.link,
    line: theme.line ?? fallback.line,
    lineStrong: theme.lineStrong ?? ink ?? fallback.lineStrong,
    onAccent: theme.onAccent ?? "#ffffff",
    ...(theme.name ? { name: theme.name } : {}),
    ...(theme.font ? { font: theme.font } : {}),
    ...(theme.source ? { source: theme.source } : {}),
  };
}

/** sRGB blend, kept here so palettes.js has no import cycle with color.js. */
function blend(from, to, amount) {
  const parse = (value) => {
    const hex = String(value).replace("#", "");
    const full = hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex;
    return [0, 2, 4].map((offset) => Number.parseInt(full.slice(offset, offset + 2), 16) || 0);
  };
  const a = parse(from);
  const b = parse(to);
  const mixed = a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function tint(color, alpha) {
  const hex = String(color).replace("#", "");
  const full = hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((offset) => Number.parseInt(full.slice(offset, offset + 2), 16) || 0);
  return `rgba(${r},${g},${b},${alpha})`;
}
