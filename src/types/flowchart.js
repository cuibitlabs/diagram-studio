import { createLayeredType } from "./_layered.js";

/**
 * Decisions read top to bottom. Terminals are stadiums, decisions are diamonds,
 * and every branch out of a decision must be labelled — an unlabelled fork is
 * the most common way a flowchart lies.
 */
export default createLayeredType({
  id: "flowchart",
  label: "Flowchart",
  description: "Decisions and process logic",
  direction: "TB",
  rankGap: 96,
  nodeGap: 48,
  prepare(diagram) {
    const outgoing = new Map();
    for (const edge of diagram.edges ?? []) {
      outgoing.set(edge.source, (outgoing.get(edge.source) ?? 0) + 1);
    }
    for (const node of diagram.nodes) {
      if (node.shape || node.role) continue;
      if (outgoing.get(node.id) > 1) node.role = "decision";
    }
    const first = diagram.nodes[0];
    const last = diagram.nodes.at(-1);
    if (first && !first.role && !first.shape) first.role = "terminal";
    if (last && last !== first && !last.role && !last.shape) last.role = "terminal";
  },
  sample: () => ({
    nodes: [
      { label: "Request received", role: "terminal" },
      { label: "Fields complete?", role: "decision" },
      { label: "Return errors" },
      { label: "Process request", tone: "accent" },
      { label: "Confirmation sent", role: "terminal" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2, label: "no" },
      { from: 1, to: 3, label: "yes" },
      { from: 3, to: 4 },
      { from: 2, to: 1, label: "resubmit", dashed: true },
    ],
  }),
});
