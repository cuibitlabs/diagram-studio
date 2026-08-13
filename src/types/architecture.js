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
      { label: "Customer", role: "actor" },
      { label: "Web app", sublabel: "Browser client" },
      { label: "API gateway", sublabel: "Auth and rate limiting", tone: "accent" },
      { label: "Orders service" },
      { label: "Order store", role: "store" },
      { label: "Payments provider", role: "external" },
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
