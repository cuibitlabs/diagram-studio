/**
 * Plate furniture.
 *
 * The signature of the visual system, and the one place it is allowed to be
 * bold. Everything else in a diagram is quiet on purpose.
 *
 * It is not decoration. The corner ticks are drawn at the real 4 px module the
 * engine snaps every coordinate to, and the spec line states the canvas the
 * layout actually produced. A reader who wants to know whether this drawing was
 * measured or eyeballed can see the answer in the corner.
 *
 * Opt in with `settings.plate`. Off by default: a diagram pasted into a slide
 * does not want a frame around it.
 */

import { TYPE } from "../engine/typography.js";
import { text } from "./primitives.js";

const MODULE = 4;
const TICK_RUN = 48;
const TICK_LENGTH = 6;
const RULE_OFFSET = 36;

/**
 * @param {object} diagram
 * @param {{width:number, height:number, margin:object}} ctx
 * @param {{typeLabel:string}} meta
 * @returns {string}
 */
export function plateMarkup(diagram, ctx, meta) {
  const left = ctx.margin.left;
  const right = ctx.width - ctx.margin.right;
  const top = Math.max(24, ctx.margin.top - RULE_OFFSET);
  const bottom = ctx.height - Math.max(20, ctx.margin.bottom - RULE_OFFSET);

  // The module ticks: the grid the engine enforces, drawn at its real spacing.
  const ticks = [];
  for (let offset = 0; offset <= TICK_RUN; offset += MODULE) {
    const long = offset % (MODULE * 4) === 0;
    const length = long ? TICK_LENGTH : TICK_LENGTH / 2;
    ticks.push(`M ${left + offset} ${top} v ${length}`);
    ticks.push(`M ${left} ${top + offset} h ${length}`);
  }

  const spec = `${Math.round(ctx.width)} × ${Math.round(ctx.height)} · ${MODULE}px module`;
  const census = `${diagram.nodes.length} ${diagram.nodes.length === 1 ? "element" : "elements"} · ${diagram.edges.length} ${diagram.edges.length === 1 ? "connection" : "connections"}`;

  return `<g class="plate" aria-hidden="true">
    <path class="plate-rule" d="M ${left} ${top} H ${right}"/>
    <path class="plate-rule" d="M ${left} ${bottom} H ${right}"/>
    <path class="plate-tick" d="${ticks.join(" ")}"/>
    ${text(meta.typeLabel, left, top - 12, TYPE.section, { className: "plate-label" })}
    ${text(spec, right, top - 12, TYPE.axis, { anchor: "end", className: "plate-spec" })}
    ${diagram.figure ? text(diagram.figure, left, bottom + 22, TYPE.axis, { className: "plate-spec" }) : ""}
    ${text(census, right, bottom + 22, TYPE.axis, { anchor: "end", className: "plate-spec" })}
  </g>`;
}

export const PLATE_CSS = `
.plate-rule{fill:none;stroke:var(--line);stroke-width:1}
.plate-tick{fill:none;stroke:var(--accent);stroke-width:1}
.plate-label{fill:var(--ink)}
.plate-spec{fill:var(--soft)}
`;
