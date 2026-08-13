/**
 * Layered (Sugiyama-style) layout for directed structures: architecture,
 * flowchart, state, process, data flow, deployment, network, ER.
 *
 * Phases: cycle breaking → longest-path ranking → barycentre ordering with a
 * transpose pass → median-aligned coordinate assignment.
 */

import { roundTo } from "../text.js";
import { assignRanks, breakCycles, countCrossings, groupByRank, median, packCentres } from "./graph.js";

export const LAYERED_DEFAULTS = {
  direction: "LR",
  rankGap: 96,
  nodeGap: 32,
  origin: { x: 96, y: 96 },
  sweeps: 6,
  alignPasses: 4,
};

function orderRanks(ranks, edges) {
  const order = ranks.map((rank) => [...rank]);
  const neighbours = (id, ranksEdges, useSource) => {
    const result = [];
    for (const edge of ranksEdges) {
      if (useSource ? edge.target === id : edge.source === id) result.push(useSource ? edge.source : edge.target);
    }
    return result;
  };

  for (let sweep = 0; sweep < LAYERED_DEFAULTS.sweeps; sweep++) {
    const downward = sweep % 2 === 0;
    const sequence = downward ? [...order.keys()] : [...order.keys()].reverse();

    for (const index of sequence) {
      const reference = downward ? order[index - 1] : order[index + 1];
      if (!reference) continue;
      const position = new Map(reference.map((id, i) => [id, i]));
      const scores = new Map();
      order[index].forEach((id, i) => {
        const linked = neighbours(id, edges, downward)
          .map((other) => position.get(other))
          .filter((value) => value !== undefined);
        scores.set(id, linked.length ? median(linked) : i);
      });
      order[index] = [...order[index]].sort((a, b) => scores.get(a) - scores.get(b));
    }

    // Transpose: swap adjacent pairs while it reduces crossings.
    for (let index = 1; index < order.length; index++) {
      let improved = true;
      let guard = 0;
      while (improved && guard++ < 8) {
        improved = false;
        for (let i = 0; i < order[index].length - 1; i++) {
          const before = countCrossings(order[index - 1], order[index], edges);
          const swapped = [...order[index]];
          [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
          if (countCrossings(order[index - 1], swapped, edges) < before) {
            order[index] = swapped;
            improved = true;
          }
        }
      }
    }
  }
  return order;
}

/**
 * @param {Array} nodes model nodes (already sized)
 * @param {Array} edges model edges
 * @param {object} [overrides]
 * @returns {{width:number,height:number,ranks:string[][],reversed:Set<string>}}
 */
export function layeredLayout(nodes, edges, overrides = {}) {
  const options = { ...LAYERED_DEFAULTS, ...overrides };
  if (!nodes.length) return { width: 0, height: 0, ranks: [], reversed: new Set() };

  const { edges: acyclic, reversed } = breakCycles(nodes, edges);
  const rank = assignRanks(nodes, acyclic);
  const ranks = orderRanks(groupByRank(nodes, rank), acyclic);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const vertical = options.direction === "TB" || options.direction === "BT";

  // Main axis: one band per rank, sized by the deepest node in it.
  const mainSize = (node) => (vertical ? node.h : node.w);
  const crossSize = (node) => (vertical ? node.w : node.h);
  const bandStarts = [];
  let cursor = 0;
  for (const ids of ranks) {
    const depth = Math.max(0, ...ids.map((id) => mainSize(byId.get(id))));
    bandStarts.push({ start: cursor, depth });
    cursor += depth + options.rankGap;
  }

  // Cross axis: seed sequentially, then pull each node toward its neighbours.
  const centres = ranks.map((ids) => {
    let offset = 0;
    return ids.map((id) => {
      const size = crossSize(byId.get(id));
      const centre = offset + size / 2;
      offset += size + options.nodeGap;
      return centre;
    });
  });

  for (let pass = 0; pass < options.alignPasses; pass++) {
    const downward = pass % 2 === 0;
    const sequence = downward ? [...ranks.keys()] : [...ranks.keys()].reverse();
    for (const index of sequence) {
      const referenceIndex = downward ? index - 1 : index + 1;
      const reference = ranks[referenceIndex];
      if (!reference) continue;
      const referenceCentre = new Map(reference.map((id, i) => [id, centres[referenceIndex][i]]));
      const desired = ranks[index].map((id, i) => {
        const linked = acyclic
          .filter((edge) => (downward ? edge.target === id : edge.source === id))
          .map((edge) => referenceCentre.get(downward ? edge.source : edge.target))
          .filter((value) => value !== undefined);
        return linked.length ? median(linked) : centres[index][i];
      });
      const halves = ranks[index].map((id) => crossSize(byId.get(id)) / 2);
      centres[index] = packCentres(desired, halves, options.nodeGap);
    }
  }

  // Normalise so the whole drawing starts at the origin.
  let minCross = Infinity;
  ranks.forEach((ids, index) => {
    ids.forEach((id, i) => {
      minCross = Math.min(minCross, centres[index][i] - crossSize(byId.get(id)) / 2);
    });
  });
  if (!Number.isFinite(minCross)) minCross = 0;

  let maxCross = 0;
  ranks.forEach((ids, index) => {
    const band = bandStarts[index];
    ids.forEach((id, i) => {
      const node = byId.get(id);
      const cross = centres[index][i] - minCross;
      const main = band.start + (band.depth - mainSize(node)) / 2;
      if (vertical) {
        node.x = roundTo(options.origin.x + cross - node.w / 2);
        node.y = roundTo(options.origin.y + main);
      } else {
        node.x = roundTo(options.origin.x + main);
        node.y = roundTo(options.origin.y + cross - node.h / 2);
      }
      maxCross = Math.max(maxCross, cross + crossSize(node) / 2);
    });
  });

  const mainExtent = cursor - options.rankGap;
  return {
    width: vertical ? maxCross : mainExtent,
    height: vertical ? mainExtent : maxCross,
    ranks,
    reversed,
  };
}
