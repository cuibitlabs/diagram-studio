/** Shared graph utilities for the layout algorithms. */

/** Adjacency maps keyed by node id. */
export function buildGraph(nodes, edges) {
  const out = new Map(nodes.map((node) => [node.id, []]));
  const inn = new Map(nodes.map((node) => [node.id, []]));
  const valid = [];
  for (const edge of edges) {
    if (!out.has(edge.source) || !out.has(edge.target) || edge.source === edge.target) continue;
    out.get(edge.source).push(edge.target);
    inn.get(edge.target).push(edge.source);
    valid.push(edge);
  }
  return { out, inn, edges: valid };
}

/**
 * Break cycles by reversing back edges found in a DFS.
 * Returns the acyclic edge list plus the set of reversed edge ids so callers can
 * flip the arrowheads back after routing.
 */
export function breakCycles(nodes, edges) {
  const graph = buildGraph(nodes, edges);
  const state = new Map(nodes.map((node) => [node.id, 0])); // 0 unseen, 1 on stack, 2 done
  const reversed = new Set();

  const visit = (id) => {
    state.set(id, 1);
    for (const next of graph.out.get(id) ?? []) {
      const status = state.get(next);
      if (status === 1) {
        const back = graph.edges.find((edge) => edge.source === id && edge.target === next);
        if (back) reversed.add(back.id ?? `${id}->${next}`);
      } else if (status === 0) {
        visit(next);
      }
    }
    state.set(id, 2);
  };

  for (const node of nodes) if (state.get(node.id) === 0) visit(node.id);

  const acyclic = graph.edges.map((edge) => {
    const id = edge.id ?? `${edge.source}->${edge.target}`;
    return reversed.has(id)
      ? { ...edge, source: edge.target, target: edge.source, _reversed: true }
      : edge;
  });
  return { edges: acyclic, reversed };
}

/** Longest-path layering. Roots (no incoming edge) sit at rank 0. */
export function assignRanks(nodes, edges) {
  const { out, inn } = buildGraph(nodes, edges);
  const rank = new Map(nodes.map((node) => [node.id, 0]));
  const indegree = new Map(nodes.map((node) => [node.id, (inn.get(node.id) ?? []).length]));
  const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const seen = new Set(queue);

  while (queue.length) {
    const id = queue.shift();
    for (const next of out.get(id) ?? []) {
      rank.set(next, Math.max(rank.get(next), rank.get(id) + 1));
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0 && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }

  // Nodes left in a residual cycle keep rank 0; place them after their sources.
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    const sources = inn.get(node.id) ?? [];
    rank.set(node.id, sources.length ? Math.max(...sources.map((id) => rank.get(id) ?? 0)) + 1 : 0);
  }
  return rank;
}

/** Group node ids by rank, preserving model order inside each rank. */
export function groupByRank(nodes, rank) {
  const ranks = [];
  for (const node of nodes) {
    const index = rank.get(node.id) ?? 0;
    (ranks[index] ??= []).push(node.id);
  }
  return ranks.map((entry) => entry ?? []);
}

export const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/**
 * Enforce a minimum gap between ordered centres without reordering them.
 * Forward pass pushes right, backward pass pulls back toward the desired
 * positions, so the run stays as close to its ideal placement as the gap allows.
 */
export function packCentres(centres, halves, gap) {
  const out = [...centres];
  for (let i = 1; i < out.length; i++) {
    const minimum = out[i - 1] + halves[i - 1] + halves[i] + gap;
    if (out[i] < minimum) out[i] = minimum;
  }
  for (let i = out.length - 2; i >= 0; i--) {
    const maximum = out[i + 1] - halves[i + 1] - halves[i] - gap;
    if (out[i] > maximum) out[i] = maximum;
  }
  return out;
}

/** Count edge crossings between two adjacent ordered ranks. */
export function countCrossings(upper, lower, edges) {
  const position = new Map(lower.map((id, index) => [id, index]));
  const pairs = [];
  for (const id of upper) {
    for (const edge of edges) {
      if (edge.source === id && position.has(edge.target)) pairs.push(position.get(edge.target));
    }
  }
  let crossings = 0;
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      if (pairs[i] > pairs[j]) crossings++;
    }
  }
  return crossings;
}
