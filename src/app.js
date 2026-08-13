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
import {
  describeBrandReport,
  describeProvenance,
  extractBrandFromHTML,
  extractBrandFromURL,
  parseDrawio,
  parseMermaid,
  parseProject,
} from "./importers.js";
import { renderDiagram } from "./renderer.js";
import {
  copySVG,
  exportDrawio,
  exportHTML,
  exportMermaid,
  exportPDF,
  exportPNG,
  exportExcalidraw,
  exportFlatSVG,
  exportPPTX,
  exportProject,
  exportReact,
  exportReport,
  exportSVG,
  exportText,
  exportVariants,
  slug,
} from "./exporters.js";
import { ROLE_SHAPE, SHAPES } from "./render/shapes.js";
import { MOTIONS, STYLES } from "./render/skin.js";
import { completeTheme } from "./theme/palettes.js";
import { CVD_TYPES, auditTheme, simulateTheme } from "./theme/contrast.js";
import { align, distribute, duplicate, nodesInMarquee } from "./editor/selection.js";
import { buildCommands, filterCommands } from "./editor/commands.js";
import { simplify } from "./edit/simplify.js";
import { parse as parseDSL, stringify as stringifyDSL } from "./dsl/index.js";
import { present } from "./editor/present.js";

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
  play: '<path d="M7 4l12 8-12 8z"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;

const ROLES = ["", ...Object.keys(ROLE_SHAPE)];
const ALIGN_BUTTONS = [
  ["left", "Align left"],
  ["centre-x", "Align centres horizontally"],
  ["right", "Align right"],
  ["top", "Align top"],
  ["centre-y", "Align centres vertically"],
  ["bottom", "Align bottom"],
];

document.querySelector("#app").innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Diagram Studio home"><span class="brand-mark">D</span><span>Diagram Studio</span><small>02</small></a>
    <div class="document-title"><span class="status-dot"></span><input id="title-input" aria-label="Diagram title" /></div>
    <div class="top-actions">
      <button class="icon-button" id="undo" title="Undo (Ctrl/Cmd+Z)">${icon("undo")}</button><button class="icon-button" id="redo" title="Redo (Ctrl/Cmd+Shift+Z)">${icon("redo")}</button>
      <button class="button secondary" id="present-button" title="Present (F5)">${icon("play")} Present</button>
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
        <label class="drop-zone" for="file-import">${icon("import")}<span><b>Choose a source file</b><small>.ds, .mmd, .mermaid, .md, .drawio, .xml, .diagram.json</small></span><input id="file-import" type="file" accept=".ds,.mmd,.mermaid,.md,.drawio,.xml,.json" /></label>
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
      <div class="stage-toolbar">
        <div class="crumb"><b id="type-label">Architecture</b><span>·</span><span id="node-count">0 objects</span></div>
        <div class="align-tools" id="align-tools" hidden>
          ${ALIGN_BUTTONS.map(([mode, label]) => `<button data-align="${mode}" title="${label}" aria-label="${label}"><i class="align-glyph align-${mode}"></i></button>`).join("")}
          <span class="align-divider"></span>
          <button data-distribute="horizontal" title="Distribute horizontally" aria-label="Distribute horizontally">⇹</button>
          <button data-distribute="vertical" title="Distribute vertically" aria-label="Distribute vertically">⇳</button>
        </div>
        <div class="zoom"><button id="zoom-out">−</button><span id="zoom-label">100%</span><button id="zoom-in">+</button><button id="zoom-fit">Fit</button></div>
      </div>
      <div class="stage" id="stage"><div class="canvas" id="canvas"></div></div>
      <footer class="statusbar"><span id="status">Ready · press Ctrl+K for commands</span><span id="review-note">Autosaved locally · SVG-native · WCAG-labelled</span></footer>
    </section>
    <aside class="right-panel">
      <div class="right-header"><span>Inspector</span><span id="selection-kind">Diagram</span></div>
      <div id="diagram-inspector">
        <label>Title<input id="inspector-title" /></label><label>Description<textarea id="description" rows="3"></textarea></label>
        <label>Canvas colour<div class="color-row"><input id="paper-color" type="color"/><input id="paper-text" /></div></label>
        <label>Accent colour<div class="color-row"><input id="accent-color" type="color"/><input id="accent-text" /></div></label>
        <label>Secondary colour<div class="color-row"><input id="accent2-color" type="color"/><input id="accent2-text" /></div></label>
        <div class="position-grid">
          <label>Style<select id="style-select">${STYLES.map((style) => `<option value="${style}">${style}</option>`).join("")}</select></label>
          <label>Motion<select id="motion-select"><option value="">none</option>${MOTIONS.filter(Boolean).map((motion) => `<option value="${motion}">${motion}</option>`).join("")}</select></label>
        </div>
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
      <div id="multi-inspector" hidden>
        <p class="help"><b id="multi-count">0 objects</b> selected. Use the alignment tools above the canvas, or Ctrl+D to duplicate.</p>
        <label>Emphasis<select id="multi-tone"><option value="">Leave as is</option><option value="default">Standard</option><option value="accent">Accent</option><option value="muted">Recede</option></select></label>
        <button class="button secondary wide" id="multi-duplicate">Duplicate selection</button>
        <button class="button danger wide" id="multi-delete">${icon("trash")} Delete selection</button>
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
      <div class="tip"><span>PRO TIP</span><p>Shift-click or drag a box to select several objects. Ctrl+K opens the command palette. F5 presents the diagram step by step.</p></div>
    </aside>
  </main>
  <dialog id="source-dialog"><form method="dialog"><div class="dialog-head"><div><span class="eyebrow">Source import</span><h2>Paste Mermaid or draw.io XML</h2></div><button value="cancel" aria-label="Close">×</button></div><textarea id="source-text" rows="16" placeholder="flowchart LR&#10;  A[Idea] --> B[Polished diagram]"></textarea><div class="dialog-actions"><button class="button secondary" value="cancel">Cancel</button><button class="button primary" id="import-source" value="default">Import source</button></div></form></dialog>
  <dialog id="palette-dialog" class="command-dialog" aria-label="Command palette">
    <input id="palette-input" type="text" placeholder="Type a command…" autocomplete="off" />
    <ul id="palette-list" role="listbox"></ul>
  </dialog>
  <div class="export-popover" id="export-popover" hidden>
    <button data-export="svg"><b>SVG</b><small>Editable vector, text stays text</small></button>
    <button data-export="png"><b>PNG</b><small>2× raster</small></button>
    <button data-export="pdf"><b>PDF</b><small>Landscape page</small></button>
    <button data-export="html"><b>HTML</b><small>Self-contained accessible page</small></button>
    <button data-export="variants"><b>Variants</b><small>Light, dark and titled SVGs</small></button>
    <button data-export="mermaid"><b>Mermaid</b><small>Back into a README</small></button>
    <button data-export="drawio"><b>draw.io</b><small>Uncompressed, diffable XML</small></button>
    <button data-export="ds"><b>Diagram language</b><small>Readable .ds source for git</small></button>
    <button data-export="pptx"><b>PowerPoint</b><small>Real, editable shapes</small></button>
    <button data-export="excalidraw"><b>Excalidraw</b><small>For a workshop</small></button>
    <button data-export="flat"><b>Figma SVG</b><small>Resolved styles, named layers</small></button>
    <button data-export="react"><b>React</b><small>Component with theme props</small></button>
    <button data-export="report"><b>Accessibility report</b><small>Contrast, reading order, alt text</small></button>
    <button data-export="copy"><b>Copy SVG</b><small>Paste into design tools</small></button>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

const $ = (selector) => document.querySelector(selector);
const STORAGE_KEY = "diagram-studio.project";

let diagram = restore() ?? createDiagram("architecture");
let selection = new Set();
let selectedEdgeId = null;
let zoom = 1;
let connectFrom = null;
let history = [];
let future = [];
let renderQueued = false;
let previewCVD = "";
let clipboard = null;

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

const selectedNodes = () => diagram.nodes.filter((node) => selection.has(node.id));
const singleNode = () => (selection.size === 1 ? selectedNodes()[0] : null);
const selectedEdge = () => diagram.edges.find((edge) => edge.id === selectedEdgeId);
const setSelection = (ids) => {
  selection = new Set(ids);
  if (selection.size) selectedEdgeId = null;
};

/**
 * Coalesce renders to one per frame, but never depend on a frame arriving:
 * a tab that is not compositing (backgrounded, or an embedded preview pane)
 * gets no `requestAnimationFrame` callbacks at all, which left the canvas
 * permanently empty. The timer is the guarantee; the frame is the optimisation.
 */
function schedule(callback) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    callback();
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
  setTimeout(run, 32);
}

function render({ preserveFocus = false } = {}) {
  if (renderQueued) return;
  renderQueued = true;
  schedule(() => {
    renderQueued = false;
    // The simulation is a viewing aid: swap the theme for the draw, then put
    // the author's colours back so nothing is persisted.
    const authoredTheme = diagram.theme;
    if (previewCVD) diagram.theme = simulateTheme(authoredTheme, previewCVD);
    renderDiagram(diagram, $("#canvas"), {
      selectedIds: selection,
      selectedEdgeId,
      onSelect: selectNode,
      onSelectMany: selectMarquee,
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
    $("#align-tools").hidden = selection.size < 2;
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

function selectNode(id, event = {}) {
  if (connectFrom && id && id !== connectFrom) {
    snapshot();
    diagram.edges.push({ id: makeId("edge"), source: connectFrom, target: id, label: "", dashed: false });
    connectFrom = null;
    $("#connect").classList.remove("active");
    toast("Connection added");
  }
  if (!id) setSelection([]);
  else if (event.additive) {
    if (selection.has(id)) selection.delete(id);
    else selection.add(id);
    selectedEdgeId = null;
  } else setSelection([id]);
  render();
}

function selectMarquee(marquee, event = {}) {
  const hits = nodesInMarquee(diagram.nodes, marquee);
  setSelection(event.additive ? [...selection, ...hits] : hits);
  render();
}

function selectEdge(id) {
  selectedEdgeId = id;
  if (id) selection = new Set();
  render();
}

function editNode(id) {
  setSelection([id]);
  render();
  setTimeout(() => {
    $("#node-label").focus();
    $("#node-label").select();
  }, 0);
}

function syncInspector() {
  const node = singleNode();
  const edge = selectedEdge();
  const many = selection.size > 1;
  $("#diagram-inspector").hidden = Boolean(node || edge || many);
  $("#node-inspector").hidden = !node;
  $("#multi-inspector").hidden = !many;
  $("#edge-inspector").hidden = !edge;
  $("#selection-kind").textContent = many ? `${selection.size} objects` : node ? "Object" : edge ? "Connection" : "Diagram";

  if (many) {
    $("#multi-count").textContent = `${selection.size} objects`;
    return;
  }
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
  $("#style-select").value = diagram.settings.style ?? "editorial";
  $("#motion-select").value = diagram.settings.motion ?? "";
}

function syncColor(name, value) {
  $(`#${name}-color`).value = /^#[0-9a-f]{6}$/i.test(value) ? value : "#777777";
  $(`#${name}-text`).value = value;
}

function replaceDiagram(next, message) {
  snapshot();
  diagram = next;
  setSelection([]);
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

/* ---- actions shared by buttons, shortcuts and the palette ---- */

const applyPositions = (positions) => {
  const byId = new Map(diagram.nodes.map((node) => [node.id, node]));
  for (const position of positions) {
    const node = byId.get(position.id);
    if (!node) continue;
    node.x = position.x;
    node.y = position.y;
  }
};

const actions = {
  addNode() {
    snapshot();
    const id = makeId("node");
    diagram.nodes.push({ id, label: "New object", x: 0, y: 0, w: 0, h: 0 });
    setSelection([id]);
    render();
  },
  duplicate() {
    const nodes = selectedNodes();
    if (!nodes.length) return;
    snapshot();
    const copy = duplicate(nodes, diagram.edges, makeId);
    diagram.nodes.push(...copy.nodes);
    diagram.edges.push(...copy.edges);
    setSelection(copy.nodes.map((node) => node.id));
    render();
    toast(`${copy.nodes.length} object${copy.nodes.length === 1 ? "" : "s"} duplicated`);
  },
  deleteSelection() {
    if (selectedEdgeId) return deleteSelectedEdge();
    const ids = new Set(selection);
    if (!ids.size) return;
    snapshot();
    diagram.nodes = diagram.nodes.filter((node) => !ids.has(node.id));
    diagram.edges = diagram.edges.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target));
    for (const group of diagram.groups ?? []) group.nodes = group.nodes.filter((id) => !ids.has(id));
    setSelection([]);
    render();
  },
  align(mode) {
    const nodes = selectedNodes();
    if (nodes.length < 2) return;
    snapshot();
    applyPositions(align(nodes, mode));
    for (const node of nodes) node.fixedSize = node.fixedSize ?? false;
    render();
  },
  distribute(axis) {
    const nodes = selectedNodes();
    if (nodes.length < 3) return;
    snapshot();
    applyPositions(distribute(nodes, axis));
    render();
  },
  simplify(level) {
    const { diagram: next, ledger } = simplify(diagram, { level });
    const removed = diagram.nodes.length - next.nodes.length;
    if (!removed && next.edges.length === diagram.edges.length) {
      toast("Nothing to simplify at this level");
      return;
    }
    replaceDiagram(next, ledger[0]);
    setStatus(ledger.join(" · "));
  },
  relayout() {
    updateDiagram((next) => {
      delete next.settings.preserveLayout;
      for (const node of next.nodes) delete node.fixedSize;
    });
    toast("Layout recomputed from the model");
  },
  toggleGrid: () => updateDiagram((next) => (next.settings.grid = !next.settings.grid)),
  toggleTitle: () => updateDiagram((next) => (next.settings.showTitle = !next.settings.showTitle)),
  fit: () => $("#zoom-fit").click(),
  present: () => present(diagram),
  undo,
  redo,
  saveProject() {
    exportProject(diagram);
    toast("Editable project downloaded");
  },
  setType: (id) => replaceDiagram(createDiagram(id), `${getType(id).label} loaded`),
  setPalette: (id) => updateDiagram((next) => (next.theme = { ...PALETTES[id] })),
  export: runExport,
};

async function runExport(format) {
  try {
    if (format === "svg") exportSVG(diagram);
    if (format === "png") await exportPNG(diagram);
    if (format === "pdf") await exportPDF(diagram);
    if (format === "html") exportHTML(diagram);
    if (format === "variants") exportVariants(diagram);
    if (format === "drawio") exportDrawio(diagram);
    if (format === "ds") exportText(stringifyDSL(diagram), `${slug(diagram.title)}.ds`, "text/plain");
    if (format === "pptx") exportPPTX(diagram);
    if (format === "excalidraw") exportExcalidraw(diagram);
    if (format === "flat") exportFlatSVG(diagram);
    if (format === "react") exportReact(diagram);
    if (format === "report") exportReport(diagram);
    if (format === "copy") await copySVG(diagram);
    let note = "";
    if (format === "mermaid") {
      const notes = exportMermaid(diagram);
      if (notes.length) {
        note = notes[0];
        setStatus(notes.join(" "));
      }
    }
    $("#export-popover").hidden = true;
    toast(note || (format === "copy" ? "SVG copied" : `${format.toUpperCase()} exported`));
  } catch (error) {
    toast(`Export failed: ${error.message}`);
  }
}

/* ---- composition ---- */

$("#prompt").addEventListener("input", (event) => {
  $("#prompt-count").textContent = `${event.target.value.length} characters`;
});
$("#prompt-count").textContent = `${$("#prompt").value.length} characters`;

$("#generate").addEventListener("click", () => replaceDiagram(createFromPrompt($("#prompt").value), "Prompt composed into a diagram"));
$("#type-select").addEventListener("change", (event) => actions.setType(event.target.value));
$("#title-input").addEventListener("change", (event) => updateDiagram((next) => (next.title = event.target.value)));
$("#add-node").addEventListener("click", actions.addNode);
$("#auto-layout").addEventListener("click", actions.relayout);
$("#toggle-grid").addEventListener("click", actions.toggleGrid);
$("#present-button").addEventListener("click", actions.present);

$("#connect").addEventListener("click", () => {
  const node = singleNode();
  if (!node) return toast("Select the starting object first");
  connectFrom = node.id;
  $("#connect").classList.add("active");
  toast("Now select the destination object");
});

$("#zoom-in").addEventListener("click", () => { zoom = Math.min(2, zoom + 0.1); render(); });
$("#zoom-out").addEventListener("click", () => { zoom = Math.max(0.25, zoom - 0.1); render(); });
$("#zoom-fit").addEventListener("click", () => {
  const stage = $("#stage");
  zoom = Math.min(1, (stage.clientWidth - 64) / diagram.width, (stage.clientHeight - 64) / diagram.height);
  render();
});
$("#stage").addEventListener("wheel", (event) => {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  zoom = Math.max(0.25, Math.min(2, zoom - Math.sign(event.deltaY) * 0.1));
  render();
}, { passive: false });

for (const button of document.querySelectorAll("[data-align]")) {
  button.addEventListener("click", () => actions.align(button.dataset.align));
}
for (const button of document.querySelectorAll("[data-distribute]")) {
  button.addEventListener("click", () => actions.distribute(button.dataset.distribute));
}
for (const button of document.querySelectorAll("[data-tab]")) {
  button.addEventListener("click", () => {
    for (const tab of document.querySelectorAll("[data-tab]")) tab.classList.toggle("active", tab === button);
    for (const view of document.querySelectorAll("[data-view]")) view.classList.toggle("active", view.dataset.view === button.dataset.tab);
  });
}
for (const button of document.querySelectorAll("[data-template]")) {
  button.addEventListener("click", () => actions.setType(button.dataset.template));
}
for (const button of document.querySelectorAll("[data-palette]")) {
  button.addEventListener("click", () => actions.setPalette(button.dataset.palette));
}

/* ---- import ---- */

async function importFile(file) {
  try {
    const source = await file.text();
    let next;
    if (/\.(mmd|mermaid|md)$/i.test(file.name)) next = parseMermaid(source);
    else if (/\.(drawio|xml)$/i.test(file.name)) next = await parseDrawio(source);
    else if (/\.ds$/i.test(file.name)) next = parseDSL(source);
    else next = parseProject(source);
    replaceDiagram(next, `${file.name} imported`);
    if (next.provenance) setStatus(describeProvenance(next.provenance).split("\n")[0]);
  } catch (error) {
    toast(error.message);
    setStatus("Import needs attention");
  }
}

$("#file-import").addEventListener("change", (event) => event.target.files[0] && importFile(event.target.files[0]));
$("#paste-source").addEventListener("click", () => $("#source-dialog").showModal());
$("#import-source").addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    const source = $("#source-text").value;
    const trimmed = source.trim();
    // Pick the language from the text rather than making the author declare it.
    const next = trimmed.startsWith("<")
      ? await parseDrawio(source)
      : /^(flowchart|graph|sequenceDiagram|stateDiagram|erDiagram|gantt|journey|mindmap|quadrantChart|pie|timeline)\b/i.test(trimmed)
        ? parseMermaid(source)
        : parseDSL(source);
    $("#source-dialog").close();
    replaceDiagram(next, "Pasted source imported");
    if (next.provenance) setStatus(describeProvenance(next.provenance).split("\n")[0]);
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
$("#style-select").addEventListener("change", (event) => updateDiagram((next) => (next.settings.style = event.target.value)));
$("#motion-select").addEventListener("change", (event) => updateDiagram((next) => (next.settings.motion = event.target.value || undefined)));

for (const [selector, key] of [["#node-label", "label"], ["#node-sublabel", "sublabel"], ["#node-role", "role"], ["#node-shape", "shape"], ["#node-tone", "tone"]]) {
  $(selector).addEventListener("input", (event) => {
    const node = singleNode();
    if (!node) return;
    const value = event.target.value;
    if (value === "") delete node[key];
    else node[key] = value;
    render({ preserveFocus: true });
  });
}
$("#node-value").addEventListener("input", (event) => {
  const node = singleNode();
  if (!node) return;
  if (event.target.value === "") delete node.value;
  else node.value = Number(event.target.value);
  render({ preserveFocus: true });
});
for (const key of ["x", "y", "w", "h"]) {
  $(`#node-${key}`).addEventListener("change", (event) => {
    const node = singleNode();
    if (!node) return;
    snapshot();
    node[key] = Number(event.target.value);
    if (key === "w" || key === "h") node.fixedSize = true;
    render();
  });
}

$("#multi-tone").addEventListener("change", (event) => {
  const value = event.target.value;
  if (!value) return;
  snapshot();
  for (const node of selectedNodes()) {
    if (value === "default") delete node.tone;
    else node.tone = value;
  }
  event.target.value = "";
  render();
});
$("#multi-duplicate").addEventListener("click", actions.duplicate);
$("#multi-delete").addEventListener("click", actions.deleteSelection);

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

function deleteSelectedEdge() {
  const edge = selectedEdge();
  if (!edge) return;
  snapshot();
  diagram.edges = diagram.edges.filter((item) => item.id !== edge.id);
  selectedEdgeId = null;
  render();
}

$("#delete-node").addEventListener("click", actions.deleteSelection);
$("#delete-edge").addEventListener("click", deleteSelectedEdge);

/* ---- history ---- */

function undo() {
  if (!history.length) return;
  future.push(cloneDiagram(diagram));
  diagram = history.pop();
  setSelection([]);
  selectedEdgeId = null;
  render();
}
function redo() {
  if (!future.length) return;
  history.push(cloneDiagram(diagram));
  diagram = future.pop();
  setSelection([]);
  selectedEdgeId = null;
  render();
}
$("#undo").addEventListener("click", undo);
$("#redo").addEventListener("click", redo);

/* ---- command palette ---- */

const paletteDialog = $("#palette-dialog");
let paletteCommands = [];
let paletteIndex = 0;

function renderPalette(query = "") {
  const matches = filterCommands(paletteCommands, query).slice(0, 40);
  paletteIndex = Math.min(paletteIndex, Math.max(0, matches.length - 1));
  $("#palette-list").innerHTML = matches
    .map((command, index) => `<li role="option" data-index="${index}" class="${index === paletteIndex ? "is-active" : ""}"><span class="palette-group">${command.group}</span><span>${command.label}</span>${command.hint ? `<kbd>${command.hint}</kbd>` : ""}</li>`)
    .join("");
  return matches;
}

function openPalette() {
  paletteCommands = buildCommands(actions, {
    selectionCount: selection.size,
    types: DIAGRAM_TYPES,
    palettes: Object.entries(PALETTES).map(([id, palette]) => ({ id, name: palette.name })),
  });
  paletteIndex = 0;
  $("#palette-input").value = "";
  renderPalette("");
  paletteDialog.showModal();
  $("#palette-input").focus();
}

$("#palette-input").addEventListener("input", (event) => {
  paletteIndex = 0;
  renderPalette(event.target.value);
});
$("#palette-input").addEventListener("keydown", (event) => {
  const matches = filterCommands(paletteCommands, event.target.value).slice(0, 40);
  if (event.key === "ArrowDown") {
    event.preventDefault();
    paletteIndex = Math.min(paletteIndex + 1, matches.length - 1);
    renderPalette(event.target.value);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    paletteIndex = Math.max(paletteIndex - 1, 0);
    renderPalette(event.target.value);
  } else if (event.key === "Enter") {
    event.preventDefault();
    const command = matches[paletteIndex];
    paletteDialog.close();
    command?.run?.();
  }
});
$("#palette-list").addEventListener("click", (event) => {
  const item = event.target.closest("li");
  if (!item) return;
  const matches = filterCommands(paletteCommands, $("#palette-input").value).slice(0, 40);
  paletteDialog.close();
  matches[Number(item.dataset.index)]?.run?.();
});

/* ---- keyboard ---- */

window.addEventListener("keydown", (event) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? "");
  const meta = event.metaKey || event.ctrlKey;

  if (meta && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openPalette();
    return;
  }
  if (meta && event.key.toLowerCase() === "z") {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
    return;
  }
  if (event.key === "F5") {
    event.preventDefault();
    actions.present();
    return;
  }
  if (typing) return;

  if (meta && event.key.toLowerCase() === "a") {
    event.preventDefault();
    setSelection(diagram.nodes.map((node) => node.id));
    render();
    return;
  }
  if (meta && event.key.toLowerCase() === "d") {
    event.preventDefault();
    actions.duplicate();
    return;
  }
  if (meta && event.key.toLowerCase() === "c") {
    clipboard = cloneDiagram({ nodes: selectedNodes(), edges: diagram.edges });
    toast(`${selection.size} object${selection.size === 1 ? "" : "s"} copied`);
    return;
  }
  if (meta && event.key.toLowerCase() === "v") {
    if (!clipboard?.nodes?.length) return;
    snapshot();
    const copy = duplicate(clipboard.nodes, clipboard.edges, makeId);
    diagram.nodes.push(...copy.nodes);
    diagram.edges.push(...copy.edges);
    setSelection(copy.nodes.map((node) => node.id));
    render();
    return;
  }
  if (event.key === "Escape") {
    setSelection([]);
    selectedEdgeId = null;
    connectFrom = null;
    $("#connect").classList.remove("active");
    render();
    return;
  }
  if (event.key === "Delete" || event.key === "Backspace") {
    actions.deleteSelection();
    return;
  }
  if (event.key.startsWith("Arrow") && selection.size) {
    event.preventDefault();
    snapshot();
    const step = event.shiftKey ? 20 : 4;
    const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    for (const node of selectedNodes()) {
      node.x += dx;
      node.y += dy;
    }
    render();
  }
});

/* ---- export ---- */

$("#save-project").addEventListener("click", actions.saveProject);
$("#export-menu").addEventListener("click", () => ($("#export-popover").hidden = !$("#export-popover").hidden));
for (const button of document.querySelectorAll("[data-export]")) {
  button.addEventListener("click", () => runExport(button.dataset.export));
}
document.addEventListener("click", (event) => {
  if (!event.target.closest("#export-menu, #export-popover")) $("#export-popover").hidden = true;
});

render();
setTimeout(() => $("#zoom-fit").click(), 0);
