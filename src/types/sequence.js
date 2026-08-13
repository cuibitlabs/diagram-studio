/**
 * Sequence diagram.
 *
 * Participants are columns, time runs down. Message order is the model's edge
 * order — never re-sorted — because reordering messages changes the meaning.
 * Returns are dashed with an open arrowhead; self-calls loop to the right.
 */

import { measureText, roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { nodeCard, text } from "../render/primitives.js";
import { sizeAll } from "./_base.js";

const HEAD_GAP = 64;
const FIRST_MESSAGE = 72;
const ROW_GAP = 64;
const SELF_WIDTH = 72;
const SELF_HEIGHT = 44;
const TAIL = 48;

const isReturn = (edge) => edge.kind === "return" || edge.dashed;

export default {
  id: "sequence",
  label: "Sequence",
  description: "Messages between participants arranged over time",
  family: "sequence",

  layout(diagram, ctx) {
    const nodes = diagram.nodes;
    // Sized through the shared path so the shape allowance a participant needs
    // — actors are stadiums — is reserved before the heads are placed.
    sizeAll(nodes, ctx, { minW: 144, maxW: 224, minH: 64, maxSubLines: 1 });
    let cursor = ctx.margin.left;
    for (const node of nodes) {
      node.x = roundTo(cursor);
      node.y = roundTo(ctx.margin.top);
      cursor += node.w + HEAD_GAP;
    }

    const headBottom = ctx.margin.top + Math.max(0, ...nodes.map((node) => node.h));
    const rows = (diagram.edges ?? []).map((edge, index) => ({
      edge,
      y: roundTo(headBottom + FIRST_MESSAGE + index * ROW_GAP),
      self: edge.source === edge.target,
    }));

    const lastY = rows.length ? rows.at(-1).y : headBottom;
    const bottom = lastY + (rows.some((row) => row.self) ? SELF_HEIGHT : 0) + TAIL;

    return {
      rows,
      headBottom,
      bottom,
      width: Math.max(0, cursor - HEAD_GAP - ctx.margin.left),
      height: bottom - ctx.margin.top,
    };
  },

  draw(diagram, ctx, layout) {
    const byId = new Map(diagram.nodes.map((node) => [node.id, node]));

    const lifelines = diagram.nodes
      .map((node) => `<path class="lifeline" d="M ${node.x + node.w / 2} ${node.y + node.h} V ${layout.bottom}"/>`)
      .join("");

    const messages = layout.rows
      .map((row, index) => {
        const source = byId.get(row.edge.source);
        const target = byId.get(row.edge.target);
        if (!source || !target) return "";
        const label = String(row.edge.label ?? "").trim();
        const dashed = isReturn(row.edge) ? " is-dashed" : "";
        const marker = isReturn(row.edge) ? "arrow-open" : "arrow";
        const accent = row.edge.tone === "accent" ? " tone-accent" : "";
        const classes = `ds-edge sequence-message${dashed}${accent}${ctx.selectedId === row.edge.id ? " is-selected" : ""}`;

        if (row.self) {
          const x = source.x + source.w / 2;
          const d = `M ${x} ${row.y} H ${x + SELF_WIDTH} V ${row.y + SELF_HEIGHT} H ${x}`;
          return `<g class="${classes}" data-edge-id="${row.edge.id}">
            <path class="edge-hit" d="${d}"/>
            <path class="line" d="${d}" marker-end="url(#${ctx.uid}-${marker})"/>
            ${label ? text(label, x + SELF_WIDTH + 12, row.y + SELF_HEIGHT / 2 + 4, TYPE.edgeLabel, { className: "edge-label-text" }) : ""}
          </g>`;
        }

        const x1 = source.x + source.w / 2;
        const x2 = target.x + target.w / 2;
        const d = `M ${x1} ${row.y} H ${x2}`;
        const midpoint = (x1 + x2) / 2;
        const width = label ? measureText(label, TYPE.edgeLabel) + 16 : 0;

        return `<g class="${classes}" data-edge-id="${row.edge.id}">
          <path class="edge-hit" d="${d}"/>
          <path class="line" d="${d}" marker-end="url(#${ctx.uid}-${marker})"/>
          ${label ? `<rect class="message-mask" x="${midpoint - width / 2}" y="${row.y - 26}" width="${width}" height="20" rx="6"/>${text(label, midpoint, row.y - 12, TYPE.edgeLabel, { anchor: "middle", className: "edge-label-text" })}` : ""}
          ${text(String(index + 1), x1 + (x2 > x1 ? 10 : -10), row.y + 16, TYPE.meta, { anchor: x2 > x1 ? "start" : "end", className: "axis-label" })}
        </g>`;
      })
      .join("");

    const heads = diagram.nodes
      .map((node) => nodeCard(node, { corner: ctx.corner, selectedId: ctx.selectedId, interactive: ctx.interactive, centre: true }))
      .join("");

    return `${lifelines}${messages}${heads}`;
  },

  sample: () => ({
    nodes: [
      { label: "Customer", role: "actor" },
      { label: "Web app" },
      { label: "Auth service", tone: "accent" },
      { label: "Account store", role: "store" },
    ],
    edges: [
      { from: 0, to: 1, label: "sign in" },
      { from: 1, to: 2, label: "authenticate" },
      { from: 2, to: 3, label: "lookup account" },
      { from: 3, to: 2, label: "profile", kind: "return" },
      { from: 2, to: 1, label: "session token", kind: "return" },
      { from: 1, to: 0, label: "signed in", kind: "return" },
    ],
  }),
};
