/**
 * Entity relationship model.
 *
 * Entities are tables, not boxes with a name: fields and their types are the
 * content, so the diagram answers schema questions instead of gesturing at them.
 * Relationship ends use crow's-foot markers driven by the edge's `cardinality`.
 */

import { boxPath } from "../render/shapes.js";
import { ceilTo, measureText, roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { layeredLayout } from "../engine/layout/layered.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, drawEdges, routeAll } from "./_base.js";

const HEADER_H = 40;
const ROW_H = 28;
const PAD_X = 16;
const COL_GAP = 24;

const fieldsOf = (node) => (Array.isArray(node.fields) ? node.fields : []);

function sizeEntities(nodes) {
  for (const node of nodes) {
    if (node.fixedSize) continue;
    const fields = fieldsOf(node);
    const nameWidth = Math.max(
      measureText(node.label, TYPE.nodeTitle),
      ...fields.map((field) => measureText(field.name ?? "", TYPE.nodeSub)),
    );
    const typeWidth = Math.max(0, ...fields.map((field) => measureText(field.type ?? "", TYPE.meta)));
    node.w = ceilTo(Math.max(192, nameWidth + typeWidth + COL_GAP + PAD_X * 2));
    node.h = ceilTo(HEADER_H + Math.max(1, fields.length) * ROW_H + 8);
  }
}

function entityMarkup(node, ctx) {
  const fields = fieldsOf(node);
  const focus = node.tone === "accent";
  const rows = fields
    .map((field, index) => {
      const y = node.y + HEADER_H + index * ROW_H;
      const label = field.key ? `${field.name}  ·  ${field.key}` : field.name;
      return `${index > 0 ? `<path class="entity-row" d="M ${node.x} ${y} H ${node.x + node.w}"/>` : ""}
        ${text(label, node.x + PAD_X, y + 19, TYPE.nodeSub, { className: "entity-field" })}
        ${field.type ? text(field.type, node.x + node.w - PAD_X, y + 19, TYPE.meta, { anchor: "end", className: "entity-type" }) : ""}`;
    })
    .join("");

  const interactive = ctx.interactive === false
    ? ""
    : ` data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}, ${fields.length} fields"`;

  return `<g class="ds-node entity ${focus ? "tone-accent" : ""} ${ctx.selectedId === node.id ? "is-selected" : ""}"${interactive}>
    <path class="card" d="${boxPath({ x: node.x, y: node.y, w: node.w, h: node.h }, ctx.corner ?? 8)}"/>
    <path class="entity-header ${focus ? "is-focus" : ""}" d="M ${node.x} ${node.y + HEADER_H} V ${node.y + 8} A 8 8 0 0 1 ${node.x + 8} ${node.y} H ${node.x + node.w - 8} A 8 8 0 0 1 ${node.x + node.w} ${node.y + 8} V ${node.y + HEADER_H} Z"/>
    ${text(node.label, node.x + PAD_X, node.y + 26, TYPE.nodeTitle, { className: "node-title" })}
    <path class="entity-row" d="M ${node.x} ${node.y + HEADER_H} H ${node.x + node.w}"/>
    ${rows}
  </g>`;
}

export default {
  id: "er",
  label: "ER / data model",
  description: "Entities, their fields and the relationships between them",
  family: "er",

  layout(diagram, ctx) {
    sizeEntities(diagram.nodes);
    const result = layeredLayout(diagram.nodes, diagram.edges ?? [], {
      direction: diagram.settings?.direction ?? "LR",
      rankGap: 136,
      nodeGap: 48,
      origin: { x: ctx.margin.left, y: ctx.margin.top },
    });
    for (const node of diagram.nodes) {
      node.x = roundTo(node.x);
      node.y = roundTo(node.y);
    }
    const routes = routeAll(diagram, {});
    const extent = contentExtent(diagram, ctx);
    return { ...result, routes, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    return [
      drawEdges(diagram, ctx, layout.routes, { marker: "crowfoot" }),
      diagram.nodes.map((node) => entityMarkup(node, ctx)).join(""),
    ].join("");
  },

  sample: () => ({
    nodes: [
      {
        label: "Customer",
        fields: [
          { name: "id", type: "uuid", key: "PK" },
          { name: "email", type: "text" },
          { name: "created_at", type: "timestamptz" },
        ],
      },
      {
        label: "Order",
        tone: "accent",
        fields: [
          { name: "id", type: "uuid", key: "PK" },
          { name: "customer_id", type: "uuid", key: "FK" },
          { name: "status", type: "text" },
          { name: "placed_at", type: "timestamptz" },
        ],
      },
      {
        label: "Order item",
        fields: [
          { name: "order_id", type: "uuid", key: "FK" },
          { name: "product_id", type: "uuid", key: "FK" },
          { name: "quantity", type: "integer" },
        ],
      },
      {
        label: "Product",
        fields: [
          { name: "id", type: "uuid", key: "PK" },
          { name: "sku", type: "text" },
          { name: "name", type: "text" },
        ],
      },
    ],
    edges: [
      { from: 0, to: 1, label: "places" },
      { from: 1, to: 2, label: "contains" },
      { from: 3, to: 2, label: "listed in" },
    ],
  }),
};
