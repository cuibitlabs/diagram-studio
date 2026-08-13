/**
 * Project diff and stable redraw.
 *
 * When a source file changes, re-importing usually throws away every position
 * the author had settled on. `stableRedraw` carries the old geometry across to
 * whatever still exists, so a one-line change to a Mermaid file produces a
 * one-node change on the canvas instead of a completely rearranged diagram.
 */

import { cloneDiagram } from "../model.js";
import { boundsOf, rectOf } from "../engine/geom.js";
import { roundTo } from "../engine/text.js";

const identity = (node) => `${String(node.label ?? "").trim().toLowerCase()}|${node.role ?? ""}`;

/** Match nodes between two projects: by id first, then by label and role. */
export function matchNodes(previous, next) {
  const matches = new Map();
  const takenPrevious = new Set();

  const previousById = new Map(previous.nodes.map((node) => [node.id, node]));
  for (const node of next.nodes) {
    const byId = previousById.get(node.id);
    if (byId) {
      matches.set(node.id, byId);
      takenPrevious.add(byId.id);
    }
  }

  const previousByIdentity = new Map();
  for (const node of previous.nodes) {
    if (takenPrevious.has(node.id)) continue;
    const id = identity(node);
    if (!previousByIdentity.has(id)) previousByIdentity.set(id, []);
    previousByIdentity.get(id).push(node);
  }

  for (const node of next.nodes) {
    if (matches.has(node.id)) continue;
    const candidates = previousByIdentity.get(identity(node));
    const candidate = candidates?.shift();
    if (candidate) {
      matches.set(node.id, candidate);
      takenPrevious.add(candidate.id);
    }
  }

  return { matches, unmatchedPrevious: previous.nodes.filter((node) => !takenPrevious.has(node.id)) };
}

/**
 * Carry geometry from `previous` onto `next`.
 *
 * Nodes that survived keep their exact position and pinned size. New nodes are
 * parked just below the existing drawing and marked so the caller can lay out
 * only those, rather than re-flowing the whole diagram.
 *
 * @returns {{diagram: object, report: {kept:number, added: string[], removed: string[]}}}
 */
export function stableRedraw(previous, next) {
  const diagram = cloneDiagram(next);
  const { matches, unmatchedPrevious } = matchNodes(previous, diagram);
  const added = [];

  const placed = previous.nodes.filter((node) => Number.isFinite(node.x) && node.w > 0).map(rectOf);
  const bounds = placed.length ? boundsOf(placed, 0) : { x: 96, y: 96, y2: 96, x2: 96 };
  let parkX = bounds.x;
  const parkY = roundTo(bounds.y2 + 96);

  for (const node of diagram.nodes) {
    const match = matches.get(node.id);
    if (match) {
      node.x = match.x;
      node.y = match.y;
      if (match.fixedSize) {
        node.w = match.w;
        node.h = match.h;
        node.fixedSize = true;
      }
      continue;
    }
    added.push(node.label);
    node.x = parkX;
    node.y = parkY;
    parkX = roundTo(parkX + (node.w || 200) + 32);
  }

  // Keeping the old geometry is only meaningful if the layout engine leaves it
  // alone, so the redraw opts out of automatic layout.
  diagram.settings = { ...diagram.settings, preserveLayout: true };
  diagram.width = previous.width;
  diagram.height = previous.height;

  return {
    diagram,
    report: {
      kept: matches.size,
      added,
      removed: unmatchedPrevious.map((node) => node.label),
    },
  };
}

/**
 * Structural difference between two projects, for review.
 *
 * @returns {{nodes:{added:object[],removed:object[],changed:object[]}, edges:{added:object[],removed:object[]}, theme:string[]}}
 */
export function diffProjects(a, b) {
  const { matches, unmatchedPrevious } = matchNodes(a, b);
  const reverse = new Map([...matches].map(([nextId, previousNode]) => [previousNode.id, nextId]));

  const changed = [];
  for (const node of b.nodes) {
    const before = matches.get(node.id);
    if (!before) continue;
    const fields = ["label", "sublabel", "role", "shape", "tone", "value", "icon"].filter(
      (field) => (before[field] ?? null) !== (node[field] ?? null),
    );
    const moved = Math.round(before.x) !== Math.round(node.x) || Math.round(before.y) !== Math.round(node.y);
    if (fields.length || moved) changed.push({ id: node.id, label: node.label, fields, moved });
  }

  const edgeKey = (edge, map) => `${map.get(edge.source) ?? edge.source}→${map.get(edge.target) ?? edge.target}`;
  const beforeEdges = new Map(a.edges.map((edge) => [edgeKey(edge, reverse), edge]));
  const afterEdges = new Map(b.edges.map((edge) => [`${edge.source}→${edge.target}`, edge]));

  const theme = Object.keys(b.theme ?? {}).filter((role) => (a.theme ?? {})[role] !== (b.theme ?? {})[role]);

  return {
    nodes: {
      added: b.nodes.filter((node) => !matches.has(node.id)),
      removed: unmatchedPrevious,
      changed,
    },
    edges: {
      added: [...afterEdges].filter(([id]) => !beforeEdges.has(id)).map(([, edge]) => edge),
      removed: [...beforeEdges].filter(([id]) => !afterEdges.has(id)).map(([, edge]) => edge),
    },
    theme,
  };
}

/** One-paragraph summary of a diff, for a status line or a commit message. */
export function describeDiff(diff) {
  const parts = [];
  if (diff.nodes.added.length) parts.push(`+${diff.nodes.added.length} node${diff.nodes.added.length === 1 ? "" : "s"}`);
  if (diff.nodes.removed.length) parts.push(`−${diff.nodes.removed.length} node${diff.nodes.removed.length === 1 ? "" : "s"}`);
  const relabelled = diff.nodes.changed.filter((node) => node.fields.length).length;
  if (relabelled) parts.push(`${relabelled} edited`);
  const moved = diff.nodes.changed.filter((node) => node.moved).length;
  if (moved) parts.push(`${moved} moved`);
  if (diff.edges.added.length) parts.push(`+${diff.edges.added.length} connection${diff.edges.added.length === 1 ? "" : "s"}`);
  if (diff.edges.removed.length) parts.push(`−${diff.edges.removed.length} connection${diff.edges.removed.length === 1 ? "" : "s"}`);
  if (diff.theme.length) parts.push(`theme: ${diff.theme.join(", ")}`);
  return parts.length ? parts.join(" · ") : "no changes";
}
