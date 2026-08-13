#!/usr/bin/env node
/**
 * Diagram Studio MCP server.
 *
 * Exposes the engine over the Model Context Protocol so any agent can compose,
 * import, render and audit diagrams without shelling out or reimplementing the
 * layout rules. Speaks JSON-RPC 2.0 over newline-delimited stdio and has no
 * dependencies.
 *
 * Register it with, for example:
 *   claude mcp add diagram-studio -- node /path/to/bin/mcp-server.mjs
 */

import { createInterface } from "node:readline";

import { DIAGRAM_TYPES, createDiagram, createFromPrompt, hasType, reviewDiagram, validateDiagram } from "../src/model.js";
import { buildSVG } from "../src/render/svg.js";
import { parseMermaid, describeProvenance } from "../src/import/mermaid.js";
import { parseDrawio } from "../src/import/drawio.js";
import { toMermaid } from "../src/export/mermaid.js";
import { toDrawio } from "../src/export/drawio.js";
import { PALETTES, paletteOf } from "../src/theme/palettes.js";
import { auditTheme } from "../src/theme/contrast.js";
import { extractBrand, describeBrandReport } from "../src/theme/brand.js";

/** Revisions this server speaks. The newest is the default. */
const SUPPORTED_PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const PROTOCOL_VERSION = SUPPORTED_PROTOCOLS[0];
const SERVER = { name: "diagram-studio", version: "0.1.0" };

const INSTRUCTIONS =
  "Choose the diagram type by the relationship being shown, not by habit — call list_diagram_types first. " +
  "Keep to nine nodes and two accent elements; split into an overview plus detail beyond that. " +
  "Never invent a value: a chart with a missing number shows a gap, not a zero. " +
  "Every import returns a fidelity ledger — pass it on rather than presenting a redraw as a faithful copy.";

const text = (value) => ({ content: [{ type: "text", text: value }] });
const json = (value) => text(JSON.stringify(value, null, 2));

const themed = (diagram, theme) => {
  if (theme && PALETTES[theme]) diagram.theme = paletteOf(theme);
  return diagram;
};

function renderAs(diagram, format = "svg") {
  switch (format) {
    case "mermaid": return toMermaid(diagram).text;
    case "drawio": return toDrawio(diagram);
    case "project": return JSON.stringify(diagram, null, 2);
    default: return buildSVG(diagram, { interactive: false, showTitle: format === "svg-titled" });
  }
}

const FORMAT_ENUM = ["svg", "svg-titled", "mermaid", "drawio", "project"];

const TOOLS = [
  {
    name: "list_diagram_types",
    description: "List every diagram type the studio can draw, with the communication job each one does. Call this before choosing a type.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_diagram",
    description:
      "Create a diagram. Give either a type id (see list_diagram_types) or a prompt describing the system, and the studio picks the structure, sizes every node from its text and routes the connectors.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", description: "Diagram type id. Omit when using prompt." },
        prompt: { type: "string", description: "A description; the type is inferred and named elements are used verbatim." },
        title: { type: "string" },
        theme: { type: "string", enum: Object.keys(PALETTES) },
        format: { type: "string", enum: FORMAT_ENUM, default: "svg" },
      },
    },
  },
  {
    name: "import_diagram",
    description:
      "Import Mermaid or draw.io source and redraw it in the editorial system. Returns the result plus a fidelity ledger stating what was collapsed, dropped or not representable.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "Raw Mermaid text or draw.io XML (compressed payloads are handled)." },
        theme: { type: "string", enum: Object.keys(PALETTES) },
        format: { type: "string", enum: FORMAT_ENUM, default: "svg" },
      },
      required: ["source"],
    },
  },
  {
    name: "render_diagram",
    description: "Render a saved .diagram.json project into SVG, Mermaid, draw.io or normalised project JSON.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "object", description: "A Diagram Studio project object." },
        theme: { type: "string", enum: Object.keys(PALETTES) },
        format: { type: "string", enum: FORMAT_ENUM, default: "svg" },
      },
      required: ["project"],
    },
  },
  {
    name: "audit_diagram",
    description:
      "Check a project against the accessibility and composition rules: WCAG contrast for every text pair, the accent and complexity budgets, and unconnected elements.",
    inputSchema: { type: "object", properties: { project: { type: "object" } }, required: ["project"] },
  },
  {
    name: "extract_brand",
    description:
      "Turn a site's HTML or CSS into a diagram theme. Colours are classified by role rather than document order, and anything failing contrast is repaired and reported.",
    inputSchema: {
      type: "object",
      properties: { source: { type: "string", description: "HTML or CSS text." }, name: { type: "string" } },
      required: ["source"],
    },
  },
];

const handlers = {
  list_diagram_types: () => json(DIAGRAM_TYPES),

  create_diagram(args = {}) {
    const diagram = args.prompt
      ? createFromPrompt(String(args.prompt))
      : createDiagram(hasType(args.type) ? args.type : "architecture", args.title);
    if (args.title) diagram.title = String(args.title);
    themed(diagram, args.theme);
    return text(renderAs(diagram, args.format));
  },

  async import_diagram(args = {}) {
    const source = String(args.source ?? "");
    const diagram = /^\s*</.test(source) ? await parseDrawio(source) : parseMermaid(source);
    themed(diagram, args.theme);
    const rendered = renderAs(diagram, args.format);
    return text(`${rendered}\n\n<!-- ${describeProvenance(diagram.provenance).replace(/\n/g, "\n     ")} -->`);
  },

  render_diagram(args = {}) {
    const project = args.project;
    const errors = validateDiagram(project);
    if (errors.length) throw new Error(`invalid project: ${errors.join("; ")}`);
    themed(project, args.theme);
    return text(renderAs(project, args.format));
  },

  audit_diagram(args = {}) {
    const project = args.project;
    const errors = validateDiagram(project);
    if (errors.length) throw new Error(`invalid project: ${errors.join("; ")}`);
    buildSVG(project, { interactive: false });
    return json({
      title: project.title,
      type: project.type,
      size: { width: project.width, height: project.height },
      contrast: auditTheme(project.theme),
      composition: reviewDiagram(project),
      provenance: project.provenance ?? null,
    });
  },

  extract_brand(args = {}) {
    const { theme, report } = extractBrand(String(args.source ?? ""), args.name ?? "Imported brand");
    return json({ theme, summary: describeBrandReport(report), report });
  },
};

/* ------------------------------------------------------------- transport */

const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
const reply = (id, result) => send({ jsonrpc: "2.0", id, result });
const failWith = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

async function handle(request) {
  const { id, method, params } = request;

  if (method === "initialize") {
    // Echo the client's protocol revision when it is one we understand, rather
    // than always answering with ours. A client that asked for a later revision
    // and is told a much older one may refuse to continue.
    const asked = params?.protocolVersion;
    const agreed = SUPPORTED_PROTOCOLS.includes(asked) ? asked : PROTOCOL_VERSION;
    return reply(id, {
      protocolVersion: agreed,
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER,
      instructions: INSTRUCTIONS,
    });
  }

  // Notifications carry no id and must never be answered.
  if (typeof method === "string" && method.startsWith("notifications/")) return;
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") return reply(id, { tools: TOOLS });

  // Not advertised, but answered anyway: several clients probe for these on
  // connect, and an error reply shows up in their logs as a broken server.
  if (method === "resources/list") return reply(id, { resources: [] });
  if (method === "resources/templates/list") return reply(id, { resourceTemplates: [] });
  if (method === "prompts/list") return reply(id, { prompts: [] });
  if (method === "logging/setLevel") return reply(id, {});
  if (method === "completion/complete") return reply(id, { completion: { values: [], hasMore: false } });

  if (method === "tools/call") {
    const handler = handlers[params?.name];
    if (!handler) return failWith(id, -32602, `unknown tool: ${params?.name}`);
    try {
      const result = await handler(params.arguments ?? {});
      return reply(id, result);
    } catch (error) {
      // Tool errors are reported in-band so the model can recover.
      return reply(id, { ...text(`error: ${error.message}`), isError: true });
    }
  }

  if (id !== undefined && id !== null) failWith(id, -32601, `method not found: ${method}`);
}

/** One line in, zero or more lines out. Batches are answered as a batch. */
async function dispatch(payload) {
  if (Array.isArray(payload)) {
    for (const entry of payload) await handle(entry).catch((error) => failWith(entry?.id ?? null, -32603, error.message));
    return;
  }
  await handle(payload);
}

const input = createInterface({ input: process.stdin });

input.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let payload;
  try {
    payload = JSON.parse(trimmed);
  } catch {
    return failWith(null, -32700, "parse error");
  }
  dispatch(payload).catch((error) => failWith(payload?.id ?? null, -32603, error.message));
});

// The client closing stdin is how a well-behaved shutdown arrives.
input.on("close", () => process.exit(0));

/**
 * stdout carries the protocol and nothing else. An uncaught error printed there
 * would corrupt the stream and take the whole session down, so diagnostics go
 * to stderr, which every client treats as log output.
 */
process.on("uncaughtException", (error) => {
  process.stderr.write(`diagram-studio: ${error?.stack ?? error}\n`);
});
process.on("unhandledRejection", (error) => {
  process.stderr.write(`diagram-studio: ${error?.stack ?? error}\n`);
});
