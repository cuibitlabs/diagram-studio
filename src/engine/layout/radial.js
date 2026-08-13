/**
 * Radial layouts: cycles (loop / flywheel) and hub-and-spoke mind maps.
 *
 * Radii are derived from the widest node on each ring, so labels never collide
 * with the hub or with each other regardless of how long they are.
 */

import { roundTo } from "../text.js";
import { forestOf } from "./tree.js";

export const RADIAL_DEFAULTS = {
  origin: { x: 0, y: 0 },
  ringGap: 96,
  startAngle: -Math.PI / 2,
  clockwise: true,
  hubPadding: 48,
};

/** Smallest radius that keeps `count` boxes of `chord` width apart on a ring. */
function ringRadius(count, chord, minimum) {
  if (count <= 1) return minimum;
  const angle = (Math.PI * 2) / count;
  const required = chord / 2 / Math.sin(angle / 2);
  return Math.max(minimum, required);
}

/**
 * Place nodes evenly on one ring around a centre.
 *
 * @returns {{cx:number, cy:number, radius:number, angles:Map<string,number>}}
 */
export function ringLayout(nodes, overrides = {}) {
  const options = { ...RADIAL_DEFAULTS, ...overrides };
  if (!nodes.length) return { cx: 0, cy: 0, radius: 0, angles: new Map() };

  const chord = Math.max(...nodes.map((node) => node.w)) + options.ringGap * 0.5;
  const minimum = options.minRadius ?? Math.max(...nodes.map((node) => node.h)) + options.hubPadding * 2;
  const radius = ringRadius(nodes.length, chord, minimum);
  const step = (Math.PI * 2) / nodes.length * (options.clockwise ? 1 : -1);
  const angles = new Map();

  nodes.forEach((node, index) => {
    const angle = options.startAngle + index * step;
    angles.set(node.id, angle);
    node.x = roundTo(options.origin.x + Math.cos(angle) * radius - node.w / 2);
    node.y = roundTo(options.origin.y + Math.sin(angle) * radius - node.h / 2);
  });

  return { cx: options.origin.x, cy: options.origin.y, radius, angles };
}

/**
 * Hub-and-spoke: first node (or `options.hubId`) sits at the centre, its
 * children fan out on ring 1, their children stay inside the parent's sector.
 */
export function radialTreeLayout(nodes, edges, overrides = {}) {
  const options = { ...RADIAL_DEFAULTS, ...overrides };
  if (!nodes.length) return { cx: 0, cy: 0, radius: 0 };

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const { children, roots } = forestOf(nodes, edges);
  const hubId = options.hubId && byId.has(options.hubId) ? options.hubId : roots[0] ?? nodes[0].id;
  const hub = byId.get(hubId);

  hub.x = roundTo(options.origin.x - hub.w / 2);
  hub.y = roundTo(options.origin.y - hub.h / 2);

  const branches = children.get(hubId) ?? [];
  const orphans = nodes.filter((node) => node.id !== hubId && !branches.includes(node.id) && !hasAncestor(node.id, hubId, children));
  const firstRing = [...branches, ...orphans.map((node) => node.id)];
  if (!firstRing.length) return { cx: options.origin.x, cy: options.origin.y, radius: 0 };

  const ringNodes = firstRing.map((id) => byId.get(id));
  const chord = Math.max(...ringNodes.map((node) => node.w)) + options.ringGap * 0.6;
  const minimum = hub.w / 2 + Math.max(...ringNodes.map((node) => node.w)) / 2 + options.ringGap;
  const radius = ringRadius(ringNodes.length, chord, minimum);
  const sector = (Math.PI * 2) / ringNodes.length;
  let outerRadius = radius;

  ringNodes.forEach((node, index) => {
    const angle = options.startAngle + index * sector;
    node.x = roundTo(options.origin.x + Math.cos(angle) * radius - node.w / 2);
    node.y = roundTo(options.origin.y + Math.sin(angle) * radius - node.h / 2);

    const leaves = children.get(node.id) ?? [];
    if (!leaves.length) return;
    const leafRadius = radius + Math.max(...leaves.map((id) => byId.get(id).w)) / 2 + options.ringGap;
    outerRadius = Math.max(outerRadius, leafRadius);
    const span = sector * 0.7;
    leaves.forEach((id, leafIndex) => {
      const child = byId.get(id);
      const offset = leaves.length === 1 ? 0 : -span / 2 + (span / (leaves.length - 1)) * leafIndex;
      const leafAngle = angle + offset;
      child.x = roundTo(options.origin.x + Math.cos(leafAngle) * leafRadius - child.w / 2);
      child.y = roundTo(options.origin.y + Math.sin(leafAngle) * leafRadius - child.h / 2);
    });
  });

  return { cx: options.origin.x, cy: options.origin.y, radius, outerRadius, hubId };
}

function hasAncestor(id, ancestorId, children, seen = new Set()) {
  if (seen.has(ancestorId)) return false;
  seen.add(ancestorId);
  for (const child of children.get(ancestorId) ?? []) {
    if (child === id || hasAncestor(id, child, children, seen)) return true;
  }
  return false;
}
