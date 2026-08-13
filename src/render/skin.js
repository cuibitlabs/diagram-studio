/**
 * The single skin.
 *
 * Every colour is a token reference, every stroke is a hairline, there are no
 * shadows, glows or gradients. `scripts/lint-skin.py` checks this file against
 * those rules, so add new rules here rather than inlining styles in a renderer.
 */

const RULES = `
.canvas-bg{fill:var(--paper)}
.canvas-grid{pointer-events:none}
text{fill:var(--ink)}
.diagram-title-text{fill:var(--ink)}
.diagram-lede{fill:var(--muted)}

.ds-node .card{fill:var(--panel);stroke:var(--line);stroke-width:1.25}
.ds-node .card-rim{fill:none;stroke:var(--line);stroke-width:1.25}
.ds-node.is-dashed .card{stroke-dasharray:6 6}
.ds-node .node-title{fill:var(--ink)}
.ds-node .node-sub{fill:var(--muted)}
.ds-node .node-icon{color:var(--muted)}
.ds-node.tone-accent .card{fill:var(--accent);stroke:var(--accent)}
.ds-node.tone-accent .node-title,.ds-node.tone-accent .node-sub{fill:var(--on-accent)}
.ds-node.tone-muted .card{fill:var(--paper)}
.ds-node.tone-muted .node-title{fill:var(--muted)}
.ds-node.role-external .card,.ds-node.role-optional .card{stroke-dasharray:6 6}
.ds-node.role-security .card{stroke:var(--accent-2);stroke-width:1.5}
.ds-node.role-store .card{fill:var(--paper)}
.ds-node.is-selected .card{stroke:var(--accent-2);stroke-width:2.5}
.ds-node .node-badge rect{fill:var(--paper);stroke:var(--line)}
.ds-node .badge-text{fill:var(--muted)}

.ds-edge .line{fill:none;stroke:var(--line-strong);stroke-width:1.4;stroke-linejoin:round;stroke-linecap:butt}
.ds-edge .edge-hit{fill:none;stroke:transparent;stroke-width:14}
.ds-edge.is-dashed .line{stroke-dasharray:7 6}
.ds-edge.tone-accent .line{stroke:var(--accent);stroke-width:2}
.ds-edge.kind-weak .line{stroke:var(--line);stroke-width:1}
.ds-edge.is-selected .line{stroke:var(--accent-2);stroke-width:2.5}
.ds-edge .edge-label rect{fill:var(--paper);stroke:none}
.ds-edge .edge-label-text{fill:var(--muted)}

.lane rect,.group rect{fill:none;stroke:var(--line);stroke-width:1;stroke-dasharray:4 5}
.lane.is-filled rect{fill:var(--panel);stroke-dasharray:none}
.lane-title{fill:var(--muted)}

.plot-bg{fill:var(--panel);stroke:var(--line);stroke-width:1}
.axis-line{fill:none;stroke:var(--line-strong);stroke-width:1.25}
.grid-line{fill:none;stroke:var(--line);stroke-width:1}
.axis-label,.caption{fill:var(--muted)}

.mark{fill:var(--accent-2)}
.mark.is-focus{fill:var(--accent)}
.mark-line{fill:none;stroke:var(--accent);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}
.mark-area{fill:var(--accent);fill-opacity:.12;stroke:none}
.mark-label{fill:var(--muted)}
.mark-value{fill:var(--ink)}

.lifeline{fill:none;stroke:var(--line);stroke-width:1;stroke-dasharray:5 6}
.activation{fill:var(--panel);stroke:var(--line);stroke-width:1}
.timeline-axis{fill:none;stroke:var(--line-strong);stroke-width:1.25}
.timeline-stem{fill:none;stroke:var(--line);stroke-width:1}
.timeline-dot{fill:var(--paper);stroke:var(--line-strong);stroke-width:1.5}
.timeline-dot.is-focus{fill:var(--accent);stroke:var(--accent)}

.set-ring{fill:var(--accent);fill-opacity:.14;stroke:var(--accent);stroke-width:1.5}
.set-ring.set-1{fill:var(--accent-2);stroke:var(--accent-2)}
.set-ring.set-2{fill:var(--ink);stroke:var(--ink);fill-opacity:.08}
.set-label{fill:var(--ink)}

.tier{fill:var(--panel);stroke:var(--line);stroke-width:1.25}
.tier.is-focus{fill:var(--accent);stroke:var(--accent)}
.tier-label{fill:var(--ink)}
.tier.is-focus .tier-label{fill:var(--on-accent)}

.hub{fill:var(--accent-2);stroke:none}
.hub-label{fill:var(--on-accent)}

.legend-swatch{fill:var(--accent)}
.legend-swatch.is-secondary{fill:var(--accent-2)}
.legend-swatch.is-muted{fill:var(--line)}
.legend-label{fill:var(--muted)}

.entity-header{fill:var(--panel);stroke:var(--line);stroke-width:1.25}
.entity-header.is-focus{fill:var(--accent);stroke:var(--accent)}
.entity-row{fill:none;stroke:var(--line);stroke-width:1}
.entity-field{fill:var(--ink)}
.entity-type{fill:var(--muted)}
`;

/** Editor overlays and the presentation reveal. */
const OVERLAYS = `
.editor-overlay{pointer-events:none}
.snap-guide{fill:none;stroke:var(--accent-2);stroke-width:1;stroke-dasharray:3 4}
.marquee{fill:var(--accent-2);fill-opacity:.08;stroke:var(--accent-2);stroke-width:1;stroke-dasharray:4 4}
.message-mask{fill:var(--paper)}
.stepping .ds-node,.stepping .ds-edge{transition:opacity .3s ease}
.stepping.no-motion .ds-node,.stepping.no-motion .ds-edge{transition:none}
.ds-node.is-pending,.ds-edge.is-pending{opacity:.1}
`;

/** Interactive affordances, only added when the SVG is embedded in the editor. */
const INTERACTIVE = `
.ds-node[data-node-id]{cursor:grab}
.ds-node[data-node-id]:focus-visible .card{stroke:var(--accent-2);stroke-width:2.5}
.ds-node[data-node-id]:focus{outline:none}
.ds-edge[data-edge-id]{cursor:pointer}
`;

const collapse = (value) => value.replace(/\s*\n\s*/g, "").trim();

/** @param {{interactive?: boolean}} [options] */
export const skinCSS = (options = {}) => collapse(RULES + OVERLAYS + (options.interactive === false ? "" : INTERACTIVE));

/** Raw rules, exported so the linter can parse them without a browser. */
export const SKIN_RULES = RULES + OVERLAYS;
