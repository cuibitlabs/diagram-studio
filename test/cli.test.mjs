import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../bin/diagram-studio.mjs", import.meta.url));
const MCP = fileURLToPath(new URL("../bin/mcp-server.mjs", import.meta.url));

function run(script, args, input) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    if (input !== undefined) child.stdin.write(input);
    child.stdin.end();
  });
}

const workspace = () => mkdtemp(join(tmpdir(), "ds-cli-"));

test("cli lists every type", async () => {
  const { code, stdout } = await run(CLI, ["types"]);
  assert.equal(code, 0);
  assert.equal(stdout.trim().split("\n").length, 31);
  assert.match(stdout, /architecture/);
});

test("cli creates a diagram and the SVG matches the engine", async () => {
  const dir = await workspace();
  const out = join(dir, "a.svg");
  const { code } = await run(CLI, ["create", "flowchart", "--theme", "cobalt", "-o", out]);
  assert.equal(code, 0);

  const svg = await readFile(out, "utf8");
  const { buildSVG } = await import("../src/render/svg.js");
  const { createDiagram } = await import("../src/model.js");
  const { paletteOf } = await import("../src/theme/palettes.js");
  const expected = createDiagram("flowchart");
  expected.theme = paletteOf("cobalt");
  // Same engine, same geometry: only the generated ids differ.
  const strip = (value) => value.replace(/id="[^"]*"|url\(#[^)]*\)|aria-labelledby="[^"]*"|data-(node|edge)-id="[^"]*"/g, "");
  assert.equal(strip(svg), strip(buildSVG(expected, { interactive: false })));
});

test("cli imports mermaid and prints the fidelity ledger", async () => {
  const dir = await workspace();
  const source = join(dir, "in.mmd");
  await writeFile(source, "flowchart LR\n A[One] --> B[Two]\n B --> C[Three]", "utf8");
  const { code, stdout } = await run(CLI, ["import", source, "-o", join(dir, "out.svg")]);
  assert.equal(code, 0);
  assert.match(stdout, /3 source nodes → 3 drawn/);
});

test("cli converts between formats by extension", async () => {
  const dir = await workspace();
  const source = join(dir, "in.mmd");
  await writeFile(source, "flowchart LR\n A[One] --> B[Two]", "utf8");
  const out = join(dir, "out.drawio");
  const { code } = await run(CLI, ["convert", source, out]);
  assert.equal(code, 0);
  assert.match(await readFile(out, "utf8"), /^<mxfile/);
});

test("cli batch converts a folder and can emit variants", async () => {
  const dir = await workspace();
  const sources = join(dir, "src");
  const out = join(dir, "out");
  await mkdtemp(sources).catch(() => {});
  const { mkdir } = await import("node:fs/promises");
  await mkdir(sources, { recursive: true });
  await writeFile(join(sources, "one.mmd"), "flowchart LR\n A --> B", "utf8");
  await writeFile(join(sources, "two.mmd"), "flowchart LR\n C --> D", "utf8");

  const { code, stdout } = await run(CLI, ["batch", sources, "--out", out, "--variants"]);
  assert.equal(code, 0);
  assert.match(stdout, /2\/2 sources converted/);
  const written = await readdir(out);
  assert.deepEqual(written.sort(), ["one-dark.svg", "one-light.svg", "two-dark.svg", "two-light.svg"]);
});

test("cli validate rejects a broken project", async () => {
  const dir = await workspace();
  const broken = join(dir, "broken.json");
  await writeFile(broken, JSON.stringify({ type: "nope", nodes: [], edges: [], theme: {} }), "utf8");
  const { code, stderr } = await run(CLI, ["validate", broken]);
  assert.equal(code, 1);
  assert.match(stderr, /Unknown diagram type/);
});

test("cli audit reports contrast and composition", async () => {
  const dir = await workspace();
  const project = join(dir, "p.json");
  await run(CLI, ["create", "architecture", "-o", project]);
  const { code, stdout } = await run(CLI, ["audit", project]);
  assert.equal(code, 0);
  assert.match(stdout, /Contrast/);
  assert.match(stdout, /Composition/);
});

/* --------------------------------------------------------------- MCP */

async function mcp(requests) {
  const input = requests.map((request) => JSON.stringify(request)).join("\n");
  const { stdout } = await run(MCP, [], `${input}\n`);
  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("mcp server handshakes and advertises its tools", async () => {
  const [initialize, list] = await mcp([
    { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
  ]);
  assert.equal(initialize.result.serverInfo.name, "diagram-studio");
  assert.ok(initialize.result.instructions.includes("nine nodes"));
  const names = list.result.tools.map((tool) => tool.name);
  assert.deepEqual(names.sort(), [
    "audit_diagram",
    "create_diagram",
    "extract_brand",
    "import_diagram",
    "list_diagram_types",
    "render_diagram",
  ]);
});

test("mcp create_diagram returns a rendered SVG", async () => {
  const [response] = await mcp([
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "create_diagram", arguments: { type: "venn", format: "svg" } } },
  ]);
  assert.match(response.result.content[0].text, /^<svg/);
});

test("mcp import_diagram appends the fidelity ledger", async () => {
  const [response] = await mcp([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "import_diagram", arguments: { source: "flowchart LR\n A[One] --> B[Two]", format: "mermaid" } },
    },
  ]);
  const output = response.result.content[0].text;
  assert.match(output, /flowchart/);
  assert.match(output, /2 source nodes → 2 drawn/);
});

test("mcp reports tool errors in band rather than crashing", async () => {
  const [response] = await mcp([
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "render_diagram", arguments: { project: { type: "nope" } } } },
  ]);
  assert.equal(response.result.isError, true);
  assert.match(response.result.content[0].text, /invalid project/);
});

test("mcp rejects an unknown method and unknown tool", async () => {
  const [unknownMethod, unknownTool] = await mcp([
    { jsonrpc: "2.0", id: 1, method: "nope/nope" },
    { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "nope" } },
  ]);
  assert.equal(unknownMethod.error.code, -32601);
  assert.equal(unknownTool.error.code, -32602);
});
