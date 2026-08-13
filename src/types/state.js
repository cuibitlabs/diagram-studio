import { createLayeredType } from "./_layered.js";

/**
 * States are stadiums; transitions are labelled with the event that causes
 * them. The entry marker is a filled dot and terminal states get a ring, so the
 * lifecycle boundaries read without colour.
 */
export default createLayeredType({
  id: "state",
  label: "State machine",
  description: "States and the events that move between them",
  direction: "LR",
  rankGap: 112,
  nodeGap: 40,
  defaultShape: "stadium",
  prepare(diagram) {
    const incoming = new Set((diagram.edges ?? []).map((edge) => edge.target));
    const outgoing = new Set((diagram.edges ?? []).map((edge) => edge.source));
    for (const node of diagram.nodes) {
      if (node.stateKind) continue;
      if (!incoming.has(node.id)) node.stateKind = "initial";
      else if (!outgoing.has(node.id)) node.stateKind = "final";
    }
  },
  overlay(diagram) {
    return diagram.nodes
      .map((node) => {
        if (node.stateKind === "initial") {
          return `<circle class="timeline-dot is-focus" cx="${node.x - 28}" cy="${node.y + node.h / 2}" r="7"/><path class="axis-line" d="M ${node.x - 21} ${node.y + node.h / 2} H ${node.x}"/>`;
        }
        if (node.stateKind === "final") {
          return `<circle class="timeline-dot" cx="${node.x + node.w + 28}" cy="${node.y + node.h / 2}" r="10"/><circle class="mark" cx="${node.x + node.w + 28}" cy="${node.y + node.h / 2}" r="5"/><path class="axis-line" d="M ${node.x + node.w} ${node.y + node.h / 2} H ${node.x + node.w + 18}"/>`;
        }
        return "";
      })
      .join("");
  },
  sample: () => ({
    nodes: [
      // Entry and exit are declared, not inferred: a lifecycle with a rejection
      // path back to the first state has no node without an incoming edge.
      { label: "Draft", stateKind: "initial" },
      { label: "In review" },
      { label: "Approved", tone: "accent" },
      { label: "Published" },
      { label: "Archived", stateKind: "final" },
    ],
    edges: [
      { from: 0, to: 1, label: "submit" },
      { from: 1, to: 2, label: "approve" },
      { from: 1, to: 0, label: "reject", dashed: true },
      { from: 2, to: 3, label: "publish" },
      { from: 3, to: 4, label: "retire" },
    ],
  }),
});
