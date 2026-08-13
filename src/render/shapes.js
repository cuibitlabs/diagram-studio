/**
 * Node shape paths.
 *
 * Shape is semantic, not decorative: a store is a cylinder, a decision is a
 * diamond, an external actor is a stadium. Colour alone never carries meaning,
 * so every role that matters also differs in outline.
 */

const fmt = (value) => (Math.round(value * 100) / 100).toString();

/** Rounded rectangle path. */
export function boxPath({ x, y, w, h }, radius = 8) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  if (r === 0) return `M ${fmt(x)} ${fmt(y)} H ${fmt(x + w)} V ${fmt(y + h)} H ${fmt(x)} Z`;
  return [
    `M ${fmt(x + r)} ${fmt(y)}`,
    `H ${fmt(x + w - r)}`,
    `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + w)} ${fmt(y + r)}`,
    `V ${fmt(y + h - r)}`,
    `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + w - r)} ${fmt(y + h)}`,
    `H ${fmt(x + r)}`,
    `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x)} ${fmt(y + h - r)}`,
    `V ${fmt(y + r)}`,
    `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + r)} ${fmt(y)}`,
    "Z",
  ].join(" ");
}

const stadiumPath = (rect) => boxPath(rect, rect.h / 2);

const diamondPath = ({ x, y, w, h }) =>
  `M ${fmt(x + w / 2)} ${fmt(y)} L ${fmt(x + w)} ${fmt(y + h / 2)} L ${fmt(x + w / 2)} ${fmt(y + h)} L ${fmt(x)} ${fmt(y + h / 2)} Z`;

const parallelogramPath = ({ x, y, w, h }, skew = 16) =>
  `M ${fmt(x + skew)} ${fmt(y)} H ${fmt(x + w)} L ${fmt(x + w - skew)} ${fmt(y + h)} H ${fmt(x)} Z`;

const hexagonPath = ({ x, y, w, h }, notch = 20) =>
  `M ${fmt(x + notch)} ${fmt(y)} H ${fmt(x + w - notch)} L ${fmt(x + w)} ${fmt(y + h / 2)} L ${fmt(x + w - notch)} ${fmt(y + h)} H ${fmt(x + notch)} L ${fmt(x)} ${fmt(y + h / 2)} Z`;

const chevronPath = ({ x, y, w, h }, point = 20) =>
  `M ${fmt(x)} ${fmt(y)} H ${fmt(x + w - point)} L ${fmt(x + w)} ${fmt(y + h / 2)} L ${fmt(x + w - point)} ${fmt(y + h)} H ${fmt(x)} L ${fmt(x + point)} ${fmt(y + h / 2)} Z`;

const notePath = ({ x, y, w, h }, fold = 18) =>
  `M ${fmt(x)} ${fmt(y)} H ${fmt(x + w - fold)} L ${fmt(x + w)} ${fmt(y + fold)} V ${fmt(y + h)} H ${fmt(x)} Z`;

/** Cylinder: body path plus the visible top rim as a separate stroke. */
function cylinderShape({ x, y, w, h }) {
  const ry = Math.min(14, h / 5);
  const body = [
    `M ${fmt(x)} ${fmt(y + ry)}`,
    `A ${fmt(w / 2)} ${fmt(ry)} 0 0 1 ${fmt(x + w)} ${fmt(y + ry)}`,
    `V ${fmt(y + h - ry)}`,
    `A ${fmt(w / 2)} ${fmt(ry)} 0 0 1 ${fmt(x)} ${fmt(y + h - ry)}`,
    "Z",
  ].join(" ");
  const rim = `M ${fmt(x)} ${fmt(y + ry)} A ${fmt(w / 2)} ${fmt(ry)} 0 0 0 ${fmt(x + w)} ${fmt(y + ry)}`;
  return { d: body, rim, insetTop: ry + 6 };
}

/** Document: flat top, waved bottom. */
function documentShape({ x, y, w, h }) {
  const wave = 12;
  const d = [
    `M ${fmt(x)} ${fmt(y)}`,
    `H ${fmt(x + w)}`,
    `V ${fmt(y + h - wave)}`,
    `C ${fmt(x + w * 0.75)} ${fmt(y + h)} ${fmt(x + w * 0.25)} ${fmt(y + h - wave * 2)} ${fmt(x)} ${fmt(y + h - wave)}`,
    "Z",
  ].join(" ");
  return { d, insetBottom: wave };
}

export const SHAPES = [
  "box",
  "stadium",
  "diamond",
  "cylinder",
  "parallelogram",
  "hexagon",
  "chevron",
  "note",
  "document",
  "circle",
];

/**
 * @param {string} shape
 * @param {{x,y,w,h}} rect
 * @param {number} radius corner radius for box-like shapes
 * @returns {{d:string, rim?:string, inset:{x:number,y:number}, textAnchor:"start"|"middle"}}
 */
export function shapePath(shape, rect, radius = 8) {
  switch (shape) {
    case "stadium":
      return { d: stadiumPath(rect), inset: { x: rect.h / 2, y: 0 }, textAnchor: "middle" };
    case "diamond":
      return { d: diamondPath(rect), inset: { x: rect.w / 4, y: rect.h / 6 }, textAnchor: "middle" };
    case "parallelogram":
      return { d: parallelogramPath(rect), inset: { x: 20, y: 0 }, textAnchor: "middle" };
    case "hexagon":
      return { d: hexagonPath(rect), inset: { x: 24, y: 0 }, textAnchor: "middle" };
    case "chevron":
      return { d: chevronPath(rect), inset: { x: 24, y: 0 }, textAnchor: "middle" };
    case "note":
      return { d: notePath(rect), inset: { x: 0, y: 6 }, textAnchor: "start" };
    case "circle":
      return { d: boxPath(rect, Math.min(rect.w, rect.h) / 2), inset: { x: rect.w / 6, y: 0 }, textAnchor: "middle" };
    case "cylinder": {
      const shapeData = cylinderShape(rect);
      return { d: shapeData.d, rim: shapeData.rim, inset: { x: 0, y: shapeData.insetTop }, textAnchor: "middle" };
    }
    case "document": {
      const shapeData = documentShape(rect);
      return { d: shapeData.d, inset: { x: 0, y: 0, bottom: shapeData.insetBottom }, textAnchor: "start" };
    }
    default:
      return { d: boxPath(rect, radius), inset: { x: 0, y: 0 }, textAnchor: "start" };
  }
}

/**
 * Extra width/height a shape needs beyond its text box so the label still fits.
 * Applied during measurement, before layout runs.
 */
export function shapePadding(shape) {
  switch (shape) {
    case "diamond": return { x: 72, y: 32 };
    case "stadium": return { x: 40, y: 0 };
    case "hexagon": return { x: 48, y: 0 };
    case "chevron": return { x: 48, y: 0 };
    case "parallelogram": return { x: 32, y: 0 };
    case "cylinder": return { x: 8, y: 28 };
    case "circle": return { x: 48, y: 24 };
    case "document": return { x: 0, y: 16 };
    case "note": return { x: 12, y: 8 };
    default: return { x: 0, y: 0 };
  }
}

/** Semantic role → default shape. */
export const ROLE_SHAPE = {
  focal: "box",
  service: "box",
  store: "cylinder",
  external: "stadium",
  actor: "stadium",
  decision: "diamond",
  input: "parallelogram",
  output: "parallelogram",
  gateway: "hexagon",
  step: "box",
  security: "hexagon",
  note: "note",
  document: "document",
  terminal: "stadium",
  state: "stadium",
  event: "circle",
  // Same box, different outline treatment in the skin.
  legacy: "box",
  optional: "box",
};
