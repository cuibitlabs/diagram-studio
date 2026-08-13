/**
 * Diagram Studio editor shell.
 *
 * Holds the project, the selection and the undo stacks, and wires the panels to
 * the model. All geometry decisions live in the engine; this file only reacts
 * to input and re-renders.
 */

import "./styles.css";
import {
  DIAGRAM_TYPES,
  LIMITS,
  PALETTES,
  cloneDiagram,
  createDiagram,
  createFromPrompt,
  getType,
  makeId,
  reviewDiagram,
  validateDiagram,
} from "./model.js";
import { describeBrandReport, extractBrandFromHTML, extractBrandFromURL, parseDrawio, parseMermaid, parseProject } from "./importers.js";
import { renderDiagram } from "./renderer.js";
import { copySVG, exportHTML, exportPDF, exportPNG, exportProject, exportSVG, exportVariants } from "./exporters.js";
import { ROLE_SHAPE, SHAPES } from "./render/shapes.js";
import { completeTheme } from "./theme/palettes.js";
import { CVD_TYPES, auditTheme, simulateTheme } from "./theme/contrast.js";

const icons = {
  spark: '<path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z"/><path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edge: '<circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="m7 16 10-8"/>',
  layout: '<rect x="3" y="4" width="7" height="6" rx="1"/><rect x="14" y="4" width="7" height="6" rx="1"/><rect x="8.5" y="15" width="7" height="6" rx="1"/><path d="M6.5 10v2h11v-2M12 12v3"/>',
  undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h9a7 7 0 0 1 7 7"/>',
  redo: '<path d="m15 7 5 5-5 5"/><path d="M20 12h-9a7 7 0 0 0-7 7"/>',
  export: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 17v3h14v-3"/>',
  import: '<path d="M12 15V3m0 0 4 4m-4-4L8 7"/><path d="M5 17v3h14v-3"/>',
  save: '<path d="M5 4h12l2 2v14H5z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7"/>',
  grid: '<path d="M4 4h16v16H4zM4 10h16M10 4v16"/>',
  code: '<path d="m9 6-6 6 6 6m6-12 6 6-6 6"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;

const ROLES = ["", ...Object.keys(ROLE_SHAPE)];

document.querySelector("#app").innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Diagram Studio home"><span class="brand-mark">D</span><span>Diagram Studio</span><small>02</small></a>
    <div class="document-title"><span class="status-dot"></span><input id="title-input" aria-label="Diagram title" /></div>
    <div class="top-actions">
      <button class="icon-button" id="undo" title="Undo (Ctrl/Cmd+Z)">${icon("undo")}</button><button class="icon-button" id="redo" title="Redo (Ctrl/Cmd+Shift+Z)">${icon("redo")}</button>
      <button class="button secondary" id="save-project">${icon("save")} Project</button><button class="button primary" id="export-menu">${icon("export")} Export</button>
    </div>
  </header>
  <main class="workspace">
    <aside class="left-panel">
      <nav class="panel-tabs" aria-label="Creation tools"><button class="active" data-tab="create">Create</button><button data-tab="library">Library</button><button data-tab="brand">Brand</button></nav>
      <section class="panel-view active" data-view="create">
        <div class="eyebrow">Prompt composer</div><h2>Turn an idea into a visual.</h2>
        <textarea id="prompt" rows="6" placeholder="Describe a system, process, strategy, timeline, or data story...">Architecture for a checkout platform
Customer -> Web app -> API gateway -> Orders service -> Order store</textarea>
        <div class="prompt-row"><span id="prompt-count">0 characters</span><button class="button primary wide" id="generate">${icon("spark")} Compose diagram</button></div>
        <div class="section-heading"><span>Structure</span><span>${DIAGRAM_TYPES.length} types</span></div>
        <select id="type-select" aria-label="Diagram type">${DIAGRAM_TYPES.map((type) => `<option value="${type.id}">${type.label}</option>`).join("")}</select>
        <div class="tool-grid">
          <button id="add-node">${icon("plus")}<span>Add node</span></button>
          <button id="connect">${icon("edge")}<span>Connect</span></button>
          <button id="auto-layout">${icon("layout")}<span>Re-layout</span></button>
          <button id="toggle-grid">${icon("grid")}<span>Grid</span></button>
        </div>
        <div class="section-heading"><span>Import</span><span>Mermaid · draw.io · JSON</span></div>
        <label class="drop-zone" for="file-import">${icon("import")}<span><b>Choose a source file</b><small>.mmd, .mermaid, .md, .drawio, .xml, .diagram.json</small></span><input id="file-import" type="file" accept=".mmd,.mermaid,.md,.drawio,.xml,.json" /></label>
        <button class="text-button" id="paste-source">${icon("code")} Paste source instead</button>
      </section>
      <section class="panel-view" data-view="library">
        <div class="eyebrow">Template library</div><h2>Pick a proven visual form.</h2>
        <div class="type-list">${DIAGRAM_TYPES.map((type, index) => `<button data-template="${type.id}"><span>${String(index + 1).padStart(2, "0")}</span><div><b>${type.label}</b><small>${type.description}</small></div></button>`).join("")}</div>
      </section>
      <section class="panel-view" data-view="brand">
        <div class="eyebrow">Brand intelligence</div><h2>Make every diagram feel native.</h2>
        <label>Website URL<div class="input-button"><input id="brand-url" placeholder="https://yourbrand.com"/><button id="extract-brand">Extract</button></div></label>
        <p class="help">The studio reads accessible website styles. When browser security blocks a site, it creates a coordinated fallback from the domain.</p>
        <label class="drop-zone compact" for="brand-file">${icon("import")}<span><b>Import HTML or CSS</b><small>Exact local brand extraction</small></span><input id="brand-file" type="file" accept=".html,.htm,.css" /></label>
        <div class="section-heading"><span>Theme presets</span></div><div class="palette-list">${Object.entries(PALETTES).map(([id, palette]) => `<button data-palette="${id}"><span class="swatches"><i style="background:${palette.accent}"></i><i style="background:${palette.accent2}"></i><i style="background:${palette.paper}"></i></span><b>${palette.name}</b></button>`).join("")}</div>
        <div class="section-heading"><span>Vision check</span></div>
        <label>Simulate<select id="cvd-select"><option value="">Normal vision</option>${CVD_TYPES.map((kind) => `<option value="${kind}">${kind}</option>`).join("")}</select></label>
        <p class="help">A diagram that stops working here is relying on hue alone. Shape, dash pattern and labels should carry the meaning instead.</p>
      </section>
    </aside>
    <section class="stage-shell">
      <div class="stage-toolbar"><div class="crumb"><b id="type-label">Architecture</b><span>·</span><span id="node-count">0 objects</span></div><div class="zoom"><button id="zoom-out">−</button><span id="zoom-label">100%</span><button id="zoom-in">+</button><button id="zoom-fit">Fit</button></div></div>
      <div class="stage" id="stage"><div class="canvas" id="canvas"></div></div>
      <footer class="statusbar"><span id="status">Ready</span><span id="review-note">Autosaved locally · SVG-native · WCAG-labelled</span></footer>
    </section>
    <aside class="right-panel">
      <div class="right-header"><span>Inspector</span><span id="selection-kind">Diagram</span></div>
      <div id="diagram-inspector">
        <label>Title<input id="inspector-title" /></label><label>Description<textarea id="description" rows="3"></textarea></label>
        <label>Canvas colour<div class="color-row"><input id="paper-color" type="color"/><input id="paper-text" /></div></label>
        <label>Accent colour<div class="color-row"><input id="accent-color" type="color"/><input id="accent-text" /></div></label>
        <label>Secondary colour<div class="color-row"><input id="accent2-color" type="color"/><input id="accent2-text" /></div></label>
        <label class="check-row"><input id="grid-check" type="checkbox"/><span>Show alignment grid</span></label>
        <label class="check-row"><input id="title-check" type="checkbox"/><span>Draw title on the canvas</span></label>
        <div class="section-heading"><span>Review</span></div>
        <ul class="review-list" id="review-list"></ul>
      </div>
      <div id="node-inspector" hidden>
        <label>Label<input id="node-label" /></label>
        <label>Sublabel<input id="node-sublabel" /></label>
        <div class="position-grid">
          <label>Role<select id="node-role">${ROLES.map((role) => `<option value="${role}">${role || "none"}</option>`).join("")}</select></label>
          <label>Shape<select id="node-shape"><option value="">auto</option>${SHAPES.map((shape) => `<option value="${shape}">${shape}</option>`).join("")}</select></label>
        </div>
        <label>Emphasis<select id="node-tone"><option value="default">Standard</option><option value="accent">Accent</option><option value="muted">Recede</option></select></label>
        <label>Value<input id="node-value" type="number" step="1" placeholder="none"/></label>
        <div class="position-grid"><label>X<input id="node-x" type="number"/></label><label>Y<input id="node-y" type="number"/></label><label>W<input id="node-w" type="number"/></label><label>H<input id="node-h" type="number"/></label></div>
        <button class="button danger wide" id="delete-node">${icon("trash")} Delete object</button>
      </div>
      <div id="edge-inspector" hidden>
        <label>Label<input id="edge-label" /></label>
        <label>Kind<select id="edge-kind"><option value="">Standard</option><option value="return">Return</option><option value="weak">Weak</option></select></label>
        <label class="check-row"><input id="edge-dashed" type="checkbox"/><span>Dashed</span></label>
        <label class="check-row"><input id="edge-accent" type="checkbox"/><span>Accent</span></label>
        <label class="check-row"><input id="edge-bidirectional" type="checkbox"/><span>Both directions</span></label>
        <button class="button secondary wide" id="reverse-edge">Reverse direction</button>
        <button class="button danger wide" id="delete-edge">${icon("trash")} Delete connection</button>
      </div>
      <div class="tip"><span>PRO TIP</span><p>Double-click a node to rename it. Click a connection to edit it. Drag on the canvas, then Ctrl/Cmd+Z to undo the whole move.</p></div>
    </aside>
  </main>
  <dialog id="source-dialog"><form method="dialog"><div class="dialog-head"><div><span class="eyebrow">Source import</span><h2>Paste Mermaid or draw.io XML</h2></div><button value="cancel" aria-label="Close">×</button></div><textarea id="source-text" rows="16" placeholder="flowchart LR&#10;  A[Idea] --> B[Polished diagram]"></textarea><div class="dialog-actions"><button class="button secondary" value="cancel">Cancel</button><button class="button primary" id="import-source" value="default">Import source</button></div></form></dialog>
  <div class="export-popover" id="export-popover" hidden>
    <button data-export="svg"><b>SVG</b><small>Editable vector, text stays text</small></button>
    <button data-export="png"><b>PNG</b><small>2× raster</small></button>
    <button data-export="pdf"><b>PDF</b><small>Landscape page</small></button>
    <button data-export="html"><b>HTML</b><small>Self-contained accessible page</small></button>
    <button data-export="variants"><b>Variants</b><small>Light, dark and titled SVGs</small></button>
    <button data-export="copy"><b>Copy SVG</b><small>Paste into design tools</small></button>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

const $ = (selector) => document.querySelector(selector);
const STORAGE_KEY = "diagram-studio.project";

let diagram = restore() ?? createDiagram("architecture");
let selectedId = null;
let selectedEdgeId = null;
let zoom = 1;
let connectFrom = null;
let history = [];
let future = [];
let renderQueued = false;
let previewCVD = "";

function restore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed) return null;
    return validateDiagram(parsed).length ? null : parsed;
  } catch {
    return null;
  }
}
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(diagram));
function snapshot() {
  history.push(cloneDiagram(diagram));
  if (history.length > 80) history.shift();
  future = [];
}
const setStatus = (message) => ($("#status").textContent = message);
function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 2400);
}
const selectedNode = () => diagram.nodes.find((node) => node.id === selectedId);
const selectedEdge = () => diagram.edges.find((edge) => edge.id === selectedEdgeId);

function render({ preserveFocus = false } = {}) {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    // The simulation is a viewing aid: swap the theme for the draw, then put
    // the author's colours back so nothing is persisted.
    const authoredTheme = diagram.theme;
    if (previewCVD) diagram.theme = simulateTheme(authoredTheme, previewCVD);
    renderDiagram(diagram, $("#canvas"), {
      selectedId,
      selectedEdgeId,
      onSelect: selectNode,
      onSelectEdge: selectEdge,
      onEdit: editNode,
      onDragStart: () => snapshot(),
      onDrag: () => render({ preserveFocus: true }),
      onDragEnd: () => persist(),
    });
    diagram.theme = authoredTheme;
    $("#canvas").style.transform = `scale(${zoom})`;
    $("#zoom-label").textContent = `${Math.round(zoom * 100)}%`;
    $("#type-label").textContent = getType(diagram.type).label;
    $("#node-count").textContent = `${diagram.nodes.length} objects`;
    $("#title-input").value = diagram.title;
    $("#type-select").value = diagram.type;
    if (!preserveFocus || !$(".right-panel :focus")) syncInspector();
    syncReview();
    persist();
  });
}

function syncReview() {
  const notes = [
    ...reviewDiagram(diagram),
    ...auditTheme(diagram.theme)
      .filter((row) => !row.pass && !row.decorative)
      .map((row) => `Contrast: ${row.fg} on ${row.bg} is ${row.ratio}:1, needs ${row.target}:1 (${row.note}).`),
  ];
  $("#review-list").innerHTML = notes.length
    ? notes.map((note) => `<li>${note}</li>`).join("")
    : `<li class="is-clear">Within the ${LIMITS.budgetNodes}-node, ${LIMITS.accent}-accent budget.</li>`;
  $("#review-note").textContent = notes.length
    ? `${notes.length} composition note${notes.length === 1 ? "" : "s"}`
    : "Autosaved locally · SVG-native · WCAG-labelled";
}

function selectNode(id) {
  if (connectFrom && id && id !== connectFrom) {
    snapshot();
    diagram.edges.push({ id: makeId("edge"), source: connectFrom, target: id, label: "", dashed: false });
    connectFrom = null;
    $("#connect").classList.remove("active");
    toast("Connection added");
  }
  selectedId = id;
  if (id) selectedEdgeId = null;
  render();
}

function selectEdge(id) {
  selectedEdgeId = id;
  if (id) selectedId = null;
  render();
}

function editNode(id) {
  selectedId = id;
  selectedEdgeId = null;
  render();
  setTimeout(() => {
    $("#node-label").focus();
    $("#node-label").select();
  }, 0);
}

function syncInspector() {
  const node = selectedNode();
  const edge = selectedEdge();
  $("#diagram-inspector").hidden = Boolean(node || edge);
  $("#node-inspector").hidden = !node;
  $("#edge-inspector").hidden = !edge;
  $("#selection-kind").textContent = node ? "Object" : edge ? "Connection" : "Diagram";

  if (node) {
    $("#node-label").value = node.label;
    $("#node-sublabel").value = node.sublabel ?? "";
    $("#node-role").value = node.role ?? "";
    $("#node-shape").value = node.shape ?? "";
    $("#node-tone").value = node.tone ?? "default";
    $("#node-value").value = typeof node.value === "number" ? node.value : "";
    for (const key of ["x", "y", "w", "h"]) $(`#node-${key}`).value = Math.round(node[key]);
    return;
  }
  if (edge) {
    $("#edge-label").value = edge.label ?? "";
    $("#edge-kind").value = edge.kind ?? "";
    $("#edge-dashed").checked = Boolean(edge.dashed);
    $("#edge-accent").checked = edge.tone === "accent";
    $("#edge-bidirectional").checked = Boolean(edge.bidirectional);
    return;
  }
  $("#inspector-title").value = diagram.title;
  $("#description").value = diagram.description ?? "";
  syncColor("paper", diagram.theme.paper);
  syncColor("accent", diagram.theme.accent);
  syncColor("accent2", diagram.theme.accent2);
  $("#grid-check").checked = Boolean(diagram.settings.grid);
  $("#title-check").checked = Boolean(diagram.settings.showTitle);
}

function syncColor(name, value) {
  $(`#${name}-color`).value = /^#[0-9a-f]{6}$/i.test(value) ? value : "#777777";
  $(`#${name}-text`).value = value;
}

function replaceDiagram(next, message) {
  snapshot();
  diagram = next;
  selectedId = null;
  selectedEdgeId = null;
  render();
  setStatus(message);
  toast(message);
}

function updateDiagram(mutator) {
  snapshot();
  mutator(diagram);
  render();
}

/* ---- composition ---- */

$("#prompt").addEventListener("input", (event) => {
  $("#prompt-count").textContent = `${event.target.value.length} characters`;
});
$("#prompt-count").textContent = `${$("#prompt").value.length} characters`;

$("#generate").addEventListener("click", () => replaceDiagram(createFromPrompt($("#prompt").value), "Prompt composed into a diagram"));
$("#type-select").addEventListener("change", (event) => replaceDiagram(createDiagram(event.target.value), "Diagram structure changed"));
$("#title-input").addEventListener("change", (event) => updateDiagram((next) => (next.title = event.target.value)));

$("#add-node").addEventListener("click", () => {
  snapshot();
  const id = makeId("node");
  diagram.nodes.push({ id, label: "New object", x: 0, y: 0, w: 0, h: 0 });
  selectedId = id;
  selectedEdgeId = null;
  render();
});

$("#connect").addEventListener("click", () => {
  const node = selectedNode();
  if (!node) return toast("Select the starting object first");
  connectFrom = node.id;
  $("#connect").classList.add("active");
  toast("Now select the destination object");
});

$("#auto-layout").addEventListener("click", () => {
  updateDiagram((next) => {
    delete next.settings.preserveLayout;
    for (const node of next.nodes) delete node.fixedSize;
  });
  toast("Layout recomputed from the model");
});

$("#toggle-grid").addEventListener("click", () => updateDiagram((next) => (next.settings.grid = !next.settings.grid)));
$("#zoom-in").addEventListener("click", () => { zoom = Math.min(2, zoom + 0.1); render(); });
$("#zoom-out").addEventListener("click", () => { zoom = Math.max(0.25, zoom - 0.1); render(); });
$("#zoom-fit").addEventListener("click", () => {
  const stage = $("#stage");
  zoom = Math.min(1, (stage.clientWidth - 64) / diagram.width, (stage.clientHeight - 64) / diagram.height);
  render();
});

for (const button of document.querySelectorAll("[data-tab]")) {
  button.addEventListener("click", () => {
    for (const tab of document.querySelectorAll("[data-tab]")) tab.classList.toggle("active", tab === button);
    for (const view of document.querySelectorAll("[data-view]")) view.classList.toggle("active", view.dataset.view === button.dataset.tab);
  });
}
for (const button of document.querySelectorAll("[data-template]")) {
  button.addEventListener("click", () => replaceDiagram(createDiagram(button.dataset.template), `${getType(button.dataset.template).label} loaded`));
}
for (const button of document.querySelectorAll("[data-palette]")) {
  button.addEventListener("click", () => updateDiagram((next) => (next.theme = { ...PALETTES[button.dataset.palette] })));
}

/* ---- import ---- */

async function importFile(file) {
  try {
    const source = await file.text();
    let next;
    if (/\.(mmd|mermaid|md)$/i.test(file.name)) next = parseMermaid(source);
    else if (/\.(drawio|xml)$/i.test(file.name)) next = parseDrawio(source);
    else next = parseProject(source);
    replaceDiagram(next, `${file.name} imported`);
  } catch (error) {
    toast(error.message);
    setStatus("Import needs attention");
  }
}

$("#file-import").addEventListener("change", (event) => event.target.files[0] && importFile(event.target.files[0]));
$("#paste-source").addEventListener("click", () => $("#source-dialog").showModal());
$("#import-source").addEventListener("click", (event) => {
  event.preventDefault();
  try {
    const source = $("#source-text").value;
    const next = source.trim().startsWith("<") ? parseDrawio(source) : parseMermaid(source);
    $("#source-dialog").close();
    replaceDiagram(next, "Pasted source imported");
  } catch (error) {
    toast(error.message);
  }
});

function applyBrand({ theme, report }) {
  updateDiagram((next) => (next.theme = completeTheme({ ...next.theme, ...theme })));
  setStatus(describeBrandReport(report));
  if (report.changes.length) {
    toast(`${report.changes.length} colour${report.changes.length === 1 ? "" : "s"} adjusted to meet contrast`);
  } else {
    toast(report.source === "domain-derived" ? "Palette derived from the domain" : "Brand styles extracted");
  }
}

$("#extract-brand").addEventListener("click", async () => {
  try {
    setStatus("Reading brand styles…");
    applyBrand(await extractBrandFromURL($("#brand-url").value));
  } catch (error) {
    toast(error.message);
  }
});

$("#brand-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  applyBrand(extractBrandFromHTML(await file.text(), file.name));
});

/* ---- inspector ---- */

for (const [selector, field] of [["#inspector-title", "title"], ["#description", "description"]]) {
  $(selector).addEventListener("change", (event) => updateDiagram((next) => (next[field] = event.target.value)));
}
for (const name of ["paper", "accent", "accent2"]) {
  $(`#${name}-color`).addEventListener("input", (event) => {
    diagram.theme[name] = event.target.value;
    $(`#${name}-text`).value = event.target.value;
    render({ preserveFocus: true });
  });
  $(`#${name}-text`).addEventListener("change", (event) => updateDiagram((next) => (next.theme[name] = event.target.value)));
}
$("#cvd-select").addEventListener("change", (event) => {
  previewCVD = event.target.value;
  render();
  setStatus(previewCVD ? `Previewing ${previewCVD} — colours are simulated, the project is unchanged` : "Ready");
});
$("#grid-check").addEventListener("change", (event) => updateDiagram((next) => (next.settings.grid = event.target.checked)));
$("#title-check").addEventListener("change", (event) => updateDiagram((next) => (next.settings.showTitle = event.target.checked)));

for (const [selector, key] of [["#node-label", "label"], ["#node-sublabel", "sublabel"], ["#node-role", "role"], ["#node-shape", "shape"], ["#node-tone", "tone"]]) {
  $(selector).addEventListener("input", (event) => {
    const node = selectedNode();
    if (!node) return;
    const value = event.target.value;
    if (value === "") delete node[key];
    else node[key] = value;
    render({ preserveFocus: true });
  });
}
$("#node-value").addEventListener("input", (event) => {
  const node = selectedNode();
  if (!node) return;
  if (event.target.value === "") delete node.value;
  else node.value = Number(event.target.value);
  render({ preserveFocus: true });
});
for (const key of ["x", "y", "w", "h"]) {
  $(`#node-${key}`).addEventListener("change", (event) => {
    const node = selectedNode();
    if (!node) return;
    snapshot();
    node[key] = Number(event.target.value);
    if (key === "w" || key === "h") node.fixedSize = true;
    render();
  });
}

$("#edge-label").addEventListener("input", (event) => {
  const edge = selectedEdge();
  if (!edge) return;
  edge.label = event.target.value;
  render({ preserveFocus: true });
});
$("#edge-kind").addEventListener("change", (event) => {
  const edge = selectedEdge();
  if (!edge) return;
  snapshot();
  if (event.target.value) edge.kind = event.target.value;
  else delete edge.kind;
  render();
});
for (const [selector, apply] of [
  ["#edge-dashed", (edge, checked) => (checked ? (edge.dashed = true) : delete edge.dashed)],
  ["#edge-accent", (edge, checked) => (checked ? (edge.tone = "accent") : delete edge.tone)],
  ["#edge-bidirectional", (edge, checked) => (checked ? (edge.bidirectional = true) : delete edge.bidirectional)],
]) {
  $(selector).addEventListener("change", (event) => {
    const edge = selectedEdge();
    if (!edge) return;
    snapshot();
    apply(edge, event.target.checked);
    render();
  });
}
$("#reverse-edge").addEventListener("click", () => {
  const edge = selectedEdge();
  if (!edge) return;
  snapshot();
  [edge.source, edge.target] = [edge.target, edge.source];
  render();
});

function deleteSelectedNode() {
  const node = selectedNode();
  if (!node) return;
  snapshot();
  diagram.nodes = diagram.nodes.filter((item) => item.id !== node.id);
  diagram.edges = diagram.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
  for (const group of diagram.groups ?? []) group.nodes = group.nodes.filter((id) => id !== node.id);
  selectedId = null;
  render();
}

function deleteSelectedEdge() {
  const edge = selectedEdge();
  if (!edge) return;
  snapshot();
  diagram.edges = diagram.edges.filter((item) => item.id !== edge.id);
  selectedEdgeId = null;
  render();
}

$("#delete-node").addEventListener("click", deleteSelectedNode);
$("#delete-edge").addEventListener("click", deleteSelectedEdge);

/* ---- history ---- */

function undo() {
  if (!history.length) return;
  future.push(cloneDiagram(diagram));
  diagram = history.pop();
  selectedId = null;
  selectedEdgeId = null;
  render();
}
function redo() {
  if (!future.length) return;
  history.push(cloneDiagram(diagram));
  diagram = future.pop();
  selectedId = null;
  selectedEdgeId = null;
  render();
}
$("#undo").addEventListener("click", undo);
$("#redo").addEventListener("click", redo);

window.addEventListener("keydown", (event) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? "");
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
    return;
  }
  if (typing) return;
  if (event.key === "Delete" || event.key === "Backspace") {
    if (selectedId) deleteSelectedNode();
    else if (selectedEdgeId) deleteSelectedEdge();
    return;
  }
  const node = selectedNode();
  if (node && event.key.startsWith("Arrow")) {
    event.preventDefault();
    snapshot();
    const step = event.shiftKey ? 20 : 4;
    if (event.key === "ArrowLeft") node.x -= step;
    if (event.key === "ArrowRight") node.x += step;
    if (event.key === "ArrowUp") node.y -= step;
    if (event.key === "ArrowDown") node.y += step;
    render();
  }
});

/* ---- export ---- */

$("#save-project").addEventListener("click", () => {
  exportProject(diagram);
  toast("Editable project downloaded");
});
$("#export-menu").addEventListener("click", () => ($("#export-popover").hidden = !$("#export-popover").hidden));
for (const button of document.querySelectorAll("[data-export]")) {
  button.addEventListener("click", async () => {
    try {
      const format = button.dataset.export;
      if (format === "svg") exportSVG(diagram);
      if (format === "png") await exportPNG(diagram);
      if (format === "pdf") await exportPDF(diagram);
      if (format === "html") exportHTML(diagram);
      if (format === "variants") exportVariants(diagram);
      if (format === "copy") await copySVG(diagram);
      $("#export-popover").hidden = true;
      toast(format === "copy" ? "SVG copied" : `${format.toUpperCase()} exported`);
    } catch (error) {
      toast(`Export failed: ${error.message}`);
    }
  });
}
document.addEventListener("click", (event) => {
  if (!event.target.closest("#export-menu, #export-popover")) $("#export-popover").hidden = true;
});

render();
setTimeout(() => $("#zoom-fit").click(), 0);
