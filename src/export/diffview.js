/**
 * Visual diff.
 *
 * A textual diff of a diagram tells you a node id changed. This draws the newer
 * version and marks what moved, what arrived and what left, so a reviewer can
 * see the change instead of reconstructing it.
 *
 * Removed elements are drawn as ghosts in their old positions, because "what
 * disappeared" is the part a text diff hides best.
 */

import { buildSVG } from "../render/svg.js";
import { diffProjects } from "../edit/diff.js";
import { rectOf } from "../engine/geom.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { boxPath } from "../render/shapes.js";

const MARK = {
  added: { label: "added", colour: "#2f6a44" },
  removed: { label: "removed", colour: "#a3341f" },
  changed: { label: "changed", colour: "#8a5a12" },
};

const overlayStyle = `
.diff-mark{fill:none;stroke-width:2.5;stroke-dasharray:6 4}
.diff-mark.added{stroke:${MARK.added.colour}}
.diff-mark.changed{stroke:${MARK.changed.colour}}
.diff-ghost path{fill:none;stroke:${MARK.removed.colour};stroke-width:2;stroke-dasharray:4 5;opacity:.75}
.diff-ghost text{fill:${MARK.removed.colour};opacity:.85}
.diff-tag{font:600 11px ui-monospace,monospace}
.diff-tag.added{fill:${MARK.added.colour}}
.diff-tag.removed{fill:${MARK.removed.colour}}
.diff-tag.changed{fill:${MARK.changed.colour}}
.diff-key rect{fill:none;stroke-width:2.5;stroke-dasharray:6 4}
`;

/**
 * @param {object} before
 * @param {object} after
 * @returns {{svg: string, diff: object}}
 */
export function toDiffSVG(before, after) {
  // Both sides are laid out so positions are comparable.
  buildSVG(before, { interactive: false, uid: "diff-before" });
  const svg = buildSVG(after, { interactive: false, uid: "diff-after" });
  const diff = diffProjects(before, after);

  const marks = [];

  for (const node of diff.nodes.added) {
    const rect = rectOf(node);
    marks.push(
      `<g class="diff-node"><path class="diff-mark added" d="${boxPath({ x: rect.x - 6, y: rect.y - 6, w: rect.w + 12, h: rect.h + 12 }, 10)}"/>${text(
        "added",
        rect.x - 6,
        rect.y - 12,
        TYPE.meta,
        { className: "diff-tag added" },
      )}</g>`,
    );
  }

  for (const change of diff.nodes.changed) {
    const node = after.nodes.find((item) => item.id === change.id);
    if (!node) continue;
    const rect = rectOf(node);
    const label = change.fields.length ? change.fields.join(", ") : "moved";
    marks.push(
      `<g class="diff-node"><path class="diff-mark changed" d="${boxPath({ x: rect.x - 6, y: rect.y - 6, w: rect.w + 12, h: rect.h + 12 }, 10)}"/>${text(
        label,
        rect.x - 6,
        rect.y - 12,
        TYPE.meta,
        { className: "diff-tag changed" },
      )}</g>`,
    );
  }

  for (const node of diff.nodes.removed) {
    const rect = rectOf(node);
    if (!rect.w || !rect.h) continue;
    marks.push(
      `<g class="diff-ghost" aria-label="removed: ${esc(node.label)}"><path d="${boxPath(rect, 10)}"/>${text(
        node.label,
        rect.x + 16,
        rect.y + 28,
        TYPE.nodeTitle,
      )}${text("removed", rect.x, rect.y - 8, TYPE.meta, { className: "diff-tag removed" })}</g>`,
    );
  }

  const counts = [
    diff.nodes.added.length ? `${diff.nodes.added.length} added` : "",
    diff.nodes.removed.length ? `${diff.nodes.removed.length} removed` : "",
    diff.nodes.changed.length ? `${diff.nodes.changed.length} changed` : "",
  ].filter(Boolean);

  const key = `<g class="diff-key">${counts
    .map((entry, index) => {
      const kind = entry.split(" ")[1];
      return `<rect x="${24 + index * 148}" y="24" width="14" height="14" rx="4" stroke="${MARK[kind].colour}"/>${text(
        entry,
        44 + index * 148,
        36,
        TYPE.meta,
        { className: `diff-tag ${kind}` },
      )}`;
    })
    .join("")}</g>`;

  const overlay = `<style>${overlayStyle}</style><g class="diff-overlay">${marks.join("")}${counts.length ? key : ""}</g>`;
  return { svg: svg.replace("</svg>", `${overlay}</svg>`), diff };
}
