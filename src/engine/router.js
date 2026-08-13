/**
 * Orthogonal connector router.
 *
 * Contract enforced here (see CONTRIBUTING.md):
 *  - every bend is a right angle with a rounded corner
 *  - connectors leave and enter a node along the side normal, never diagonally
 *  - connectors sharing a side are spread with a minimum gap between attach points
 *  - connectors do not pass through a node that is not one of their endpoints
 *
 * Routing is deterministic: same model in, same path data out, in the browser
 * and on the CLI.
 */

import {
  NORMALS,
  OPPOSITE,
  countHits,
  inflate,
  longestSegmentMidpoint,
  polylineLength,
  portPoint,
  rectOf,
  roundedPath,
  simplify,
} from "./geom.js";

export const ROUTER_DEFAULTS = {
  stub: 20,        // straight run leaving a node before the first bend
  clearance: 16,   // keep-out band around non-endpoint nodes
  radius: 8,       // corner radius
  portGap: 12,     // minimum distance between attach points on one side
  portMargin: 14,  // keep attach points away from corners
  bendCost: 24,    // px-equivalent penalty per bend when scoring candidates
  hitCost: 4000,   // penalty for crossing a node
  maxLattice: 48,  // A* lattice cap per axis
  straightenTolerance: 8, // collapse a jog this small into a straight run
};

const EPS = 0.01;
const aligned = (a, b) => Math.abs(a - b) < EPS;

/** Pick the side pair that gives the most direct run between two rects. */
function preferredSides(a, b, edge) {
  if (edge.sourceSide && edge.targetSide) {
    return { source: edge.sourceSide, target: edge.targetSide };
  }
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  // Gap-aware: prefer the axis where the rects are actually separated, so
  // vertically stacked ranks connect bottom→top even when slightly offset.
  const gapX = Math.max(b.x - a.x2, a.x - b.x2);
  const gapY = Math.max(b.y - a.y2, a.y - b.y2);
  let horizontal;
  if (gapX > 0 && gapY <= 0) horizontal = true;
  else if (gapY > 0 && gapX <= 0) horizontal = false;
  else horizontal = Math.abs(dx) >= Math.abs(dy);
  const source = horizontal ? (dx >= 0 ? "right" : "left") : dy >= 0 ? "bottom" : "top";
  return {
    source: edge.sourceSide || source,
    target: edge.targetSide || OPPOSITE[edge.sourceSide || source],
  };
}

/**
 * Spread attach points along each occupied side.
 * Order follows the cross-axis position of the opposite endpoint so connectors
 * fan out without crossing each other at the node border.
 */
function allocatePorts(assignments, rects, options) {
  const groups = new Map();
  for (const item of assignments) {
    for (const end of ["source", "target"]) {
      const key = `${item[`${end}Id`]}::${item[`${end}Side`]}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ item, end });
    }
  }

  const ports = new Map();
  for (const [key, members] of groups) {
    const [nodeId, side] = key.split("::");
    const rect = rects.get(nodeId);
    if (!rect) continue;
    const vertical = side === "left" || side === "right";
    const span = vertical ? rect.h : rect.w;

    members.sort((a, b) => {
      const other = (m) => rects.get(m.item[`${m.end === "source" ? "target" : "source"}Id`]);
      const ra = other(a);
      const rb = other(b);
      if (!ra || !rb) return 0;
      return vertical ? ra.cy - rb.cy : ra.cx - rb.cx;
    });

    const count = members.length;
    const margin = Math.min(options.portMargin, span / 4);
    const usable = Math.max(0, span - margin * 2);
    const gap = count > 1 ? Math.min(options.portGap * 2, usable / (count - 1)) : 0;
    const total = gap * (count - 1);
    const start = (span - total) / 2;

    members.forEach((member, index) => {
      const offset = count === 1 ? span / 2 : start + index * gap;
      ports.set(`${member.item.id}::${member.end}`, {
        t: span === 0 ? 0.5 : offset / span,
        point: portPoint(rect, side, span === 0 ? 0.5 : offset / span),
      });
    });
  }
  return ports;
}

/** Candidate polylines between two stub endpoints. */
function candidatePaths(p0, s, t, p1) {
  const paths = [];
  if (aligned(s.x, t.x) || aligned(s.y, t.y)) {
    paths.push([p0, s, t, p1]);
  }
  paths.push([p0, s, { x: t.x, y: s.y }, t, p1]);
  paths.push([p0, s, { x: s.x, y: t.y }, t, p1]);
  const mx = (s.x + t.x) / 2;
  const my = (s.y + t.y) / 2;
  paths.push([p0, s, { x: mx, y: s.y }, { x: mx, y: t.y }, t, p1]);
  paths.push([p0, s, { x: s.x, y: my }, { x: t.x, y: my }, t, p1]);
  return paths;
}

function scorePath(points, obstacles, options) {
  const pts = simplify(points);
  const hits = countHits(pts, obstacles);
  const bends = Math.max(0, pts.length - 2);
  return hits * options.hitCost + bends * options.bendCost + polylineLength(pts);
}

/** Sparse visibility lattice + A*, used when no simple candidate is clean. */
function latticeRoute(s, t, obstacles, options) {
  const xs = new Set([s.x, t.x]);
  const ys = new Set([s.y, t.y]);
  for (const o of obstacles) {
    xs.add(o.x);
    xs.add(o.x2);
    xs.add(o.cx);
    ys.add(o.y);
    ys.add(o.y2);
    ys.add(o.cy);
  }
  const xList = [...xs].sort((a, b) => a - b);
  const yList = [...ys].sort((a, b) => a - b);
  if (xList.length > options.maxLattice || yList.length > options.maxLattice) return null;

  const blocked = (x, y) => obstacles.some((o) => x > o.x + EPS && x < o.x2 - EPS && y > o.y + EPS && y < o.y2 - EPS);
  const clear = (a, b) => !obstacles.some((o) => {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    return minX < o.x2 - EPS && maxX > o.x + EPS && minY < o.y2 - EPS && maxY > o.y + EPS;
  });

  const key = (xi, yi) => `${xi},${yi}`;
  const startX = xList.indexOf(s.x);
  const startY = yList.indexOf(s.y);
  const goalX = xList.indexOf(t.x);
  const goalY = yList.indexOf(t.y);
  if (startX < 0 || startY < 0 || goalX < 0 || goalY < 0) return null;

  const heuristic = (xi, yi) => Math.abs(xList[xi] - t.x) + Math.abs(yList[yi] - t.y);
  const open = [{ xi: startX, yi: startY, g: 0, f: heuristic(startX, startY), dir: null }];
  const best = new Map([[key(startX, startY), 0]]);
  const cameFrom = new Map();
  let guard = 0;

  while (open.length && guard++ < 20000) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (current.xi === goalX && current.yi === goalY) {
      const points = [];
      let cursor = key(current.xi, current.yi);
      let node = current;
      while (node) {
        points.unshift({ x: xList[node.xi], y: yList[node.yi] });
        const parent = cameFrom.get(cursor);
        if (!parent) break;
        cursor = key(parent.xi, parent.yi);
        node = parent;
      }
      return points;
    }
    const neighbours = [
      { xi: current.xi + 1, yi: current.yi, dir: "x" },
      { xi: current.xi - 1, yi: current.yi, dir: "x" },
      { xi: current.xi, yi: current.yi + 1, dir: "y" },
      { xi: current.xi, yi: current.yi - 1, dir: "y" },
    ];
    for (const next of neighbours) {
      if (next.xi < 0 || next.yi < 0 || next.xi >= xList.length || next.yi >= yList.length) continue;
      const a = { x: xList[current.xi], y: yList[current.yi] };
      const b = { x: xList[next.xi], y: yList[next.yi] };
      if (blocked(b.x, b.y) || !clear(a, b)) continue;
      const step = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      const turn = current.dir && current.dir !== next.dir ? options.bendCost : 0;
      const g = current.g + step + turn;
      const id = key(next.xi, next.yi);
      if (best.has(id) && best.get(id) <= g) continue;
      best.set(id, g);
      cameFrom.set(id, current);
      open.push({ xi: next.xi, yi: next.yi, g, f: g + heuristic(next.xi, next.yi), dir: next.dir });
    }
  }
  return null;
}

/**
 * Collapse a near-straight run into an actual straight line.
 *
 * Port allocation can leave a two-pixel offset between the two ends when the
 * nodes have slightly different heights. Drawn literally that becomes a visible
 * stair-step in the middle of an otherwise straight connector.
 */
function straighten(points, tolerance) {
  if (points.length < 3) return points;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  if (Math.max(...ys) - Math.min(...ys) <= tolerance) {
    const y = points[0].y;
    return [{ x: points[0].x, y }, { x: points.at(-1).x, y }];
  }
  if (Math.max(...xs) - Math.min(...xs) <= tolerance) {
    const x = points[0].x;
    return [{ x, y: points[0].y }, { x, y: points.at(-1).y }];
  }
  return points;
}

/** Rectangular self-loop hanging off one side. */
function selfLoop(rect, options) {
  const out = options.stub + 16;
  const a = { x: rect.x2, y: rect.y + rect.h * 0.3 };
  const b = { x: rect.x2 + out, y: rect.y + rect.h * 0.3 };
  const c = { x: rect.x2 + out, y: rect.y + rect.h * 0.7 };
  const d = { x: rect.x2, y: rect.y + rect.h * 0.7 };
  return [a, b, c, d];
}

/**
 * Route every edge in one pass.
 *
 * @param {Array} edges  model edges (`{id, source, target}`)
 * @param {Array} nodes  model nodes (`{id, x, y, w, h}`)
 * @param {object} [overrides] router option overrides
 * @returns {Map<string, {points, d, labelAnchor, sourceSide, targetSide, hits}>}
 */
export function routeEdges(edges, nodes, overrides = {}) {
  const options = { ...ROUTER_DEFAULTS, ...overrides };
  const rects = new Map(nodes.map((node) => [node.id, rectOf(node)]));

  const assignments = [];
  for (const edge of edges) {
    const a = rects.get(edge.source);
    const b = rects.get(edge.target);
    if (!a || !b) continue;
    if (edge.source === edge.target) {
      assignments.push({ id: edge.id, edge, selfLoop: true, sourceId: edge.source, targetId: edge.target, sourceSide: "right", targetSide: "right" });
      continue;
    }
    const sides = preferredSides(a, b, edge);
    assignments.push({
      id: edge.id,
      edge,
      sourceId: edge.source,
      targetId: edge.target,
      sourceSide: sides.source,
      targetSide: sides.target,
    });
  }

  const ports = allocatePorts(assignments.filter((item) => !item.selfLoop), rects, options);
  const results = new Map();

  for (const item of assignments) {
    const sourceRect = rects.get(item.sourceId);
    const targetRect = rects.get(item.targetId);

    if (item.selfLoop) {
      const points = selfLoop(sourceRect, options);
      results.set(item.id, {
        points,
        d: roundedPath(points, options.radius),
        labelAnchor: longestSegmentMidpoint(points),
        sourceSide: "right",
        targetSide: "right",
        hits: 0,
      });
      continue;
    }

    const p0 = ports.get(`${item.id}::source`)?.point ?? portPoint(sourceRect, item.sourceSide);
    const p1 = ports.get(`${item.id}::target`)?.point ?? portPoint(targetRect, item.targetSide);
    const n0 = NORMALS[item.sourceSide];
    const n1 = NORMALS[item.targetSide];
    const s = { x: p0.x + n0.x * options.stub, y: p0.y + n0.y * options.stub };
    const t = { x: p1.x + n1.x * options.stub, y: p1.y + n1.y * options.stub };

    const obstacles = [];
    for (const [id, rect] of rects) {
      if (id === item.sourceId || id === item.targetId) {
        obstacles.push(inflate(rect, -1));
      } else {
        obstacles.push(inflate(rect, options.clearance));
      }
    }

    let bestPoints = null;
    let bestScore = Infinity;
    for (const candidate of candidatePaths(p0, s, t, p1)) {
      const score = scorePath(candidate, obstacles, options);
      if (score < bestScore) {
        bestScore = score;
        bestPoints = candidate;
      }
    }

    if (bestScore >= options.hitCost) {
      const detour = latticeRoute(s, t, obstacles, options);
      if (detour) {
        const full = [p0, ...detour, p1];
        const score = scorePath(full, obstacles, options);
        if (score < bestScore) {
          bestScore = score;
          bestPoints = full;
        }
      }
    }

    const points = simplify(straighten(simplify(bestPoints ?? [p0, p1]), options.straightenTolerance));
    results.set(item.id, {
      points,
      d: roundedPath(points, options.radius),
      labelAnchor: longestSegmentMidpoint(points),
      sourceSide: item.sourceSide,
      targetSide: item.targetSide,
      hits: countHits(points, obstacles),
    });
  }

  return results;
}
