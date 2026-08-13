/**
 * Theme palettes.
 *
 * Roles, not colour names: `paper` is the page, `panel` is a surface, `ink` is
 * body text, `accent` is the one thing you want read first. Every palette here
 * has been checked with `src/theme/contrast.js` at the sizes the type scale
 * actually uses.
 */

/** @typedef {{name:string,mode:"light"|"dark",paper:string,panel:string,ink:string,muted:string,accent:string,accent2:string,line:string,lineStrong:string,onAccent:string}} Palette */

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

/** Fill in derived roles for a theme that came from brand extraction. */
export function completeTheme(theme) {
  return {
    mode: theme.mode ?? "light",
    paper: theme.paper ?? PALETTES.editorial.paper,
    panel: theme.panel ?? PALETTES.editorial.panel,
    ink: theme.ink ?? PALETTES.editorial.ink,
    muted: theme.muted ?? PALETTES.editorial.muted,
    accent: theme.accent ?? PALETTES.editorial.accent,
    accent2: theme.accent2 ?? PALETTES.editorial.accent2,
    line: theme.line ?? PALETTES.editorial.line,
    lineStrong: theme.lineStrong ?? theme.ink ?? PALETTES.editorial.lineStrong,
    onAccent: theme.onAccent ?? "#ffffff",
    ...(theme.name ? { name: theme.name } : {}),
    ...(theme.font ? { font: theme.font } : {}),
    ...(theme.source ? { source: theme.source } : {}),
  };
}
