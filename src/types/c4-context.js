import { createLayeredType } from "./_layered.js";

/**
 * C4 level 1: the system in its world.
 *
 * One system, the people who use it, and the systems it talks to — and nothing
 * about how any of it is built. The discipline is the point: a context diagram
 * that shows a database has stopped being a context diagram.
 */
export default createLayeredType({
  id: "c4-context",
  label: "C4 context",
  description: "One system, its users, and the systems around it",
  direction: "TB",
  rankGap: 112,
  nodeGap: 48,
  minW: 200,
  prepare(diagram) {
    for (const node of diagram.nodes) {
      if (node.c4 === "person") node.role = node.role ?? "actor";
      if (node.c4 === "external") {
        node.role = node.role ?? "external";
        node.dashed = true;
      }
      // The system under discussion is the one thing with the accent.
      if (node.c4 === "system" && !node.tone) node.tone = "accent";
    }
  },
  sample: () => ({
    nodes: [
      { label: "Customer", sublabel: "Places and tracks orders", c4: "person", icon: "user" },
      { label: "Support agent", sublabel: "Resolves order queries", c4: "person", icon: "users" },
      { label: "Order platform", sublabel: "The system being described", c4: "system" },
      { label: "Payment provider", sublabel: "Authorises and captures", c4: "external" },
      { label: "Carrier network", sublabel: "Books and tracks shipments", c4: "external" },
    ],
    edges: [
      { from: 0, to: 2, label: "places orders" },
      { from: 1, to: 2, label: "looks up orders" },
      { from: 2, to: 3, label: "authorises payment", dashed: true },
      { from: 2, to: 4, label: "books shipment", dashed: true },
    ],
  }),
});
