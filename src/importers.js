import { createDiagram, makeId } from "./model.js";
import { completeTheme } from "./theme/palettes.js";

const clean = (value = "") => value.replace(/^['"`]|['"`]$/g, "").replace(/<br\s*\/?>/gi, " · ").trim();

export function parseMermaid(source) {
  const text = source.replace(/```mermaid\s*/i, "").replace(/```\s*$/i, "").trim();
  if (!text) throw new Error("The Mermaid source is empty.");
  const first = text.split(/\n/)[0].trim().toLowerCase();
  let type = "flowchart";
  if (first.startsWith("sequence")) type = "sequence";
  else if (first.startsWith("state")) type = "state";
  else if (first.startsWith("erdiagram")) type = "er";
  else if (first.startsWith("gantt")) type = "gantt";
  else if (first.startsWith("journey")) type = "journey";
  else if (first.startsWith("timeline")) type = "timeline";

  const diagram = createDiagram(type, "Imported Mermaid diagram", { empty: true });
  const labels = new Map();
  const edgeSpecs = [];
  const remember = (id, label = id) => { if (id && !labels.has(id)) labels.set(id, clean(label || id)); };

  if (type === "sequence") {
    for (const raw of text.split(/\n/).slice(1)) {
      const line = raw.trim();
      let match = line.match(/^(?:participant|actor)\s+([\w.-]+)(?:\s+as\s+(.+))?$/i);
      if (match) { remember(match[1], match[2] || match[1]); continue; }
      match = line.match(/^([\w.-]+)\s*[-=.]+>>?\+?\s*([\w.-]+)\s*:\s*(.+)$/);
      if (match) { remember(match[1]); remember(match[2]); edgeSpecs.push([match[1], match[2], clean(match[3])]); }
    }
  } else if (type === "er") {
    for (const raw of text.split(/\n/).slice(1)) {
      const line = raw.trim();
      const match = line.match(/^([\w.-]+)\s+[^:]+\s+([\w.-]+)\s*:\s*(.*)$/);
      if (match) { remember(match[1]); remember(match[2]); edgeSpecs.push([match[1], match[2], clean(match[3])]); }
      else if (/^[\w.-]+\s*\{$/.test(line)) remember(line.split(/\s/)[0]);
    }
  } else if (type === "gantt") {
    for (const raw of text.split(/\n/).slice(1)) {
      const line = raw.trim();
      if (!line || /^(dateFormat|axisFormat|title|section)\b/i.test(line)) continue;
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) remember(`task-${labels.size + 1}`, match[1]);
    }
  } else {
    const nodePattern = /([A-Za-z0-9_.-]+)(?:\s*[\[({]{1,2}["']?([^\])}"']+)["']?[\])}]{1,2})?/g;
    for (const raw of text.split(/\n/).slice(1)) {
      const line = raw.trim();
      if (!line || /^(direction|title|classDef|style|linkStyle|section|dateFormat|axisFormat)\b/i.test(line)) continue;
      const arrow = line.match(/^(.+?)\s*(-->|==>|-.->|---|--[^-]+-->)\s*(.+)$/);
      if (arrow) {
        const left = [...arrow[1].matchAll(nodePattern)][0];
        const right = [...arrow[3].matchAll(nodePattern)][0];
        if (left && right) {
          remember(left[1], left[2] || left[1]); remember(right[1], right[2] || right[1]);
          const edgeLabel = arrow[2].replace(/[-=.>]/g, "").trim();
          edgeSpecs.push([left[1], right[1], edgeLabel]);
        }
      } else {
        for (const match of line.matchAll(nodePattern)) remember(match[1], match[2] || match[1]);
      }
    }
  }

  if (!labels.size) throw new Error("No supported Mermaid nodes were found.");
  const idLookup = new Map();
  // Geometry is left at zero: the type renderer sizes and places every node, so
  // an import lands in the same layout an authored diagram would.
  diagram.nodes = [...labels].slice(0, 60).map(([sourceId, label], index) => {
    const id = makeId("node");
    idLookup.set(sourceId, id);
    return { id, label, x: 0, y: 0, w: 0, h: 0, ...(index === 1 ? { tone: "accent" } : {}) };
  });
  diagram.edges = edgeSpecs
    .slice(0, 100)
    .map(([source, target, label]) => ({ id: makeId("edge"), source: idLookup.get(source), target: idLookup.get(target), label, dashed: false }))
    .filter((edge) => edge.source && edge.target);
  return diagram;
}

export function parseDrawio(source) {
  if (typeof DOMParser === "undefined") throw new Error("draw.io import requires a browser DOMParser.");
  const doc = new DOMParser().parseFromString(source, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("The draw.io XML is not valid.");
  const diagram = createDiagram("architecture", "Imported draw.io diagram", { empty: true });
  // draw.io files carry deliberate geometry; keep it and let the author opt in
  // to a re-layout rather than silently rearranging their diagram.
  diagram.settings.preserveLayout = true;
  const nodes = [];
  const edges = [];
  const idLookup = new Map();
  for (const cell of doc.querySelectorAll("mxCell")) {
    const sourceId = cell.getAttribute("id");
    const vertex = cell.getAttribute("vertex") === "1";
    const edge = cell.getAttribute("edge") === "1";
    if (vertex) {
      const geometry = cell.querySelector(":scope > mxGeometry") || cell.querySelector("mxGeometry");
      const id = makeId("node"); idLookup.set(sourceId, id);
      nodes.push({
        id,
        label: clean(cell.getAttribute("value") || "Untitled node").replace(/<[^>]+>/g, " "),
        x: Number(geometry?.getAttribute("x")) || 120 + (nodes.length % 4) * 240,
        y: Number(geometry?.getAttribute("y")) || 140 + Math.floor(nodes.length / 4) * 150,
        w: Number(geometry?.getAttribute("width")) || 196,
        h: Number(geometry?.getAttribute("height")) || 88,
        fixedSize: true,
      });
    } else if (edge) {
      edges.push({ sourceRaw: cell.getAttribute("source"), targetRaw: cell.getAttribute("target"), label: clean(cell.getAttribute("value") || "") });
    }
  }
  if (!nodes.length) {
    const compressed = doc.querySelector("diagram")?.textContent?.trim();
    if (compressed) throw new Error("This draw.io file uses a compressed payload. Re-save it with compression disabled, or let an AI agent run the bundled full importer.");
    throw new Error("No draw.io vertices were found.");
  }
  diagram.nodes = nodes.slice(0, 100);
  diagram.edges = edges.slice(0, 180).map((item) => ({ id: makeId("edge"), source: idLookup.get(item.sourceRaw), target: idLookup.get(item.targetRaw), label: item.label, dashed: false })).filter((item) => item.source && item.target);
  return diagram;
}

export function parseProject(source) {
  const parsed = JSON.parse(source);
  if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) throw new Error("This is not a Diagram Studio project.");
  return parsed;
}

export async function extractBrandFromURL(url) {
  const target = new URL(url.startsWith("http") ? url : `https://${url}`);
  try {
    const response = await fetch(target.href, { mode: "cors" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return extractBrandFromHTML(await response.text(), target.hostname);
  } catch {
    return seededBrand(target.hostname);
  }
}

export function extractBrandFromHTML(html, name = "Imported brand") {
  const colors = [...html.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase());
  const unique = [...new Set(colors)].filter((color) => !["#ffffff", "#000000"].includes(color));
  const font = html.match(/font-family\s*:\s*([^;}]+)/i)?.[1]?.split(",")[0].replace(/["']/g, "").trim();
  return completeTheme({
    name,
    paper: colors.includes("#ffffff") ? "#ffffff" : "#f5f3ee",
    panel: "#ffffff",
    ink: colors.includes("#000000") ? "#000000" : "#17201d",
    muted: "#68736e",
    accent: unique[0] || "#c2452a",
    accent2: unique[1] || "#174f46",
    line: "#b8bdb9",
    font: font || "Inter, system-ui, sans-serif",
    source: "html",
  });
}

export function seededBrand(seed) {
  let hash = 0;
  for (const char of seed) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return completeTheme({
    name: seed,
    paper: `hsl(${hue} 22% 96%)`,
    panel: "#ffffff",
    ink: `hsl(${hue} 32% 16%)`,
    muted: `hsl(${hue} 10% 38%)`,
    accent: `hsl(${hue} 62% 38%)`,
    accent2: `hsl(${(hue + 145) % 360} 52% 32%)`,
    line: `hsl(${hue} 14% 74%)`,
    lineStrong: `hsl(${hue} 24% 28%)`,
    source: "domain-derived",
  });
}
