/**
 * Library entry point.
 *
 * Everything here is DOM-free and deterministic, so the same calls work in a
 * browser bundle, in Node, in a test and in the MCP server.
 */

export {
  DIAGRAM_TYPES,
  LIMITS,
  MODEL_VERSION,
  PALETTES,
  cloneDiagram,
  createDiagram,
  createFromPrompt,
  getType,
  hasType,
  makeId,
  reviewDiagram,
  sampleFor,
  validateDiagram,
} from "./model.js";

export { CANVAS, buildSVG, themeVariables, uidFor } from "./render/svg.js";
export { SKIN_RULES, skinCSS } from "./render/skin.js";
export { ICONS, ICON_NAMES } from "./render/icons.js";
export { ROLE_SHAPE, SHAPES, shapePath } from "./render/shapes.js";

export { getRenderer, RENDERERS } from "./types/index.js";

export { measureText, wrapText, layoutParagraph, ceilTo, floorTo, roundTo } from "./engine/text.js";
export { TYPE, FONT_STACK } from "./engine/typography.js";
export { measureNodeBox, sizeNodes } from "./engine/box.js";
export { ROUTER_DEFAULTS, routeEdges } from "./engine/router.js";
export * as layout from "./engine/layout/index.js";

export { parseMermaid, describeProvenance } from "./import/mermaid.js";
export { parseDrawio, unwrapModel } from "./import/drawio.js";
export { toMermaid } from "./export/mermaid.js";
export { toDrawio } from "./export/drawio.js";
export { toASCII } from "./export/ascii.js";

export { PALETTE_IDS, completeTheme, paletteOf } from "./theme/palettes.js";
export { auditTheme, contrastRatio, repairTheme, simulateTheme } from "./theme/contrast.js";
export { describeBrandReport, extractBrand, seededBrand } from "./theme/brand.js";

export { align, distribute, duplicate, nodesInMarquee } from "./editor/selection.js";
export { snapToNeighbours } from "./editor/guides.js";

export { ParseError, parse as parseDSL, stringify as stringifyDSL } from "./dsl/index.js";
export { LEVELS as SIMPLIFY_LEVELS, simplify } from "./edit/simplify.js";
export { describeDiff, diffProjects, matchNodes, stableRedraw } from "./edit/diff.js";
