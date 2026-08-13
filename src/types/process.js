import { assignRanks } from "../engine/layout/graph.js";
import { createLayeredType } from "./_layered.js";

/**
 * A numbered operational workflow. Step numbers come from rank order, so they
 * stay correct when a step is inserted rather than being typed by hand.
 */
export default createLayeredType({
  id: "process",
  label: "Process",
  description: "Multi-step operational workflow",
  direction: "LR",
  rankGap: 104,
  nodeGap: 36,
  // Numbering runs before sizing so a badge is accounted for in the box width,
  // and comes from the graph rank rather than the drawn order, so it stays
  // correct when a step is inserted.
  prepare(diagram) {
    const rank = assignRanks(diagram.nodes, diagram.edges ?? []);
    const order = new Map(diagram.nodes.map((node, index) => [node.id, index]));
    [...diagram.nodes]
      .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0) || order.get(a.id) - order.get(b.id))
      .forEach((node, index) => {
        node.badge = String(index + 1);
      });
  },
  sample: () => ({
    nodes: [
      { label: "Intake", sublabel: "Request logged" },
      { label: "Qualify", sublabel: "Scope and owner agreed" },
      { label: "Plan", sublabel: "Sequence and dependencies" },
      { label: "Execute", tone: "accent" },
      { label: "Review", sublabel: "Outcome recorded" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
    ],
  }),
});
