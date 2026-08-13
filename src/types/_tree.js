/**
 * Factory for hierarchy types drawn with the tidy-tree algorithm.
 */

import { treeLayout } from "../engine/layout/tree.js";
import { contentExtent, drawEdges, drawNodes, routeAll, sizeAll } from "./_base.js";

export function createTreeType(config) {
  return {
    id: config.id,
    label: config.label,
    description: config.description,
    family: "hierarchy",
    sample: config.sample,

    layout(diagram, ctx) {
      config.prepare?.(diagram, ctx);
      sizeAll(diagram.nodes, ctx, config);
      const result = treeLayout(diagram.nodes, diagram.edges ?? [], {
        direction: diagram.settings?.direction ?? config.direction ?? "TB",
        levelGap: config.levelGap ?? 88,
        siblingGap: config.siblingGap ?? 32,
        subtreeGap: config.subtreeGap ?? 56,
        origin: { x: ctx.margin.left, y: ctx.margin.top },
      });
      const routes = routeAll(diagram, config);
      const extent = contentExtent(diagram, ctx);
      return { ...result, routes, width: extent.width, height: extent.height };
    },

    draw(diagram, ctx, layout) {
      return [
        drawEdges(diagram, ctx, layout.routes, { marker: config.marker ?? "arrow" }),
        drawNodes(diagram, ctx, { shape: config.defaultShape }),
        config.overlay?.(diagram, ctx, layout) ?? "",
      ].join("");
    },
  };
}
