import { createLayeredType } from "./_layered.js";

/**
 * C4 level 2: what the system is made of.
 *
 * Containers are separately deployable or storable things, and each one names
 * its technology — that is the whole difference from level 1. The system
 * boundary is drawn as a group so what is inside and outside is not a matter of
 * where a box happened to land.
 */
export default createLayeredType({
  id: "c4-container",
  label: "C4 container",
  description: "The deployable parts of one system, and the technology each uses",
  direction: "TB",
  rankGap: 104,
  nodeGap: 40,
  prepare(diagram) {
    for (const node of diagram.nodes) {
      if (node.c4 === "person") node.role = node.role ?? "actor";
      if (node.c4 === "store") node.role = node.role ?? "store";
      if (node.c4 === "external") {
        node.role = node.role ?? "external";
        node.dashed = true;
      }
    }
  },
  sample: () => ({
    nodes: [
      { label: "Customer", c4: "person", icon: "user" },
      { label: "Web application", sublabel: "React · server rendered", icon: "react" },
      { label: "Mobile app", sublabel: "Swift · Kotlin", icon: "mobile" },
      { label: "Orders API", sublabel: "Go · REST", tone: "accent", icon: "go" },
      { label: "Order store", sublabel: "PostgreSQL", c4: "store", icon: "postgresql" },
      { label: "Event bus", sublabel: "Kafka", c4: "store", icon: "kafka" },
      { label: "Payment provider", c4: "external", icon: "stripe" },
    ],
    edges: [
      { from: 0, to: 1, label: "uses" },
      { from: 0, to: 2, label: "uses" },
      { from: 1, to: 3, label: "JSON/HTTPS" },
      { from: 2, to: 3, label: "JSON/HTTPS" },
      { from: 3, to: 4, label: "reads and writes" },
      { from: 3, to: 5, label: "publishes" },
      { from: 3, to: 6, label: "authorises", dashed: true },
    ],
    groups: [{ label: "Order platform", nodes: [1, 2, 3, 4, 5] }],
  }),
});
