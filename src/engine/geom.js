/** Axis-aligned geometry helpers shared by layout, routing and rendering. */

export const SIDES = ["top", "right", "bottom", "left"];

export const NORMALS = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export const OPPOSITE = { top: "bottom", right: "left", bottom: "top", left: "right" };

/** Normalise a node-like object into a rect with derived edges. */
export function rectOf(node) {
  const x = Number(node.x) || 0;
  const y = Number(node.y) || 0;
  const w = Number(node.w) || 0;
  const h = Number(node.h) || 0;
  return { x, y, w, h, x2: x + w, y2: y + h, cx: x + w / 2, cy: y + h / 2 };
}

export const inflate = (r, pad) => ({
  x: r.x - pad,
  y: r.y - pad,
  w: r.w + pad * 2,
  h: r.h + pad * 2,
  x2: r.x2 + pad,
  y2: r.y2 + pad,
  cx: r.cx,
  cy: r.cy,
});

export const containsPoint = (r, p) => p.x >= r.x && p.x <= r.x2 && p.y >= r.y && p.y <= r.y2;

export const rectsOverlap = (a, b) => a.x < b.x2 && b.x < a.x2 && a.y < b.y2 && b.y < a.y2;

/**
 * Point on a rect side. `t` runs 0..1 from the side's start
 * (left→right for horizontal sides, top→bottom for vertical sides).
 */
export function portPoint(r, side, t = 0.5) {
  switch (side) {
    case "top": return { x: r.x + r.w * t, y: r.y };
    case "bottom": return { x: r.x + r.w * t, y: r.y2 };
    case "left": return { x: r.x, y: r.y + r.h * t };
    default: return { x: r.x2, y: r.y + r.h * t };
  }
}

/** True when the axis-aligned segment a→b touches the interior of rect r. */
export function segmentHitsRect(a, b, r) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  // Strict comparison so a segment running exactly along a border is allowed.
  return minX < r.x2 && maxX > r.x && minY < r.y2 && maxY > r.y;
}

/** Count how many obstacles a polyline passes through. */
export function countHits(points, obstacles) {
  let hits = 0;
  for (let i = 0; i < points.length - 1; i++) {
    for (const obstacle of obstacles) {
      if (segmentHitsRect(points[i], points[i + 1], obstacle)) hits++;
    }
  }
  return hits;
}

export function polylineLength(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y);
  }
  return total;
}

/** Drop repeated points and merge collinear runs. */
export function simplify(points) {
  const out = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - p.x) < 0.01 && Math.abs(last.y - p.y) < 0.01) continue;
    out.push({ x: p.x, y: p.y });
  }
  for (let i = out.length - 2; i > 0; i--) {
    const a = out[i - 1];
    const b = out[i];
    const c = out[i + 1];
    const collinear =
      (Math.abs(a.x - b.x) < 0.01 && Math.abs(b.x - c.x) < 0.01) ||
      (Math.abs(a.y - b.y) < 0.01 && Math.abs(b.y - c.y) < 0.01);
    if (collinear) out.splice(i, 1);
  }
  return out;
}

export const countBends = (points) => Math.max(0, simplify(points).length - 2);

const fmt = (value) => (Math.round(value * 100) / 100).toString();

/**
 * SVG path for a polyline with rounded corners.
 * The radius shrinks automatically when a segment is too short to carry it,
 * so short elbows stay square instead of overshooting.
 */
export function roundedPath(points, radius = 8) {
  const pts = simplify(points);
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${fmt(pts[0].x)} ${fmt(pts[0].y)} L ${fmt(pts[1].x)} ${fmt(pts[1].y)}`;

  let d = `M ${fmt(pts[0].x)} ${fmt(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const corner = pts[i];
    const next = pts[i + 1];
    const inLen = Math.abs(corner.x - prev.x) + Math.abs(corner.y - prev.y);
    const outLen = Math.abs(next.x - corner.x) + Math.abs(next.y - corner.y);
    const r = Math.max(0, Math.min(radius, inLen / 2, outLen / 2));
    if (r < 0.5) {
      d += ` L ${fmt(corner.x)} ${fmt(corner.y)}`;
      continue;
    }
    const inUnit = { x: Math.sign(corner.x - prev.x), y: Math.sign(corner.y - prev.y) };
    const outUnit = { x: Math.sign(next.x - corner.x), y: Math.sign(next.y - corner.y) };
    const enter = { x: corner.x - inUnit.x * r, y: corner.y - inUnit.y * r };
    const exit = { x: corner.x + outUnit.x * r, y: corner.y + outUnit.y * r };
    d += ` L ${fmt(enter.x)} ${fmt(enter.y)} Q ${fmt(corner.x)} ${fmt(corner.y)} ${fmt(exit.x)} ${fmt(exit.y)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${fmt(last.x)} ${fmt(last.y)}`;
  return d;
}

/** Midpoint of the longest segment — the safest place to hang an edge label. */
export function longestSegmentMidpoint(points) {
  const pts = simplify(points);
  let best = null;
  let bestLength = -1;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const length = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (length > bestLength) {
      bestLength = length;
      best = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        horizontal: Math.abs(b.y - a.y) < 0.01,
        length,
      };
    }
  }
  return best ?? { x: 0, y: 0, horizontal: true, length: 0 };
}

/** Bounding box of a set of rects, expanded by `pad`. */
export function boundsOf(rects, pad = 0) {
  if (!rects.length) return { x: 0, y: 0, w: 0, h: 0, x2: 0, y2: 0, cx: 0, cy: 0 };
  let x = Infinity;
  let y = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const r of rects) {
    x = Math.min(x, r.x);
    y = Math.min(y, r.y);
    x2 = Math.max(x2, r.x2 ?? r.x + r.w);
    y2 = Math.max(y2, r.y2 ?? r.y + r.h);
  }
  return {
    x: x - pad,
    y: y - pad,
    w: x2 - x + pad * 2,
    h: y2 - y + pad * 2,
    x2: x2 + pad,
    y2: y2 + pad,
    cx: (x + x2) / 2,
    cy: (y + y2) / 2,
  };
}
