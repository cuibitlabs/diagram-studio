import { createLayeredType } from "./_layered.js";

export default createLayeredType({
  id: "architecture",
  label: "Architecture",
  description: "Systems, services and the connections between them",
  direction: "LR",
  rankGap: 128,
  nodeGap: 40,
  sample: () => ({
    nodes: [
      { label: "Customer", role: "actor", icon: "user" },
      { label: "Web app", sublabel: "Browser client", icon: "browser" },
      { label: "API gateway", sublabel: "Auth and rate limiting", tone: "accent", icon: "gateway" },
      { label: "Orders service", icon: "server" },
      { label: "Order store", role: "store", icon: "database" },
      { label: "Payments provider", role: "external", icon: "cloud" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4, label: "read/write" },
      { from: 3, to: 5, label: "charge", dashed: true },
    ],
  }),
});
