/**
 * Icon set.
 *
 * Original 24×24 stroke geometry drawn for this project — no vendored third
 * party set, so there is no attribution surface and every glyph shares one
 * weight, one corner treatment and one optical size. Icons are decorative:
 * every node that carries one also carries its label, so an icon never becomes
 * the only carrier of meaning.
 *
 * Path data assumes: 24×24 box, 1.6 stroke, round caps and joins, no fill.
 *
 * Product marks live in `brand-icons.js`, vendored from simple-icons (CC0) and
 * merged into the same registry. Concepts belong here; named products belong
 * there. Marks whose owners asked to be removed from that set are not sourced
 * from anywhere else — see `UNAVAILABLE_MARKS` for what to use instead.
 */

import { BRAND_ICONS, BRAND_ICON_NAMES, hasBrandIcon } from "./brand-icons.js";

export { BRAND_ICONS, BRAND_ICON_NAMES, hasBrandIcon };
export { BRAND_ICON_GROUPS, UNAVAILABLE_MARKS } from "./brand-icons.js";

export const ICONS = {
  // people and access
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2 20a7 7 0 0 1 14 0M16.5 5.5a3 3 0 0 1 0 6M18 13.5a6 6 0 0 1 4 6",
  key: "M15 9a4 4 0 1 0-3.5 4L10 14.5l1.5 1.5-1.5 1.5 1.5 1.5-2 2-3-3 5.5-5.5",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3M12 15v2",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z",
  identity: "M4 5h16v14H4zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5.5 16a3.5 3.5 0 0 1 5 0M14 9h4M14 13h4",

  // compute and runtime
  server: "M4 5h16v5H4zM4 14h16v5H4zM7.5 7.5h.01M7.5 16.5h.01",
  cloud: "M7 18h9.5a3.5 3.5 0 0 0 .4-7A5.5 5.5 0 0 0 6.6 10 4 4 0 0 0 7 18Z",
  container: "M4 8l8-4 8 4-8 4zM4 8v8l8 4 8-4V8M12 12v8",
  cluster: "M6 6h5v5H6zM13 6h5v5h-5zM6 13h5v5H6zM13 13h5v5h-5z",
  function: "M8 20c2 0 2-2 2-4V8c0-2 0-4 2-4h2M8 12h6",
  terminal: "M4 5h16v14H4zM7.5 10l2.5 2-2.5 2M12.5 14.5H16",
  robot: "M7 9h10v9H7zM12 6v3M9.5 13h.01M14.5 13h.01M4 12v3M20 12v3",
  code: "M9 8l-4 4 4 4M15 8l4 4-4 4",

  // data
  database: "M12 7c4 0 7-1 7-2s-3-2-7-2-7 1-7 2 3 2 7 2ZM5 5v14c0 1.1 3 2 7 2s7-.9 7-2V5M5 12c0 1.1 3 2 7 2s7-.9 7-2",
  table: "M4 5h16v14H4zM4 10h16M10 10v9",
  file: "M6 3h8l4 4v14H6zM14 3v4h4",
  folder: "M4 6h6l2 2h8v11H4z",
  archive: "M4 5h16v4H4zM6 9v10h12V9M10 13h4",
  queue: "M4 7h4v10H4zM10 7h4v10h-4zM16 7h4v10h-4z",
  cache: "M5 6h14v5H5zM5 13h14v5H5zM8.5 8.5h.01M8.5 15.5h.01",
  pipeline: "M3 8h5a3 3 0 0 1 3 3v2a3 3 0 0 0 3 3h5M17 13l3 3-3 3",
  stream: "M4 8c3-2 5 2 8 0s5-2 8 0M4 13c3-2 5 2 8 0s5-2 8 0M4 18c3-2 5 2 8 0s5-2 8 0",

  // interface
  browser: "M4 5h16v14H4zM4 9h16M7 7h.01M9.5 7h.01",
  mobile: "M8 3h8v18H8zM11 18h2",
  desktop: "M4 5h16v10H4zM9 19h6M12 15v4",
  form: "M5 4h14v16H5zM8 9h8M8 13h8M8 17h4",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM16 16l4 4",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  bell: "M8 17V11a4 4 0 0 1 8 0v6M6 17h12M10.5 20h3",

  // network
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18",
  network: "M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM19 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM12 8v4M12 12l-6 4M12 12l6 4",
  firewall: "M3 6h18v12H3zM3 10h18M3 14h18M9 6v4M15 10v4M9 14v4",
  balancer: "M12 4v5M12 9L6 13M12 9l6 4M4 13h4v6H4zM10 13h4v6h-4zM16 13h4v6h-4z",
  gateway: "M4 12l4-6h8l4 6-4 6H8z M9 12h6",
  cdn: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2",

  // process
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  refresh: "M4 12a8 8 0 0 1 13.5-5.7L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.5 5.7L4 16M4 20v-4h4",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8",
  branch: "M7 4v10M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 10v2a4 4 0 0 1-4 4H9",
  merge: "M7 20V10a4 4 0 0 1 4-4h6M7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM14 8l3-2-3-2",
  package: "M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10",
  deploy: "M12 3c3 2.5 4.5 6 4.5 9L12 16l-4.5-4c0-3 1.5-6.5 4.5-10ZM12 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM9 17l-2 4 4-1.5M15 17l2 4-4-1.5",

  // analysis
  chart: "M4 20V6M4 20h16M8 17v-5M12 17V8M16 17v-7",
  trend: "M4 17l5-5 3 3 7-7M15 8h5v5",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  warning: "M12 4l9 16H3zM12 10v4M12 17h.01",
  check: "M5 13l4 4 10-10",
  cross: "M6 6l12 12M18 6L6 18",

  // Concepts standing in for product marks that cannot be redistributed.
  warehouse: "M3 10l9-5 9 5v10H3zM8 20v-6h8v6M8 14h8",
  dashboard: "M4 5h16v14H4zM4 12h7M11 5v14M15 15h5M15 9h5",
  payments: "M3 7h18v10H3zM3 11h18M6.5 14.5h3",
  messaging: "M4 5h16v10H4l-3 4V5zM8 9h.01M12 9h.01M16 9h.01",
  model: "M12 4l7 4v8l-7 4-7-4V8zM12 12l7-4M12 12v8M12 12L5 8M9 6.5l6 3.5",
  ledger: "M5 3h11l3 3v15H5zM8 8h8M8 12h8M8 16h5",
};

export const ICON_NAMES = Object.keys(ICONS);

/** Concept icons are stroked outlines; product marks are solid glyphs. */
export const hasIcon = (name) => Object.hasOwn(ICONS, name) || hasBrandIcon(name);
export const isBrand = (name) => !Object.hasOwn(ICONS, name) && hasBrandIcon(name);

/** Every icon a project can reference, with its source. */
export const ALL_ICON_NAMES = [...ICON_NAMES, ...BRAND_ICON_NAMES].sort();

/**
 * `<symbol>` definitions for the icons a diagram actually uses.
 * Unused glyphs are never emitted, so an export carries only what it needs.
 */
export function iconSymbols(names, uid) {
  const unique = [...new Set(names)].filter((name) => hasIcon(name)).sort();
  if (!unique.length) return "";
  return unique
    .map((name) => {
      const body = isBrand(name)
        ? `<path d="${BRAND_ICONS[name].path}" fill="currentColor"/>`
        : `<path d="${ICONS[name]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      return `<symbol id="${uid}-icon-${name}" viewBox="0 0 24 24">${body}</symbol>`;
    })
    .join("");
}

/**
 * The name to draw with, or `""` when the project asked for a glyph that does
 * not exist. Both the sizing path and the drawing path go through this, so a
 * node can never reserve space for an icon that will not be emitted — an
 * unknown name used to leave an empty gutter and a `<use>` pointing at a
 * `<symbol>` that was never defined.
 */
export const resolveIcon = (name) => (name && hasIcon(name) ? name : "");

/** Icon names referenced anywhere in a project. */
export const iconsUsedBy = (diagram) =>
  (diagram.nodes ?? []).map((node) => node.icon).filter((name) => name && hasIcon(name));

/** Names a project references that this build cannot draw. */
export const unknownIconsIn = (diagram) => [
  ...new Set((diagram.nodes ?? []).map((node) => node.icon).filter((name) => name && !hasIcon(name))),
];
