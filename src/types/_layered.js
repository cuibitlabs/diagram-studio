/**
 * Factory for the directed-graph family.
 *
 * Ten diagram types share ranked layout and orthogonal routing but differ in
 * direction, default shape, semantic roles and overlays. Those differences are
 * declared per type rather than reproduced as ten copies of the same renderer.
 */

import { layeredLayout } from "../engine/layout/layered.js";
import {
  contentExtent,
  drawEdges,
  drawGroups,
  drawNodes,
  groupRects,
  routeAll,
  sizeAll,
} from "./_base.js";

export function createLayeredType(config) {
  return {
    id: config.id,
    label: config.label,
    description: config.description,
    family: "layered",
    direction: config.direction ?? "LR",
    sample: config.sample,

    layout(diagram, ctx) {
      config.prepare?.(diagram, ctx);
      sizeAll(diagram.nodes, ctx, config);

      const direction = diagram.settings?.direction ?? config.direction ?? "LR";
      // An import that carried deliberate geometry keeps it until the author
      // asks for a re-layout.
      const result = diagram.settings?.preserveLayout
        ? { ranks: [], reversed: new Set() }
        : layeredLayout(diagram.nodes, diagram.edges ?? [], {
            direction,
            rankGap: config.rankGap ?? 120,
            nodeGap: config.nodeGap ?? 40,
            origin: { x: ctx.margin.left, y: ctx.margin.top },
          });

      config.arrange?.(diagram, ctx, result);
      const groups = groupRects(diagram);
      const routes = routeAll(diagram, config);
      const extent = contentExtent(diagram, ctx, groups);

      return { ...result, direction, routes, groups, width: extent.width, height: extent.height };
    },

    draw(diagram, ctx, layout) {
      return [
        drawGroups(layout.groups, config.groupOptions),
        config.underlay?.(diagram, ctx, layout) ?? "",
        drawEdges(diagram, ctx, layout.routes, { marker: config.marker }),
        drawNodes(diagram, ctx, { shape: config.defaultShape }),
        config.overlay?.(diagram, ctx, layout) ?? "",
      ].join("");
    },
  };
}
