/**
 * Margin notes.
 *
 * An annotation is authored commentary, kept separate from the model's nodes so
 * it can never be mistaken for part of the system being described. Notes sit in
 * the margin with a thin leader to whatever they are about.
 */

import { layoutParagraph, roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { rectOf } from "../engine/geom.js";
import { esc, textBlock } from "./primitives.js";

const WIDTH = 220;
const GAP = 32;

/**
 * @param {object} diagram
 * @param {{width:number,height:number,margin:object}} ctx
 * @returns {string}
 */
export function annotationMarkup(diagram, ctx) {
  const notes = diagram.annotations ?? [];
  if (!notes.length) return "";
  const byId = new Map(diagram.nodes.map((node) => [node.id, rectOf(node)]));

  return notes
    .map((note) => {
      const target = note.target ? byId.get(note.target) : null;
      const block = layoutParagraph(note.text, WIDTH, TYPE.annotation, 6, TYPE.annotation.leading);

      // Explicit coordinates win; otherwise sit beside the target, or in the
      // right margin when there is nothing to point at.
      const x = roundTo(note.x ?? (target ? target.x2 + GAP : ctx.width - ctx.margin.right - WIDTH));
      const y = roundTo(note.y ?? (target ? target.y : ctx.margin.top));

      const leader = target
        ? `<path class="annotation-leader" d="M ${x - 12} ${y + 8} H ${Math.min(x - 12, target.x2 + 8)} M ${target.x2} ${target.cy} H ${target.x2 + 8} V ${y + 8}"/>`
        : "";

      return `<g class="annotation"${note.target ? ` data-annotates="${esc(note.target)}"` : ""}>
        ${leader}
        <path class="annotation-rule" d="M ${x - 12} ${y} V ${y + block.height}"/>
        ${textBlock(block.lines, x, y + TYPE.annotation.size, TYPE.annotation, { className: "annotation-text" })}
      </g>`;
    })
    .join("");
}
