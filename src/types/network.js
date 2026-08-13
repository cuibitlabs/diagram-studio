import { createLayeredType } from "./_layered.js";

/**
 * Zones are groups, not colours. Anything outside the trust boundary is drawn
 * with a dashed outline so the boundary survives a black-and-white print.
 */
export default createLayeredType({
  id: "network",
  label: "Network topology",
  description: "Devices, zones and the links between them",
  direction: "LR",
  rankGap: 128,
  nodeGap: 36,
  marker: "arrow-open",
  prepare(diagram) {
    for (const node of diagram.nodes) {
      if (node.zone === "public" && !node.dashed) node.dashed = true;
    }
  },
  sample: () => ({
    nodes: [
      { label: "Internet", role: "external", zone: "public", icon: "globe" },
      { label: "Edge", sublabel: "Load balancer", icon: "balancer" },
      { label: "Application tier", tone: "accent", icon: "server" },
      { label: "Private subnet", sublabel: "No inbound route", icon: "firewall" },
      { label: "Database", role: "store", icon: "database" },
    ],
    edges: [
      { from: 0, to: 1, label: "443" },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4, label: "5432" },
    ],
    groups: [
      { label: "Perimeter", nodes: [0, 1] },
      { label: "Private network", nodes: [2, 3, 4] },
    ],
  }),
});
