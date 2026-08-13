/**
 * Accessibility and composition report.
 *
 * An audit nobody can hand to a reviewer is an audit that does not happen. This
 * produces a self-contained page: the contrast table with ratios and targets,
 * the reading order a screen reader will follow, the alt text as it will be
 * announced, the inventory of what is actually in the diagram, and the import
 * ledger if there was one.
 */

import { buildSVG } from "../render/svg.js";
import { auditTheme } from "../theme/contrast.js";
import { reviewDiagram, LIMITS } from "../model.js";
import { getType } from "../types/index.js";
import { assignRanks } from "../engine/layout/graph.js";
import { describeProvenance } from "../import/mermaid.js";
import { esc } from "../render/primitives.js";

/** The order a screen reader meets the elements: graph rank, then model order. */
export function readingOrder(diagram) {
  if (!diagram.edges?.length) return diagram.nodes.map((node, index) => ({ ...node, step: index }));
  const ranks = assignRanks(diagram.nodes, diagram.edges);
  return diagram.nodes
    .map((node, index) => ({ ...node, step: ranks.get(node.id) ?? 0, index }))
    .sort((a, b) => a.step - b.step || a.index - b.index);
}

/**
 * @param {object} diagram
 * @returns {{contrast: object[], composition: string[], order: object[], altText: string, issues: number}}
 */
export function auditReport(diagram) {
  buildSVG(diagram, { interactive: false, uid: "report" });
  const contrast = auditTheme(diagram.theme);
  const composition = reviewDiagram(diagram);
  const order = readingOrder(diagram);
  const failures = contrast.filter((row) => !row.pass && !row.decorative).length;

  return {
    contrast,
    composition,
    order,
    altText: `${diagram.title}. ${diagram.description ?? ""}`.trim(),
    issues: failures + composition.length,
  };
}

const row = (cells, tag = "td") => `<tr>${cells.map((cell) => `<${tag}>${cell}</${tag}>`).join("")}</tr>`;

/**
 * @param {object} diagram
 * @returns {string} a self-contained HTML report
 */
export function toReport(diagram) {
  const report = auditReport(diagram);
  const type = getType(diagram.type);
  const svg = buildSVG(diagram, { interactive: false, uid: "report" });

  const contrastRows = report.contrast
    .map((entry) =>
      row([
        `<code>${esc(entry.fg)}</code> on <code>${esc(entry.bg)}</code>`,
        `${entry.ratio}:1`,
        `${entry.target}:1`,
        entry.pass ? '<span class="ok">pass</span>' : entry.decorative ? '<span class="note">decorative</span>' : '<span class="bad">FAIL</span>',
        esc(entry.note),
      ]),
    )
    .join("");

  const orderRows = report.order
    .map((node, index) =>
      row([
        String(index + 1),
        esc(node.label),
        esc(node.role ?? "—"),
        esc(node.sublabel ?? "—"),
        node.tone === "accent" ? "accent" : "—",
      ]),
    )
    .join("");

  const compositionList = report.composition.length
    ? `<ul>${report.composition.map((note) => `<li>${esc(note)}</li>`).join("")}</ul>`
    : `<p class="ok">Within the ${LIMITS.budgetNodes}-node, ${LIMITS.budgetEdges}-connection, ${LIMITS.accent}-accent budget.</p>`;

  const provenance = diagram.provenance
    ? `<h2>Provenance</h2><pre>${esc(describeProvenance(diagram.provenance))}</pre>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility report — ${esc(diagram.title)}</title>
<style>
  :root{--ink:#1d211f;--muted:#5f665f;--hair:#c8c4ba;--ok:#2f6a44;--bad:#a3341f}
  body{margin:0;padding:48px;background:#f3f0e9;color:var(--ink);font:16px/1.6 Inter,system-ui,sans-serif;max-width:78ch}
  h1{font:400 40px/1.1 'Instrument Serif',Georgia,serif;margin:0 0 4px}
  h2{font-size:20px;margin:40px 0 12px;padding-top:16px;border-top:1px solid var(--hair)}
  p.lede{color:var(--muted);margin:0 0 32px}
  table{width:100%;border-collapse:collapse;font-size:14px;margin:0 0 8px}
  th{text-align:left;font:600 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);padding:8px 8px 8px 0;border-bottom:1px solid var(--hair)}
  td{padding:8px 8px 8px 0;border-bottom:1px solid var(--hair);vertical-align:top}
  code{font:13px ui-monospace,monospace;background:#fffdf8;padding:1px 5px;border:1px solid var(--hair)}
  .ok{color:var(--ok)}.bad{color:var(--bad);font-weight:700}.note{color:var(--muted)}
  figure{margin:0 0 24px;background:#fffdf8;border:1px solid var(--hair);padding:24px;overflow-x:auto}
  svg{max-width:100%;height:auto}
  pre{background:#fffdf8;border:1px solid var(--hair);padding:16px;font:13px/1.5 ui-monospace,monospace;overflow-x:auto;white-space:pre-wrap}
  .summary{display:inline-block;padding:6px 12px;border:1px solid var(--hair);background:#fffdf8;font:600 13px ui-monospace,monospace}
</style>
</head>
<body>
<h1>${esc(diagram.title)}</h1>
<p class="lede">${esc(type.label)} · ${diagram.width}×${diagram.height} · ${diagram.nodes.length} nodes · ${diagram.edges.length} connections</p>
<p class="summary">${report.issues === 0 ? '<span class="ok">No issues</span>' : `<span class="bad">${report.issues} issue${report.issues === 1 ? "" : "s"}</span>`}</p>

<figure>${svg}</figure>

<h2>Announced name</h2>
<p>A screen reader announces this diagram as:</p>
<pre>${esc(report.altText)}</pre>

<h2>Contrast</h2>
<table>
${row(["Pair", "Ratio", "Target", "Result", "Used for"], "th")}
${contrastRows}
</table>

<h2>Reading order</h2>
<p>The order the elements are met, taken from the graph rather than from where they landed on the canvas.</p>
<table>
${row(["#", "Label", "Role", "Detail", "Emphasis"], "th")}
${orderRows}
</table>

<h2>Composition</h2>
${compositionList}
${provenance}
</body>
</html>
`;
}
