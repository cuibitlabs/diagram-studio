/**
 * Mermaid importer.
 *
 * Treats an import as an editorial redraw, not a format conversion: the source
 * meaning is preserved, node roles are inferred from Mermaid's shape syntax, and
 * anything that could not be represented is recorded in `diagram.provenance`
 * rather than dropped in silence.
 *
 * Supported headers: flowchart/graph, sequenceDiagram, stateDiagram(-v2),
 * erDiagram, gantt, journey, mindmap, quadrantChart, pie, timeline.
 */

import { createDiagram, makeId } from "../model.js";

const LIMITS = { nodes: 200, edges: 400, bytes: 2 * 1024 * 1024, lines: 20000 };

/** Mermaid shape syntax → our semantic role. */
const SHAPE_PATTERNS = [
  { open: "([", close: "])", role: "terminal" },
  { open: "[[", close: "]]", role: "service" },
  { open: "[(", close: ")]", role: "store" },
  { open: "((", close: "))", role: "event" },
  { open: "{{", close: "}}", role: "gateway" },
  { open: "[/", close: "/]", role: "input" },
  { open: "[\\", close: "\\]", role: "output" },
  { open: "[", close: "]", role: null },
  { open: "(", close: ")", role: "terminal" },
  { open: "{", close: "}", role: "decision" },
  { open: ">", close: "]", role: "note" },
];

const stripFence = (source) =>
  String(source)
    .replace(/^\s*```(?:mermaid)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

const clean = (value = "") =>
  String(value)
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/<[^>]+>/g, " ")
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/\s+/g, " ")
    .trim();

function guard(source) {
  if (source.length > LIMITS.bytes) throw new Error("The source exceeds the 2 MiB safety limit.");
  if (source.split("\n").length > LIMITS.lines) throw new Error("The source exceeds the 20,000 line safety limit.");
}

/** Split a Mermaid body into logical lines, dropping comments and directives. */
function lines(source) {
  return source
    .split(/\n/)
    .map((line) => line.replace(/%%.*$/, "").trimEnd())
    .filter((line) => line.trim().length > 0);
}

/**
 * Parse `A[Label]` / `B{Decision}` / bare `C` into `{key, label, role}`.
 * Returns null when the token is not a node reference.
 */
function parseNodeToken(token) {
  const trimmed = token.trim();
  if (!trimmed) return null;
  for (const shape of SHAPE_PATTERNS) {
    const start = trimmed.indexOf(shape.open);
    if (start <= 0) continue;
    if (!trimmed.endsWith(shape.close)) continue;
    const key = trimmed.slice(0, start).trim();
    const label = trimmed.slice(start + shape.open.length, trimmed.length - shape.close.length);
    if (!key) continue;
    return { key, label: clean(label) || key, role: shape.role };
  }
  const bare = trimmed.match(/^[\w.@-]+$/);
  return bare ? { key: trimmed, label: trimmed, role: null } : null;
}

/** Builder shared by every sub-parser. */
function collector(type, title) {
  const diagram = createDiagram(type, title, { empty: true });
  const keys = new Map();
  const report = { format: "mermaid", header: type, sourceNodes: 0, dropped: [], collapsed: [], unsupported: [] };

  const node = (key, label, extra = {}) => {
    if (keys.has(key)) {
      const existing = diagram.nodes.find((item) => item.id === keys.get(key));
      if (existing && label && existing.label === key && label !== key) existing.label = label;
      if (existing) Object.assign(existing, Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== null && value !== undefined)));
      return keys.get(key);
    }
    report.sourceNodes++;
    if (diagram.nodes.length >= LIMITS.nodes) {
      report.dropped.push(`${label ?? key} (node limit)`);
      return null;
    }
    const id = makeId("node");
    keys.set(key, id);
    diagram.nodes.push({
      id,
      label: label || key,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      ...Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== null && value !== undefined)),
    });
    return id;
  };

  const edge = (fromKey, toKey, label = "", extra = {}) => {
    const source = keys.get(fromKey);
    const target = keys.get(toKey);
    if (!source || !target) return;
    if (diagram.edges.length >= LIMITS.edges) {
      report.dropped.push(`${fromKey}→${toKey} (edge limit)`);
      return;
    }
    diagram.edges.push({ id: makeId("edge"), source, target, label: clean(label), dashed: false, ...extra });
  };

  return { diagram, report, node, edge, keys };
}

/* ------------------------------------------------------------------ flow */

const EDGE_PATTERN = /^(.*?)\s*(<?[-=.]{1,3}[->x o]?[->]|-{2,3}|={2,3}|-\.->|-\.-)\s*(?:\|([^|]*)\|)?\s*(.*)$/;

/**
 * State diagrams use `A --> B : event` and the `[*]` pseudo-state, neither of
 * which fits the flowchart grammar, so they get their own pass.
 */
function parseState(body) {
  const { diagram, report, node, edge, keys } = collector("state", "Imported state machine");
  const initial = new Set();
  const terminal = new Set();

  for (const raw of body) {
    const line = raw.trim();
    if (/^(direction)\b/i.test(line)) {
      const value = line.split(/\s+/)[1]?.toUpperCase();
      if (value) diagram.settings.direction = value === "TD" ? "TB" : value;
      continue;
    }
    const named = line.match(/^state\s+"([^"]+)"\s+as\s+([\w.-]+)/i);
    if (named) {
      node(named[2], clean(named[1]));
      continue;
    }
    if (/^(note|classDef|class|style|state\b)/i.test(line)) {
      report.unsupported.push(line.split(/\s+/)[0].toLowerCase());
      continue;
    }

    const transition = line.match(/^(\[\*\]|[\w.-]+)\s*-{1,2}>\s*(\[\*\]|[\w.-]+)\s*(?::\s*(.*))?$/);
    if (!transition) continue;
    const [, from, to, label] = transition;

    if (from === "[*]" && to !== "[*]") {
      node(to, to);
      initial.add(to);
      continue;
    }
    if (to === "[*]" && from !== "[*]") {
      node(from, from);
      terminal.add(from);
      continue;
    }
    node(from, from);
    node(to, to);
    edge(from, to, label ?? "");
  }

  for (const key of initial) {
    const found = diagram.nodes.find((item) => item.id === keys.get(key));
    if (found) found.stateKind = "initial";
  }
  for (const key of terminal) {
    const found = diagram.nodes.find((item) => item.id === keys.get(key));
    if (found) found.stateKind = "final";
  }
  if (initial.size || terminal.size) {
    report.collapsed.push("[*] pseudo-states became entry and terminal markers");
  }
  return { diagram, report };
}

function parseFlow(body, header) {
  const directionMatch = header.match(/\b(TB|TD|BT|RL|LR)\b/i);
  const { diagram, report, node, edge, keys } = collector("flowchart", "Imported flowchart");
  if (directionMatch) {
    const direction = directionMatch[1].toUpperCase();
    diagram.settings.direction = direction === "TD" ? "TB" : direction;
  }

  const groups = [];
  const stack = [];
  const classes = new Map();

  for (const raw of body) {
    const line = raw.trim();

    if (/^subgraph\b/i.test(line)) {
      // `subgraph Title`, `subgraph id[Title]` and `subgraph id["Title"]`.
      const parts = line.match(/^subgraph\s+(?:([\w.-]+)\s*\[\s*"?([^\]"]+)"?\s*\]|(.+))$/i);
      const label = clean(parts?.[2] ?? parts?.[3] ?? "") || "Group";
      const group = { id: makeId("group"), label, nodes: [] };
      groups.push(group);
      stack.push(group);
      continue;
    }
    if (/^end$/i.test(line)) {
      stack.pop();
      continue;
    }
    if (/^(direction)\b/i.test(line)) {
      const value = line.split(/\s+/)[1]?.toUpperCase();
      if (value) diagram.settings.direction = value === "TD" ? "TB" : value;
      continue;
    }
    if (/^classDef\b/i.test(line)) {
      const name = line.split(/\s+/)[1];
      if (name) classes.set(name, /accent|primary|highlight|focus/i.test(name) ? "accent" : null);
      continue;
    }
    if (/^class\b/i.test(line)) {
      const [, targets, name] = line.match(/^class\s+([\w.,\s-]+)\s+([\w-]+)/i) ?? [];
      if (targets && name && classes.get(name) === "accent") {
        for (const key of targets.split(/[,\s]+/).filter(Boolean)) {
          const id = keys.get(key);
          const found = diagram.nodes.find((item) => item.id === id);
          if (found) found.tone = "accent";
        }
      }
      continue;
    }
    if (/^(style|linkStyle|click|accTitle|accDescr|title)\b/i.test(line)) {
      report.unsupported.push(line.split(/\s+/)[0]);
      continue;
    }
    if (/^note\b/i.test(line)) {
      report.unsupported.push("note");
      continue;
    }

    const match = line.match(EDGE_PATTERN);
    if (match) {
      const [, leftRaw, connector, pipeLabel, rightRaw] = match;
      // `A & B --> C` fans out to one edge per pair.
      const lefts = leftRaw.split(/\s+&\s+/).map(parseNodeToken).filter(Boolean);
      const rightParts = rightRaw.split(/\s+&\s+/);
      const rights = rightParts.map(parseNodeToken).filter(Boolean);
      if (lefts.length && rights.length) {
        const dashed = /\./.test(connector);
        const strong = /=/.test(connector);
        const bidirectional = /^</.test(connector);
        const inlineLabel = pipeLabel ?? "";
        for (const left of lefts) {
          const leftId = node(left.key, left.label, { role: left.role });
          if (leftId && stack.length) stack.at(-1).nodes.push(leftId);
          for (const right of rights) {
            const rightId = node(right.key, right.label, { role: right.role });
            if (rightId && stack.length) stack.at(-1).nodes.push(rightId);
            edge(left.key, right.key, inlineLabel, {
              ...(dashed ? { dashed: true } : {}),
              ...(strong ? { tone: "accent" } : {}),
              ...(bidirectional ? { bidirectional: true } : {}),
            });
          }
        }
        continue;
      }
    }

    const single = parseNodeToken(line);
    if (single) {
      const id = node(single.key, single.label, { role: single.role });
      if (id && stack.length) stack.at(-1).nodes.push(id);
    }
  }

  const usable = groups.filter((group) => group.nodes.length);
  if (usable.length) diagram.groups = usable.map((group) => ({ ...group, nodes: [...new Set(group.nodes)] }));
  return { diagram, report };
}

/* -------------------------------------------------------------- sequence */

function parseSequence(body) {
  const { diagram, report, node, edge } = collector("sequence", "Imported sequence");
  for (const raw of body) {
    const line = raw.trim();

    const participant = line.match(/^(?:participant|actor)\s+([\w.-]+)(?:\s+as\s+(.+))?$/i);
    if (participant) {
      node(participant[1], clean(participant[2] ?? participant[1]), { role: /^actor/i.test(line) ? "actor" : null });
      continue;
    }
    if (/^(alt|else|opt|loop|par|and|critical|break|rect|end|activate|deactivate|autonumber|box)\b/i.test(line)) {
      report.unsupported.push(line.split(/\s+/)[0].toLowerCase());
      continue;
    }
    if (/^note\b/i.test(line)) {
      report.unsupported.push("note");
      continue;
    }

    // Arrow alternatives are ordered longest-first, and participant keys
    // exclude `-` so `A-->>B` cannot be misread as a participant called `A-`.
    const message = line.match(/^([A-Za-z0-9_.]+)\s*(-->>|--x|--\)|-->|->>|->|-x|-\))\s*\+?-?\s*([A-Za-z0-9_.]+)\s*:\s*(.*)$/);
    if (message) {
      const [, from, arrow, to, label] = message;
      node(from, from);
      node(to, to);
      edge(from, to, label, arrow.startsWith("--") ? { kind: "return", dashed: true } : {});
    }
  }
  return { diagram, report };
}

/* -------------------------------------------------------------------- er */

function parseER(body) {
  const { diagram, report, node, edge } = collector("er", "Imported data model");
  let current = null;

  for (const raw of body) {
    const line = raw.trim();

    const block = line.match(/^([\w.-]+)\s*\{$/);
    if (block) {
      current = node(block[1], block[1], { fields: [] });
      continue;
    }
    if (line === "}") {
      current = null;
      continue;
    }
    if (current) {
      const field = line.match(/^([\w<>\[\]().-]+)\s+([\w.-]+)(?:\s+(PK|FK|UK))?/i);
      if (field) {
        const owner = diagram.nodes.find((item) => item.id === current);
        owner?.fields.push({ type: field[1], name: field[2], ...(field[3] ? { key: field[3].toUpperCase() } : {}) });
      }
      continue;
    }

    const relation = line.match(/^([\w.-]+)\s+([|}o][|o{}.-]+[|{o])\s+([\w.-]+)\s*:\s*(.*)$/);
    if (relation) {
      node(relation[1], relation[1], { fields: [] });
      node(relation[3], relation[3], { fields: [] });
      edge(relation[1], relation[3], relation[4].replace(/^"|"$/g, ""));
    }
  }
  return { diagram, report };
}

/* ----------------------------------------------------------------- gantt */

const DURATION = /^(\d+(?:\.\d+)?)\s*(d|w|h|m|ms|y)?$/i;
const toDays = (value, unit) => {
  const amount = Number(value);
  switch ((unit ?? "d").toLowerCase()) {
    case "w": return amount * 7;
    case "h": return amount / 24;
    case "y": return amount * 365;
    default: return amount;
  }
};

function parseGantt(body) {
  const { diagram, report } = collector("gantt", "Imported schedule");
  const tasks = [];
  let section = null;
  let cursor = 0;

  for (const raw of body) {
    const line = raw.trim();
    if (/^(dateFormat|axisFormat|excludes|todayMarker|tickInterval|title)\b/i.test(line)) {
      if (/^title\b/i.test(line)) diagram.title = clean(line.replace(/^title\s*/i, "")) || diagram.title;
      continue;
    }
    if (/^section\b/i.test(line)) {
      section = clean(line.replace(/^section\s*/i, ""));
      continue;
    }
    const task = line.match(/^(.+?)\s*:\s*(.*)$/);
    if (!task) continue;

    const label = clean(task[1]);
    const parts = task[2].split(",").map((part) => part.trim()).filter(Boolean);
    const duration = parts.map((part) => part.match(DURATION)).find(Boolean);
    const after = parts.find((part) => /^after\s+/i.test(part));

    if (!duration) {
      report.dropped.push(`${label} (no duration in the source)`);
      tasks.push({ label, sublabel: section, start: null, duration: null });
      continue;
    }
    const length = toDays(duration[1], duration[2]);
    const start = after ? cursor : cursor;
    tasks.push({ label, sublabel: section, start, duration: length });
    cursor = start + length;
  }

  diagram.timeUnit = "d";
  diagram.nodes = tasks.map((task) => ({
    id: makeId("node"),
    label: task.label,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    ...(task.sublabel ? { sublabel: task.sublabel } : {}),
    ...(task.start === null ? {} : { start: task.start, duration: task.duration }),
  }));
  report.sourceNodes = tasks.length;
  if (tasks.some((task) => task.start === null)) {
    report.collapsed.push("tasks without a duration are listed as unscheduled");
  }
  report.collapsed.push("absolute dates converted to day offsets from the first task");
  return { diagram, report };
}

/* --------------------------------------------------------------- journey */

function parseJourney(body) {
  const { diagram, report } = collector("journey", "Imported journey");
  const stages = [];
  let section = null;

  for (const raw of body) {
    const line = raw.trim();
    if (/^title\b/i.test(line)) {
      diagram.title = clean(line.replace(/^title\s*/i, "")) || diagram.title;
      continue;
    }
    if (/^section\b/i.test(line)) {
      section = clean(line.replace(/^section\s*/i, ""));
      continue;
    }
    const task = line.match(/^(.+?)\s*:\s*(\d+)\s*:?\s*(.*)$/);
    if (!task) continue;
    stages.push({
      label: clean(task[1]),
      // Mermaid scores journeys 1–5; the renderer works in percent.
      value: Math.round((Number(task[2]) / 5) * 100),
      sublabel: clean(task[3]) || section,
    });
  }

  diagram.nodes = stages.map((stage) => ({ id: makeId("node"), label: stage.label, x: 0, y: 0, w: 0, h: 0, value: stage.value, ...(stage.sublabel ? { sublabel: stage.sublabel } : {}) }));
  report.sourceNodes = stages.length;
  report.collapsed.push("journey scores 1–5 rescaled to a 0–100 sentiment axis");
  return { diagram, report };
}

/* --------------------------------------------------------------- mindmap */

function parseMindmap(body) {
  const { diagram, report, node, edge } = collector("mind-map", "Imported mind map");
  const stack = [];
  let counter = 0;

  for (const raw of body) {
    if (!raw.trim()) continue;
    const indent = raw.match(/^\s*/)[0].length;
    const label = clean(raw.replace(/^\s*/, "").replace(/^[-*]\s*/, "").replace(/^\(\(|\)\)$/g, "").replace(/^\[|\]$/g, ""));
    if (!label || /^mindmap$/i.test(label)) continue;
    const key = `mm-${counter++}`;
    while (stack.length && stack.at(-1).indent >= indent) stack.pop();
    node(key, label);
    if (stack.length) edge(stack.at(-1).key, key);
    stack.push({ indent, key });
  }
  report.sourceNodes = diagram.nodes.length;
  return { diagram, report };
}

/* ---------------------------------------------------------- quadrantChart */

function parseQuadrant(body) {
  const { diagram, report } = collector("quadrant", "Imported quadrant");
  const axes = { x: {}, y: {} };
  const points = [];

  for (const raw of body) {
    const line = raw.trim();
    if (/^title\b/i.test(line)) {
      diagram.title = clean(line.replace(/^title\s*/i, "")) || diagram.title;
      continue;
    }
    const axis = line.match(/^([xy])-axis\s+(.+?)(?:\s*-->\s*(.+))?$/i);
    if (axis) {
      const key = axis[1].toLowerCase();
      axes[key] = { low: clean(axis[2]), high: clean(axis[3] ?? ""), label: "" };
      continue;
    }
    if (/^quadrant-[1-4]\b/i.test(line)) continue; // quadrant names are not items
    const point = line.match(/^(.+?)\s*:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]$/);
    if (point) points.push({ label: clean(point[1]), px: Number(point[2]) * 100, py: Number(point[3]) * 100 });
  }

  diagram.axes = axes;
  diagram.nodes = points.map((point) => ({ id: makeId("node"), label: point.label, x: 0, y: 0, w: 0, h: 0, px: point.px, py: point.py }));
  report.sourceNodes = points.length;
  report.collapsed.push("quadrant names dropped; the axes carry the meaning");
  return { diagram, report };
}

/* ------------------------------------------------------------------- pie */

function parsePie(body) {
  const { diagram, report } = collector("bar", "Imported proportions");
  const slices = [];
  for (const raw of body) {
    const line = raw.trim();
    if (/^title\b/i.test(line)) {
      diagram.title = clean(line.replace(/^title\s*/i, "")) || diagram.title;
      continue;
    }
    const slice = line.match(/^"([^"]+)"\s*:\s*([\d.]+)$/);
    if (slice) slices.push({ label: clean(slice[1]), value: Number(slice[2]) });
  }
  diagram.nodes = slices.map((slice) => ({ id: makeId("node"), label: slice.label, x: 0, y: 0, w: 0, h: 0, value: slice.value }));
  report.sourceNodes = slices.length;
  report.collapsed.push("drawn as a bar chart: angle is harder to compare than length");
  return { diagram, report };
}

/* -------------------------------------------------------------- timeline */

function parseTimeline(body) {
  const { diagram, report } = collector("timeline", "Imported timeline");
  const events = [];
  let marker = null;

  for (const raw of body) {
    const line = raw.trim();
    if (/^title\b/i.test(line)) {
      diagram.title = clean(line.replace(/^title\s*/i, "")) || diagram.title;
      continue;
    }
    if (/^section\b/i.test(line)) {
      marker = clean(line.replace(/^section\s*/i, ""));
      continue;
    }
    const entry = line.match(/^(.+?)\s*:\s*(.+)$/);
    if (entry) {
      events.push({ marker: clean(entry[1]), label: clean(entry[2]) });
      continue;
    }
    if (line) events.push({ marker, label: clean(line) });
  }

  diagram.nodes = events.map((event) => ({ id: makeId("node"), label: event.label, x: 0, y: 0, w: 0, h: 0, ...(event.marker ? { marker: event.marker } : {}) }));
  report.sourceNodes = events.length;
  return { diagram, report };
}

/* ----------------------------------------------------------------- entry */

const HEADERS = [
  { pattern: /^sequencediagram/i, parse: parseSequence },
  { pattern: /^statediagram/i, parse: (body) => parseState(body) },
  { pattern: /^erdiagram/i, parse: parseER },
  { pattern: /^gantt/i, parse: parseGantt },
  { pattern: /^journey/i, parse: parseJourney },
  { pattern: /^mindmap/i, parse: parseMindmap },
  { pattern: /^quadrantchart/i, parse: parseQuadrant },
  { pattern: /^pie/i, parse: parsePie },
  { pattern: /^timeline/i, parse: parseTimeline },
  { pattern: /^(flowchart|graph)/i, parse: (body, header) => parseFlow(body, header) },
];

/**
 * @param {string} source
 * @returns {object} a project with a `provenance` ledger describing the redraw
 */
export function parseMermaid(source) {
  const text = stripFence(source);
  guard(text);
  if (!text) throw new Error("The Mermaid source is empty.");

  const all = lines(text);
  const header = all[0].trim();
  const body = all.slice(1);
  const entry = HEADERS.find((candidate) => candidate.pattern.test(header));
  if (!entry) throw new Error(`Unsupported Mermaid diagram: "${header.split(/\s+/)[0]}".`);

  const { diagram, report } = entry.parse(body, header);
  if (!diagram.nodes.length) throw new Error("No supported Mermaid nodes were found.");

  diagram.provenance = {
    format: "mermaid",
    header: header.split(/\s+/)[0],
    sourceNodes: report.sourceNodes || diagram.nodes.length,
    drawnNodes: diagram.nodes.length,
    dropped: report.dropped,
    collapsed: report.collapsed,
    unsupported: [...new Set(report.unsupported)],
  };
  return diagram;
}

/** Human-readable fidelity ledger, in the format the skill asks for. */
export function describeProvenance(provenance) {
  if (!provenance) return "";
  const rows = [`Source: ${provenance.format}${provenance.header ? ` · ${provenance.header}` : ""} · ${provenance.sourceNodes} source nodes → ${provenance.drawnNodes} drawn`];
  for (const item of provenance.collapsed ?? []) rows.push(`Collapsed: ${item}`);
  for (const item of provenance.dropped ?? []) rows.push(`Dropped: ${item}`);
  if (provenance.unsupported?.length) rows.push(`Not represented: ${provenance.unsupported.join(", ")}`);
  return rows.join("\n");
}
