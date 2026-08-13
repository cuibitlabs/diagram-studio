/**
 * draw.io export.
 *
 * Writes the uncompressed `<mxfile><diagram><mxGraphModel>` form so the result
 * is diffable in git and readable without the app. Geometry comes from the
 * laid-out project, so what opens in draw.io matches what the studio drew.
 */

import { buildSVG } from "../render/svg.js";

const escapeXML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));

/** Our semantic role → a draw.io style string. */
const STYLE_FOR = {
  store: "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;",
  decision: "rhombus;whiteSpace=wrap;html=1;",
  terminal: "rounded=1;whiteSpace=wrap;html=1;arcSize=40;",
  actor: "rounded=1;whiteSpace=wrap;html=1;arcSize=40;",
  state: "rounded=1;whiteSpace=wrap;html=1;arcSize=40;",
  gateway: "shape=hexagon;whiteSpace=wrap;html=1;",
  input: "shape=parallelogram;whiteSpace=wrap;html=1;",
  output: "shape=parallelogram;whiteSpace=wrap;html=1;",
  event: "ellipse;whiteSpace=wrap;html=1;",
  note: "shape=note;whiteSpace=wrap;html=1;",
  document: "shape=document;whiteSpace=wrap;html=1;",
  external: "rounded=1;whiteSpace=wrap;html=1;dashed=1;",
};

const nodeStyle = (node, theme) => {
  const base = STYLE_FOR[node.role] ?? "rounded=1;whiteSpace=wrap;html=1;arcSize=12;";
  const accent = node.tone === "accent";
  const fill = accent ? theme.accent : theme.panel;
  const stroke = accent ? theme.accent : theme.line;
  const font = accent ? theme.onAccent : theme.ink;
  return `${base}fillColor=${fill};strokeColor=${stroke};fontColor=${font};${node.dashed ? "dashed=1;" : ""}`;
};

const edgeStyle = (edge, theme) =>
  `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;jettySize=auto;orthogonalLoop=1;strokeColor=${edge.tone === "accent" ? theme.accent : theme.lineStrong};${edge.dashed ? "dashed=1;" : ""}`;

/**
 * @param {object} diagram
 * @param {{layout?: boolean}} [options] run layout first (default true) so
 *   coordinates exist even for a project that has never been rendered
 * @returns {string} mxfile XML
 */
export function toDrawio(diagram, options = {}) {
  if (options.layout !== false) buildSVG(diagram, { interactive: false, uid: "export" });
  const theme = diagram.theme;

  const cells = [
    '<mxCell id="0"/>',
    '<mxCell id="1" parent="0"/>',
    ...diagram.nodes.map((node, index) => {
      const label = node.sublabel ? `${node.label}<br/>${node.sublabel}` : node.label;
      return `<mxCell id="n${index}" value="${escapeXML(label)}" style="${escapeXML(nodeStyle(node, theme))}" vertex="1" parent="1"><mxGeometry x="${Math.round(node.x)}" y="${Math.round(node.y)}" width="${Math.round(node.w)}" height="${Math.round(node.h)}" as="geometry"/></mxCell>`;
    }),
    ...diagram.edges
      .map((edge) => {
        const source = diagram.nodes.findIndex((node) => node.id === edge.source);
        const target = diagram.nodes.findIndex((node) => node.id === edge.target);
        if (source < 0 || target < 0) return null;
        return `<mxCell id="e${source}_${target}" value="${escapeXML(edge.label ?? "")}" style="${escapeXML(edgeStyle(edge, theme))}" edge="1" parent="1" source="n${source}" target="n${target}"><mxGeometry relative="1" as="geometry"/></mxCell>`;
      })
      .filter(Boolean),
  ];

  return `<mxfile host="diagram-studio" type="device">
  <diagram name="${escapeXML(diagram.title)}">
    <mxGraphModel dx="${Math.round(diagram.width)}" dy="${Math.round(diagram.height)}" grid="1" gridSize="4" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${Math.round(diagram.width)}" pageHeight="${Math.round(diagram.height)}" background="${escapeXML(theme.paper)}" math="0" shadow="0">
      <root>
        ${cells.join("\n        ")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;
}
