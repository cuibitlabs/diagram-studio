/**
 * Fishbone (Ishikawa).
 *
 * One effect on the right, the categories of cause branching off a spine. The
 * format earns its place only when the causes are grouped — an ungrouped list of
 * causes is a list, and should be drawn as one.
 *
 * The bones are diagonal on purpose: they are a grouping device, not a route,
 * so the orthogonal-connector rule does not apply to this family.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { boxPath } from "../render/shapes.js";
import { measureNodeBox } from "../engine/box.js";
import { contentExtent } from "./_base.js";

const SPINE_LENGTH = 820;
const BONE_RISE = 176;
const BONE_RUN = 120;
const CAUSE_GAP = 26;

/** Causes belong to the category named on the node; the rest form the spine. */
function group(diagram) {
  const categories = [];
  const causes = new Map();
  for (const node of diagram.nodes) {
    if (node.cause) {
      if (!causes.has(node.cause)) causes.set(node.cause, []);
      causes.get(node.cause).push(node);
    } else {
      categories.push(node);
    }
  }
  return { categories, causes };
}

export default {
  id: "fishbone",
  label: "Fishbone",
  description: "One effect and the categories of cause behind it",
  family: "fishbone",

  layout(diagram, ctx) {
    const { categories, causes } = group(diagram);
    const effect = categories.at(-1) ?? categories[0];
    const bones = categories.filter((node) => node !== effect);

    const spineY = roundTo(ctx.margin.top + BONE_RISE);
    const spineStart = ctx.margin.left;
    const spineEnd = spineStart + SPINE_LENGTH;

    // The effect box closes the spine.
    if (effect) {
      const box = measureNodeBox(effect, { minW: 200, maxW: 240 });
      effect.w = box.w;
      effect.h = box.h;
      effect.x = roundTo(spineEnd + 24);
      effect.y = roundTo(spineY - box.h / 2);
      effect.fixedSize = true;
    }

    const spacing = bones.length ? SPINE_LENGTH / (Math.ceil(bones.length / 2) + 1) : SPINE_LENGTH;
    const placed = bones.map((node, index) => {
      const above = index % 2 === 0;
      const column = Math.floor(index / 2);
      const anchorX = roundTo(spineStart + spacing * (column + 1));
      const box = measureNodeBox(node, { minW: 152, maxW: 200, minH: 44, dense: true });
      node.w = box.w;
      node.h = box.h;
      node.fixedSize = true;
      node.x = roundTo(anchorX + BONE_RUN - node.w / 2);
      node.y = roundTo(above ? spineY - BONE_RISE - node.h / 2 : spineY + BONE_RISE - node.h / 2);

      const attached = causes.get(node.label) ?? [];
      attached.forEach((cause, causeIndex) => {
        cause.fixedSize = true;
        cause.w = 0;
        cause.h = 0;
        const t = (causeIndex + 1) / (attached.length + 1);
        cause.x = roundTo(anchorX + BONE_RUN * t + 12);
        cause.y = roundTo(above ? spineY - BONE_RISE * t : spineY + BONE_RISE * t);
      });

      return { node, anchorX, above, causes: attached };
    });

    const rects = [
      { x: spineStart, y: spineY - BONE_RISE - 60, w: SPINE_LENGTH + 280, h: BONE_RISE * 2 + 120 },
    ];
    const extent = contentExtent(diagram, ctx, rects);
    return { spineY, spineStart, spineEnd, effect, bones: placed, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const { spineY, spineStart, spineEnd, effect } = layout;

    const bones = layout.bones
      .map(({ node, anchorX, above, causes }) => {
        const tipX = anchorX + BONE_RUN;
        const tipY = above ? spineY - BONE_RISE : spineY + BONE_RISE;
        const labels = causes
          .map((cause) => text(cause.label, cause.x, cause.y + (above ? -6 : 14), TYPE.nodeSub, { className: "mark-label" }))
          .join("");
        return `<g class="bone" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}">
          <path class="bone-line" d="M ${anchorX} ${spineY} L ${tipX} ${tipY}"/>
          <path class="card bone-head" d="${boxPath({ x: node.x, y: node.y, w: node.w, h: node.h }, 6)}"/>
          ${text(node.label, node.x + node.w / 2, node.y + node.h / 2 + 5, TYPE.nodeTitleSmall, { anchor: "middle", className: "node-title" })}
          ${labels}
        </g>`;
      })
      .join("");

    const effectBox = effect
      ? `<g class="ds-node tone-accent" data-node-id="${esc(effect.id)}" tabindex="0" role="button" aria-label="${esc(effect.label)}">
          <path class="card" d="${boxPath({ x: effect.x, y: effect.y, w: effect.w, h: effect.h }, ctx.corner ?? 8)}"/>
          ${text(effect.label, effect.x + effect.w / 2, effect.y + effect.h / 2 + 5, TYPE.nodeTitle, { anchor: "middle", className: "node-title" })}
        </g>`
      : "";

    return `<path class="spine" d="M ${spineStart} ${spineY} H ${spineEnd}" marker-end="url(#${ctx.uid}-arrow)"/>
      ${bones}${effectBox}`;
  },

  sample: () => ({
    nodes: [
      { label: "People" },
      { label: "Process" },
      { label: "Tooling" },
      { label: "Data" },
      { label: "Two people know the deploy", cause: "People" },
      { label: "No pairing on releases", cause: "People" },
      { label: "Release checklist is verbal", cause: "Process" },
      { label: "Rollback is manual", cause: "Process" },
      { label: "Staging drifts from production", cause: "Tooling" },
      { label: "Migrations are unversioned", cause: "Data" },
      { label: "Releases fail on Fridays", tone: "accent" },
    ],
    edges: [],
  }),
};
