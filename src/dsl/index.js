/**
 * The `.ds` diagram language.
 *
 * A project is JSON, which is fine for machines and miserable in a pull request.
 * This is the same model in a form a person can write and a reviewer can read a
 * diff of. Parsing and serialising are exact inverses for everything the grammar
 * covers, so the canvas and the text stay in step.
 *
 *   architecture "Checkout platform"
 *   theme cobalt
 *   direction LR
 *
 *   group "Perimeter" {
 *     customer: actor "Customer"        #user
 *     web "Web app" / "Browser client"  #browser
 *   }
 *   gateway "API gateway" *
 *   orders "Orders service"
 *   store: store "Order store"
 *
 *   customer -> web
 *   web -> gateway
 *   orders -> store "read/write"
 *   orders ~> payments "charge"         // ~> is a dashed connection
 */

import { LIMITS, createDiagram, hasType, makeId } from "../model.js";
import { PALETTES, paletteOf } from "../theme/palettes.js";
import { ROLE_SHAPE } from "../render/shapes.js";
import { MOTIONS, STYLES } from "../render/skin.js";
import { AUDIENCES, PRESET_IDS } from "../render/presets.js";

const ROLES = new Set(Object.keys(ROLE_SHAPE));
const ARROWS = [
  { token: "<->", apply: (edge) => (edge.bidirectional = true) },
  { token: "~>", apply: (edge) => (edge.dashed = true) },
  { token: "=>", apply: (edge) => (edge.tone = "accent") },
  { token: "-->", apply: () => {} },
  { token: "->", apply: () => {} },
];

const quoted = /"((?:[^"\\]|\\.)*)"/g;
const unescape = (value) => value.replace(/\\(.)/g, "$1");
const escape = (value) => String(value ?? "").replace(/(["\\])/g, "\\$1");

class ParseError extends Error {
  constructor(message, line) {
    super(`line ${line}: ${message}`);
    this.line = line;
  }
}

/** Strip a trailing `// comment` that is not inside a quoted string. */
function stripComment(line) {
  let inQuote = false;
  for (let i = 0; i < line.length - 1; i++) {
    const char = line[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') inQuote = !inQuote;
    else if (!inQuote && char === "/" && line[i + 1] === "/") return line.slice(0, i);
  }
  return line;
}

const strings = (line) => [...line.matchAll(quoted)].map((match) => unescape(match[1]));

/**
 * Parse a node declaration.
 * `key[: role] "Label"[ / "Sublabel"][ *][ #icon][ =value]`
 */
function parseNode(line, lineNumber) {
  const labels = strings(line);
  if (!labels.length) return null;

  const head = line.slice(0, line.indexOf('"')).trim();
  const [rawKey, rawRole] = head.split(":").map((part) => part.trim());
  const key = rawKey || labels[0].toLowerCase().replace(/\s+/g, "-");
  if (rawRole && !ROLES.has(rawRole)) throw new ParseError(`unknown role "${rawRole}"`, lineNumber);

  const tail = line.slice(line.lastIndexOf('"') + 1);
  const icon = tail.match(/#([\w-]+)/)?.[1];
  const value = tail.match(/=(-?[\d.]+)/)?.[1];
  const accent = /\*/.test(tail);

  return {
    key,
    node: {
      label: labels[0],
      ...(labels[1] ? { sublabel: labels[1] } : {}),
      ...(rawRole ? { role: rawRole } : {}),
      ...(icon ? { icon } : {}),
      ...(value !== undefined ? { value: Number(value) } : {}),
      ...(accent ? { tone: "accent" } : {}),
    },
  };
}

/** Parse an edge declaration: `a -> b "label"`. */
function parseEdge(line) {
  for (const arrow of ARROWS) {
    const index = line.indexOf(arrow.token);
    if (index === -1) continue;
    const left = line.slice(0, index).trim();
    const rest = line.slice(index + arrow.token.length);
    const right = rest.replace(quoted, "").trim();
    if (!left || !right) continue;
    const edge = { label: strings(rest)[0] ?? "" };
    arrow.apply(edge);
    return { from: left, to: right, edge };
  }
  return null;
}

/**
 * @param {string} source
 * @returns {object} a project
 */
export function parse(source) {
  const lines = String(source).split(/\r?\n/);
  let diagram = null;
  const keys = new Map();
  const pendingEdges = [];
  const groups = [];
  let openGroup = null;

  const ensure = (lineNumber) => {
    if (!diagram) throw new ParseError("the first statement must be a diagram type", lineNumber);
    return diagram;
  };

  const nodeFor = (key, lineNumber) => {
    if (keys.has(key)) return keys.get(key);
    // Referencing an undeclared key creates it, so a quick sketch does not need
    // every node written out first.
    if (diagram.nodes.length >= LIMITS.nodes) throw new ParseError("node limit reached", lineNumber);
    const id = makeId("node");
    keys.set(key, id);
    diagram.nodes.push({ id, label: key, x: 0, y: 0, w: 0, h: 0 });
    return id;
  };

  lines.forEach((raw, index) => {
    const lineNumber = index + 1;
    const line = stripComment(raw).trim();
    if (!line) return;

    if (line === "}") {
      if (!openGroup) throw new ParseError("unexpected }", lineNumber);
      groups.push(openGroup);
      openGroup = null;
      return;
    }

    const groupOpen = line.match(/^group\s+"((?:[^"\\]|\\.)*)"\s*\{$/);
    if (groupOpen) {
      if (openGroup) throw new ParseError("groups cannot nest", lineNumber);
      ensure(lineNumber);
      openGroup = { id: makeId("group"), label: unescape(groupOpen[1]), nodes: [] };
      return;
    }

    const [word, ...rest] = line.split(/\s+/);

    if (!diagram) {
      if (!hasType(word)) throw new ParseError(`unknown diagram type "${word}"`, lineNumber);
      diagram = createDiagram(word, strings(line)[0], { empty: true });
      return;
    }

    if (word === "theme") {
      const id = rest[0];
      if (!PALETTES[id]) throw new ParseError(`unknown theme "${id}"`, lineNumber);
      diagram.theme = paletteOf(id);
      return;
    }
    if (word === "direction") {
      diagram.settings.direction = rest[0]?.toUpperCase() === "TD" ? "TB" : rest[0]?.toUpperCase();
      return;
    }
    if (word === "style") {
      if (!STYLES.includes(rest[0])) throw new ParseError(`unknown style "${rest[0]}". Use ${STYLES.join(", ")}.`, lineNumber);
      diagram.settings.style = rest[0];
      return;
    }
    if (word === "motion") {
      if (!MOTIONS.includes(rest[0])) throw new ParseError(`unknown motion "${rest[0]}". Use ${MOTIONS.filter(Boolean).join(", ")}.`, lineNumber);
      diagram.settings.motion = rest[0];
      return;
    }
    if (word === "preset") {
      if (!PRESET_IDS.includes(rest[0])) throw new ParseError(`unknown preset "${rest[0]}". Use ${PRESET_IDS.join(", ")}.`, lineNumber);
      diagram.settings.preset = rest[0];
      return;
    }
    if (word === "audience") {
      if (!AUDIENCES.includes(rest[0])) throw new ParseError(`unknown audience "${rest[0]}". Use ${AUDIENCES.join(", ")}.`, lineNumber);
      diagram.settings.audience = rest[0];
      return;
    }
    if (word === "describe") {
      diagram.description = strings(line)[0] ?? "";
      return;
    }
    if (word === "unit") {
      diagram.unit = strings(line)[0] ?? rest.join(" ");
      return;
    }
    if (word === "axis") {
      const axis = rest[0];
      const values = strings(line);
      if (axis !== "x" && axis !== "y") throw new ParseError('axis must be "x" or "y"', lineNumber);
      diagram.axes = { ...(diagram.axes ?? {}), [axis]: { label: values[0] ?? "", low: values[1] ?? "", high: values[2] ?? "" } };
      return;
    }
    if (word === "hub") {
      diagram.hub = { label: strings(line)[0] ?? "", ...(strings(line)[1] ? { sublabel: strings(line)[1] } : {}) };
      return;
    }

    const edge = parseEdge(line);
    if (edge) {
      if (diagram.edges.length >= LIMITS.edges) throw new ParseError("connection limit reached", lineNumber);
      pendingEdges.push({ ...edge, lineNumber });
      return;
    }

    // Inside a group, a line of bare keys adds already-declared nodes to it.
    // Membership is expressed separately from declaration so the node order in
    // the file stays the model's order.
    if (openGroup && !line.includes('"') && /^[\w.@-]+(\s+[\w.@-]+)*$/.test(line)) {
      for (const key of line.split(/\s+/)) openGroup.nodes.push(nodeFor(key, lineNumber));
      return;
    }

    const declared = parseNode(line, lineNumber);
    if (!declared) throw new ParseError(`could not read "${line}"`, lineNumber);
    if (keys.has(declared.key)) {
      Object.assign(diagram.nodes.find((node) => node.id === keys.get(declared.key)), declared.node);
    } else {
      const id = makeId("node");
      keys.set(declared.key, id);
      diagram.nodes.push({ id, x: 0, y: 0, w: 0, h: 0, ...declared.node });
    }
    if (openGroup) openGroup.nodes.push(keys.get(declared.key));
  });

  if (!diagram) throw new ParseError("the source is empty", 1);
  if (openGroup) throw new ParseError("unclosed group", lines.length);

  for (const pending of pendingEdges) {
    diagram.edges.push({
      id: makeId("edge"),
      source: nodeFor(pending.from, pending.lineNumber),
      target: nodeFor(pending.to, pending.lineNumber),
      dashed: false,
      ...pending.edge,
    });
  }
  if (groups.length) diagram.groups = groups.filter((group) => group.nodes.length);

  return diagram;
}

/** Short, stable, human-readable keys derived from labels. */
function keyMap(diagram) {
  const used = new Set();
  const keys = new Map();
  for (const node of diagram.nodes) {
    let base = String(node.label ?? "node")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "node";
    let candidate = base;
    let counter = 2;
    while (used.has(candidate)) candidate = `${base}-${counter++}`;
    used.add(candidate);
    keys.set(node.id, candidate);
  }
  return keys;
}

const paletteIdFor = (theme) => Object.keys(PALETTES).find((id) => PALETTES[id].accent === theme?.accent && PALETTES[id].paper === theme?.paper);

/**
 * Serialise a project back to `.ds`.
 *
 * @param {object} diagram
 * @returns {string}
 */
export function stringify(diagram) {
  const keys = keyMap(diagram);
  const lines = [`${diagram.type} "${escape(diagram.title)}"`];

  const palette = paletteIdFor(diagram.theme);
  if (palette) lines.push(`theme ${palette}`);
  if (diagram.settings?.direction) lines.push(`direction ${diagram.settings.direction}`);
  if (diagram.settings?.style && diagram.settings.style !== "editorial") lines.push(`style ${diagram.settings.style}`);
  if (diagram.settings?.motion) lines.push(`motion ${diagram.settings.motion}`);
  if (diagram.settings?.preset && diagram.settings.preset !== "fit") lines.push(`preset ${diagram.settings.preset}`);
  if (diagram.settings?.audience && diagram.settings.audience !== "mixed") lines.push(`audience ${diagram.settings.audience}`);
  if (diagram.description) lines.push(`describe "${escape(diagram.description)}"`);
  if (diagram.unit) lines.push(`unit "${escape(diagram.unit)}"`);
  for (const axis of ["x", "y"]) {
    const value = diagram.axes?.[axis];
    if (value) lines.push(`axis ${axis} "${escape(value.label ?? "")}" "${escape(value.low ?? "")}" "${escape(value.high ?? "")}"`);
  }
  if (diagram.hub) lines.push(`hub "${escape(diagram.hub.label)}"${diagram.hub.sublabel ? ` "${escape(diagram.hub.sublabel)}"` : ""}`);
  lines.push("");

  const nodeLine = (node) => {
    const key = keys.get(node.id);
    const head = node.role ? `${key}: ${node.role}` : key;
    const labels = node.sublabel ? `"${escape(node.label)}" / "${escape(node.sublabel)}"` : `"${escape(node.label)}"`;
    const flags = [
      node.tone === "accent" ? "*" : "",
      node.icon ? `#${node.icon}` : "",
      typeof node.value === "number" ? `=${node.value}` : "",
    ].filter(Boolean).join(" ");
    return `${head} ${labels}${flags ? ` ${flags}` : ""}`;
  };

  // Nodes in model order, then membership. Declaring inside the group block
  // would reorder the file, and the order of the nodes is part of the model.
  for (const node of diagram.nodes) lines.push(nodeLine(node));

  for (const group of diagram.groups ?? []) {
    const members = group.nodes.map((id) => keys.get(id)).filter(Boolean);
    if (!members.length) continue;
    lines.push("");
    lines.push(`group "${escape(group.label)}" {`);
    lines.push(`  ${members.join(" ")}`);
    lines.push("}");
  }

  if (diagram.edges.length) {
    lines.push("");
    for (const edge of diagram.edges) {
      const source = keys.get(edge.source);
      const target = keys.get(edge.target);
      if (!source || !target) continue;
      const arrow = edge.bidirectional ? "<->" : edge.dashed ? "~>" : edge.tone === "accent" ? "=>" : "->";
      lines.push(`${source} ${arrow} ${target}${edge.label ? ` "${escape(edge.label)}"` : ""}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export { ParseError };
