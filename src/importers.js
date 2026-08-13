/**
 * Import facade.
 *
 * The parsers live in `src/import/`; this module is the stable surface the
 * editor and the CLI both call.
 */

import { describeBrandReport, extractBrand, seededBrand } from "./theme/brand.js";
import { completeTheme } from "./theme/palettes.js";

export { parseDrawio, unwrapModel } from "./import/drawio.js";
export { describeProvenance, parseMermaid } from "./import/mermaid.js";
export { describeBrandReport, extractBrand, seededBrand };

/**
 * Load an editable `.diagram.json` project.
 *
 * The theme is completed on the way in: a file written before a role existed
 * would otherwise render that role as `transparent` rather than picking up the
 * derived value.
 */
export function parseProject(source) {
  const parsed = JSON.parse(source);
  if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error("This is not a Diagram Studio project.");
  }
  parsed.theme = completeTheme(parsed.theme ?? {});
  return parsed;
}

/**
 * Read a site's styles and map them onto the diagram's semantic roles.
 * A blocked or unreachable site falls back to a deterministic palette derived
 * from the domain, and says so in the report.
 *
 * @returns {Promise<{theme: object, report: object}>}
 */
export async function extractBrandFromURL(url) {
  const target = new URL(String(url).startsWith("http") ? url : `https://${url}`);
  try {
    const response = await fetch(target.href, { mode: "cors" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return extractBrand(await response.text(), target.hostname);
  } catch {
    return seededBrand(target.hostname);
  }
}

/** @returns {{theme: object, report: object}} */
export const extractBrandFromHTML = (html, name = "Imported brand") => extractBrand(html, name);
