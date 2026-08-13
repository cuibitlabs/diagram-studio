/**
 * Editorial simplification.
 *
 * "The highest-quality move is usually deletion" only holds if the deletion is
 * accountable. Every operation here is deterministic, reversible from the
 * original file, and recorded in a ledger, so a simplified diagram can be
 * presented as a redraw rather than passed off as the source.
 *
 * Levels:
 *   light       merge exact duplicates and fold parallel edges
 *   balanced    also drop unconnected decoration and de-duplicate edges
 *   aggressive  also collapse pass-through nodes into a labelled edge
 */

import { cloneDiagram } from "../model.js";
import { getType } from "../types/index.js";

export const LEVELS = ["light", "balanced", "aggressive"];

const key = (value) => String(value ?? "").trim().toLowerCase();

/** Merge nodes that carry the same label, keeping the richest one. */
function mergeDuplicates(diagram, ledger) {
  const byLabel = new Map();
  const replace = new Map();

  for (const node of diagram.nodes) {
    const label = key(node.label);
    if (!label) continue;
    const existing = byLabel.get(label);
    if (!existing) {
      byLabel.set(label, node);
      continue;
    }
    // Keep whichever carries more information.
    const score = (item) => (item.sublabel ? 2 : 0) + (item.role ? 1 : 0) + (item.tone === "accent" ? 1 : 0);
    const [keep, drop] = score(node) > score(existing) ? [node, existing] : [existing, node];
    byLabel.set(label, keep);
    replace.set(drop.id, keep.id);
  }

  if (!replace.size) return;
  diagram.nodes = diagram.nodes.filter((node) => !replace.has(node.id));
  for (const edge of diagram.edges) {
    edge.source = replace.get(edge.source) ?? edge.source;
    edge.target = replace.get(edge.target) ?? edge.target;
  }
  for (const group of diagram.groups ?? []) {
    group.nodes = [...new Set(group.nodes.map((id) => replace.get(id) ?? id))];
  }
  ledger.push(`Merged ${replace.size} duplicate node${replace.size === 1 ? "" : "s"} by label`);
}

/** One edge per direction between a pair; labels are joined. */
function foldParallelEdges(diagram, ledger) {
  const seen = new Map();
  const kept = [];
  let folded = 0;

  for (const edge of diagram.edges) {
    const id = `${edge.source}→${edge.target}`;
    const existing = seen.get(id);
    if (!existing) {
      seen.set(id, edge);
      kept.push(edge);
      continue;
    }
    folded++;
    const labels = [existing.label, edge.label].map((value) => String(value ?? "").trim()).filter(Boolean);
    existing.label = [...new Set(labels)].join(" · ");
    if (edge.tone === "accent") existing.tone = "accent";
    if (!edge.dashed) delete existing.dashed;
  }

  if (folded) {
    diagram.edges = kept;
    ledger.push(`Folded ${folded} parallel connection${folded === 1 ? "" : "s"} into one labelled edge`);
  }
}

/** Remove edges that are exact repeats, including their labels. */
function dedupeEdges(diagram, ledger) {
  const seen = new Set();
  const kept = [];
  for (const edge of diagram.edges) {
    const id = `${edge.source}→${edge.target}|${key(edge.label)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    kept.push(edge);
  }
  const removed = diagram.edges.length - kept.length;
  if (removed) {
    diagram.edges = kept;
    ledger.push(`Removed ${removed} repeated connection${removed === 1 ? "" : "s"}`);
  }
}

/** Unconnected decoration in a graph family carries no relationship. */
function dropOrphans(diagram, ledger) {
  if (!["layered", "hierarchy", "er", "swimlane"].includes(getType(diagram.type).family)) return;
  const connected = new Set(diagram.edges.flatMap((edge) => [edge.source, edge.target]));
  const grouped = new Set((diagram.groups ?? []).flatMap((group) => group.nodes));
  const orphans = diagram.nodes.filter(
    (node) => !connected.has(node.id) && !grouped.has(node.id) && (node.role === "note" || !node.sublabel),
  );
  if (!orphans.length || orphans.length === diagram.nodes.length) return;
  const ids = new Set(orphans.map((node) => node.id));
  diagram.nodes = diagram.nodes.filter((node) => !ids.has(node.id));
  ledger.push(`Dropped ${orphans.length} unconnected element${orphans.length === 1 ? "" : "s"}: ${orphans.map((node) => node.label).join(", ")}`);
}

/**
 * Collapse a node that only forwards: exactly one edge in, one edge out, no
 * role, no sublabel and no emphasis. Its name becomes the edge label so the
 * step is still readable.
 */
function collapseChains(diagram, ledger) {
  let collapsed = 0;
  let changed = true;

  while (changed) {
    changed = false;
    for (const node of diagram.nodes) {
      if (node.role || node.sublabel || node.tone === "accent" || node.icon) continue;
      const incoming = diagram.edges.filter((edge) => edge.target === node.id);
      const outgoing = diagram.edges.filter((edge) => edge.source === node.id);
      if (incoming.length !== 1 || outgoing.length !== 1) continue;
      if (incoming[0].source === node.id || outgoing[0].target === node.id) continue;
      if (incoming[0].source === outgoing[0].target) continue;

      const label = [incoming[0].label, node.label, outgoing[0].label]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);
      incoming[0].target = outgoing[0].target;
      incoming[0].label = [...new Set(label)].join(" · ");
      diagram.edges = diagram.edges.filter((edge) => edge !== outgoing[0]);
      diagram.nodes = diagram.nodes.filter((item) => item !== node);
      for (const group of diagram.groups ?? []) group.nodes = group.nodes.filter((id) => id !== node.id);
      collapsed++;
      changed = true;
      break;
    }
  }

  if (collapsed) ledger.push(`Collapsed ${collapsed} pass-through node${collapsed === 1 ? "" : "s"} into labelled connections`);
}

/**
 * @param {object} source
 * @param {{level?: "light"|"balanced"|"aggressive"}} [options]
 * @returns {{diagram: object, ledger: string[]}}
 */
export function simplify(source, options = {}) {
  const level = LEVELS.includes(options.level) ? options.level : "balanced";
  const diagram = cloneDiagram(source);
  const before = { nodes: diagram.nodes.length, edges: diagram.edges.length };
  const ledger = [];

  mergeDuplicates(diagram, ledger);
  foldParallelEdges(diagram, ledger);
  if (level !== "light") {
    dedupeEdges(diagram, ledger);
    dropOrphans(diagram, ledger);
  }
  if (level === "aggressive") collapseChains(diagram, ledger);

  // Drop edges whose endpoints no longer exist.
  const ids = new Set(diagram.nodes.map((node) => node.id));
  diagram.edges = diagram.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
  for (const group of diagram.groups ?? []) group.nodes = group.nodes.filter((id) => ids.has(id));
  if (diagram.groups) diagram.groups = diagram.groups.filter((group) => group.nodes.length);

  const summary = `Detail: ${level} · ${before.nodes} nodes → ${diagram.nodes.length} · ${before.edges} connections → ${diagram.edges.length}`;
  diagram.provenance = {
    ...(diagram.provenance ?? {}),
    simplified: { level, from: before, to: { nodes: diagram.nodes.length, edges: diagram.edges.length }, actions: ledger },
  };
  return { diagram, ledger: [summary, ...ledger] };
}
