/**
 * draw.io / diagrams.net importer.
 *
 * Handles both the plain `<mxGraphModel>` form and the compressed `<diagram>`
 * payload that draw.io writes by default — the previous importer told the user
 * to go and re-save their file.
 *
 * XML is scanned rather than DOM-parsed: the format's shape is narrow, the scan
 * runs identically in the browser and on the CLI, and there is no entity
 * resolution to attack.
 */

import { createDiagram, makeId } from "../model.js";

const LIMITS = { nodes: 200, edges: 400, bytes: 2 * 1024 * 1024 };

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " " };

const decodeEntities = (value) =>
  String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number(entity.slice(1)));
    return ENTITIES[entity.toLowerCase()] ?? match;
  });

const cleanLabel = (value) =>
  decodeEntities(String(value ?? ""))
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function attributes(source) {
  const found = {};
  for (const match of source.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) found[match[1]] = decodeEntities(match[2]);
  return found;
}

/** draw.io style string → our semantic role. */
function roleFromStyle(style = "") {
  const value = style.toLowerCase();
  if (/shape=cylinder|shape=datastore|mxgraph\.[^;]*database/.test(value)) return "store";
  if (/rhombus/.test(value)) return "decision";
  if (/ellipse/.test(value)) return "event";
  if (/hexagon/.test(value)) return "gateway";
  if (/shape=parallelogram/.test(value)) return "input";
  if (/shape=document/.test(value)) return "document";
  if (/shape=note/.test(value)) return "note";
  if (/shape=actor|shape=umlactor/.test(value)) return "actor";
  if (/rounded=1/.test(value)) return "terminal";
  return null;
}

const isDashed = (style = "") => /dashed=1/.test(style.toLowerCase());

/** Inflate draw.io's base64 + raw-deflate + URI-encoded payload. */
async function inflatePayload(payload) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This draw.io file is compressed and this runtime has no DecompressionStream.");
  }
  const binary = atob(payload.replace(/\s+/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const text = await new Response(stream).text();
  return decodeURIComponent(text);
}

/** Pull the `<mxGraphModel>` out of whatever wrapper the file uses. */
export async function unwrapModel(source) {
  const text = String(source);
  if (text.length > LIMITS.bytes) throw new Error("The source exceeds the 2 MiB safety limit.");
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("XML document types and entities are not allowed.");

  if (/<mxGraphModel\b/i.test(text)) return text;

  const compressed = text.match(/<diagram\b[^>]*>([\s\S]*?)<\/diagram>/i);
  const payload = compressed?.[1]?.trim();
  if (!payload) throw new Error("No draw.io model was found in this file.");
  if (/^</.test(payload)) return payload;
  return inflatePayload(payload);
}

/**
 * @param {string} source raw file contents
 * @returns {Promise<object>} a project with a `provenance` ledger
 */
export async function parseDrawio(source) {
  const model = await unwrapModel(source);
  const diagram = createDiagram("architecture", "Imported draw.io diagram", { empty: true });
  // draw.io files carry deliberate geometry; keep it until the author asks for
  // a re-layout.
  diagram.settings.preserveLayout = true;

  const labels = new Map();
  for (const match of model.matchAll(/<object\b([^>]*)>\s*<mxCell\b([^>]*?)\/?>/gi)) {
    const wrapper = attributes(match[1]);
    if (wrapper.id) labels.set(wrapper.id, wrapper.label ?? wrapper.name ?? "");
  }

  const nodes = [];
  const rawEdges = [];
  const idMap = new Map();
  const dropped = [];

  const cellPattern = /<mxCell\b([^>]*?)(\/)?>([\s\S]*?)(?:<\/mxCell>|(?=<mxCell\b)|$)/gi;
  for (const match of model.matchAll(cellPattern)) {
    const cell = attributes(match[1]);
    const inner = match[2] ? "" : match[3] ?? "";
    const geometry = attributes(inner.match(/<mxGeometry\b([^>]*)/i)?.[1] ?? "");
    const label = cleanLabel(cell.value ?? labels.get(cell.id) ?? "");

    if (cell.vertex === "1") {
      if (nodes.length >= LIMITS.nodes) {
        dropped.push(`${label || cell.id} (node limit)`);
        continue;
      }
      const id = makeId("node");
      idMap.set(cell.id, id);
      const role = roleFromStyle(cell.style);
      nodes.push({
        id,
        label: label || "Untitled",
        x: Number(geometry.x) || 0,
        y: Number(geometry.y) || 0,
        w: Number(geometry.width) || 160,
        h: Number(geometry.height) || 64,
        fixedSize: true,
        ...(role ? { role } : {}),
        ...(isDashed(cell.style) ? { dashed: true } : {}),
      });
    } else if (cell.edge === "1") {
      rawEdges.push({ source: cell.source, target: cell.target, label, style: cell.style ?? "" });
    }
  }

  if (!nodes.length) throw new Error("No draw.io vertices were found.");

  diagram.nodes = nodes;
  const danglers = [];
  diagram.edges = rawEdges
    .map((edge) => {
      const source = idMap.get(edge.source);
      const target = idMap.get(edge.target);
      if (!source || !target) {
        danglers.push(edge.label || "unlabelled connector");
        return null;
      }
      return {
        id: makeId("edge"),
        source,
        target,
        label: edge.label,
        dashed: isDashed(edge.style),
      };
    })
    .filter(Boolean)
    .slice(0, LIMITS.edges);

  diagram.provenance = {
    format: "drawio",
    sourceNodes: nodes.length + dropped.length,
    drawnNodes: nodes.length,
    dropped,
    collapsed: ["source coordinates preserved; use Re-layout to apply the studio's layout engine"],
    unsupported: danglers.length ? [`${danglers.length} connector(s) with a free endpoint`] : [],
  };
  return diagram;
}
