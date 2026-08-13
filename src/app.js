import "./styles.css";
import { applyAutoLayout, cloneDiagram, createDiagram, createFromPrompt, DIAGRAM_TYPES, makeId, PALETTES, validateDiagram } from "./model.js";
import { extractBrandFromHTML, extractBrandFromURL, parseDrawio, parseMermaid, parseProject } from "./importers.js";
import { renderDiagram } from "./renderer.js";
import { copySVG, exportHTML, exportPDF, exportPNG, exportProject, exportSVG } from "./exporters.js";

const icons = {
  spark: '<path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z"/><path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', edge: '<circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="m7 16 10-8"/>',
  layout: '<rect x="3" y="4" width="7" height="6" rx="1"/><rect x="14" y="4" width="7" height="6" rx="1"/><rect x="8.5" y="15" width="7" height="6" rx="1"/><path d="M6.5 10v2h11v-2M12 12v3"/>',
  undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h9a7 7 0 0 1 7 7"/>', redo: '<path d="m15 7 5 5-5 5"/><path d="M20 12h-9a7 7 0 0 0-7 7"/>',
  export: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 17v3h14v-3"/>', import: '<path d="M12 15V3m0 0 4 4m-4-4L8 7"/><path d="M5 17v3h14v-3"/>',
  save: '<path d="M5 4h12l2 2v14H5z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>', trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7"/>',
  grid: '<path d="M4 4h16v16H4zM4 10h16M10 4v16"/>', code: '<path d="m9 6-6 6 6 6m6-12 6 6-6 6"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;

document.querySelector("#app").innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Diagram Studio home"><span class="brand-mark">D</span><span>Diagram Studio</span><small>01</small></a>
    <div class="document-title"><span class="status-dot"></span><input id="title-input" aria-label="Diagram title" /></div>
    <div class="top-actions">
      <button class="icon-button" id="undo" title="Undo (Ctrl/Cmd+Z)">${icon("undo")}</button><button class="icon-button" id="redo" title="Redo">${icon("redo")}</button>
      <button class="button secondary" id="save-project">${icon("save")} Project</button><button class="button primary" id="export-menu">${icon("export")} Export</button>
    </div>
  </header>
  <main class="workspace">
    <aside class="left-panel">
      <nav class="panel-tabs" aria-label="Creation tools"><button class="active" data-tab="create">Create</button><button data-tab="library">Library</button><button data-tab="brand">Brand</button></nav>
      <section class="panel-view active" data-view="create">
        <div class="eyebrow">Prompt composer</div><h2>Turn an idea into a visual.</h2>
        <textarea id="prompt" rows="6" placeholder="Describe a system, process, strategy, timeline, or data story...">Create a high-level architecture showing Customer → Web app → API gateway → Core service → Database</textarea>
        <div class="prompt-row"><span id="prompt-count">104 characters</span><button class="button primary wide" id="generate">${icon("spark")} Compose diagram</button></div>
        <div class="section-heading"><span>Structure</span><span>31 types</span></div>
        <select id="type-select" aria-label="Diagram type">${DIAGRAM_TYPES.map((type) => `<option value="${type.id}">${type.label}</option>`).join("")}</select>
        <div class="tool-grid"><button id="add-node">${icon("plus")}<span>Add node</span></button><button id="connect">${icon("edge")}<span>Connect</span></button><button id="auto-layout">${icon("layout")}<span>Auto layout</span></button><button id="toggle-grid">${icon("grid")}<span>Grid</span></button></div>
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
      </section>
    </aside>
    <section class="stage-shell">
      <div class="stage-toolbar"><div class="crumb"><b id="type-label">Architecture</b><span>·</span><span id="node-count">5 objects</span></div><div class="zoom"><button id="zoom-out">−</button><span id="zoom-label">84%</span><button id="zoom-in">+</button><button id="zoom-fit">Fit</button></div></div>
      <div class="stage" id="stage"><div class="canvas" id="canvas"></div></div>
      <footer class="statusbar"><span id="status">Ready</span><span>Autosaved locally · SVG-native · WCAG-labelled</span></footer>
    </section>
    <aside class="right-panel">
      <div class="right-header"><span>Inspector</span><span id="selection-kind">Diagram</span></div>
      <div id="diagram-inspector">
        <label>Title<input id="inspector-title" /></label><label>Description<textarea id="description" rows="4"></textarea></label>
        <label>Canvas color<div class="color-row"><input id="paper-color" type="color"/><input id="paper-text" /></div></label>
        <label>Accent color<div class="color-row"><input id="accent-color" type="color"/><input id="accent-text" /></div></label>
        <label>Secondary color<div class="color-row"><input id="accent2-color" type="color"/><input id="accent2-text" /></div></label>
        <label class="check-row"><input id="grid-check" type="checkbox"/><span>Show alignment grid</span></label>
      </div>
      <div id="node-inspector" hidden>
        <label>Label<input id="node-label" /></label><label>Sublabel<input id="node-sublabel" /></label><label>Emphasis<select id="node-tone"><option value="default">Standard</option><option value="accent">Accent</option></select></label>
        <label>Chart value<input id="node-value" type="range" min="0" max="100"/><output id="node-value-output"></output></label>
        <div class="position-grid"><label>X<input id="node-x" type="number"/></label><label>Y<input id="node-y" type="number"/></label><label>W<input id="node-w" type="number"/></label><label>H<input id="node-h" type="number"/></label></div>
        <button class="button danger wide" id="delete-node">${icon("trash")} Delete object</button>
      </div>
      <div class="tip"><span>PRO TIP</span><p>Double-click any node to rename it. Drag cards directly on the canvas. Press Delete to remove a selected object.</p></div>
    </aside>
  </main>
  <dialog id="source-dialog"><form method="dialog"><div class="dialog-head"><div><span class="eyebrow">Source import</span><h2>Paste Mermaid or draw.io XML</h2></div><button value="cancel" aria-label="Close">×</button></div><textarea id="source-text" rows="16" placeholder="flowchart LR\n  A[Idea] --> B[Polished diagram]"></textarea><div class="dialog-actions"><button class="button secondary" value="cancel">Cancel</button><button class="button primary" id="import-source" value="default">Import source</button></div></form></dialog>
  <div class="export-popover" id="export-popover" hidden><button data-export="svg"><b>SVG</b><small>Editable vector</small></button><button data-export="png"><b>PNG</b><small>2× transparent-safe raster</small></button><button data-export="pdf"><b>PDF</b><small>Presentation-ready landscape</small></button><button data-export="html"><b>HTML</b><small>Self-contained accessible page</small></button><button data-export="copy"><b>Copy SVG</b><small>Paste into design tools</small></button></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

const $ = (selector) => document.querySelector(selector);
let diagram = restore() || createDiagram("architecture"); let selectedId = null; let zoom = .84; let connectFrom = null; let history = []; let future = []; let renderQueued = false;

function restore() { try { return JSON.parse(localStorage.getItem("diagram-studio.project")); } catch { return null; } }
function persist() { localStorage.setItem("diagram-studio.project", JSON.stringify(diagram)); }
function snapshot() { history.push(cloneDiagram(diagram)); if (history.length > 60) history.shift(); future = []; }
function setStatus(message) { $("#status").textContent = message; }
function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2400); }
function selectedNode() { return diagram.nodes.find((node) => node.id === selectedId); }

function render({ preserveInspectorFocus = false } = {}) {
  if (renderQueued) return; renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderDiagram(diagram, $("#canvas"), { selectedId, onSelect: select, onMove: () => { persist(); render({ preserveInspectorFocus: true }); }, onEdit: editNode });
    $("#canvas").style.transform = `scale(${zoom})`; $("#zoom-label").textContent = `${Math.round(zoom * 100)}%`;
    const meta = DIAGRAM_TYPES.find((type) => type.id === diagram.type); $("#type-label").textContent = meta?.label || diagram.type; $("#node-count").textContent = `${diagram.nodes.length} objects`;
    $("#title-input").value = diagram.title; $("#type-select").value = diagram.type;
    if (!preserveInspectorFocus || !$(".right-panel :focus")) syncInspector();
    persist();
  });
}

function select(id) {
  if (connectFrom && id && id !== connectFrom) { snapshot(); diagram.edges.push({ id: makeId("edge"), source: connectFrom, target: id, label: "", dashed: false }); connectFrom = null; $("#connect").classList.remove("active"); toast("Connection added"); }
  selectedId = id; render();
}
function editNode(id) { selectedId = id; render(); setTimeout(() => { $("#node-label").focus(); $("#node-label").select(); }, 0); }
function syncInspector() {
  const node = selectedNode(); $("#diagram-inspector").hidden = Boolean(node); $("#node-inspector").hidden = !node; $("#selection-kind").textContent = node ? "Object" : "Diagram";
  if (node) {
    $("#node-label").value = node.label; $("#node-sublabel").value = node.sublabel || ""; $("#node-tone").value = node.tone || "default"; $("#node-value").value = node.value || 0; $("#node-value-output").value = node.value || 0;
    for (const key of ["x","y","w","h"]) $(`#node-${key}`).value = Math.round(node[key]);
  } else {
    $("#inspector-title").value = diagram.title; $("#description").value = diagram.description; syncColor("paper", diagram.theme.paper); syncColor("accent", diagram.theme.accent); syncColor("accent2", diagram.theme.accent2); $("#grid-check").checked = diagram.settings.grid;
  }
}
function syncColor(name, value) { const solid = value.startsWith("#") ? value : "#777777"; $(`#${name}-color`).value = solid; $(`#${name}-text`).value = value; }
function replaceDiagram(next, message) { snapshot(); diagram = next; selectedId = null; render(); setStatus(message); toast(message); }
function updateDiagram(mutator) { snapshot(); mutator(diagram); render(); }

$("#prompt").addEventListener("input", (event) => $("#prompt-count").textContent = `${event.target.value.length} characters`);
$("#generate").addEventListener("click", () => replaceDiagram(createFromPrompt($("#prompt").value), "Prompt composed into a diagram"));
$("#type-select").addEventListener("change", (event) => replaceDiagram(createDiagram(event.target.value), "Diagram structure changed"));
$("#title-input").addEventListener("change", (event) => updateDiagram((d) => d.title = event.target.value));
$("#add-node").addEventListener("click", () => { snapshot(); const id = makeId("node"); diagram.nodes.push({ id, label: "New object", sublabel: "Describe its role", x: 480, y: 330, w: 196, h: 88, value: 50, tone: "default" }); selectedId = id; render(); });
$("#connect").addEventListener("click", () => { const node = selectedNode(); if (!node) return toast("Select the starting object first"); connectFrom = node.id; $("#connect").classList.add("active"); toast("Now select the destination object"); });
$("#auto-layout").addEventListener("click", () => updateDiagram((d) => applyAutoLayout(d)));
$("#toggle-grid").addEventListener("click", () => updateDiagram((d) => d.settings.grid = !d.settings.grid));
$("#zoom-in").addEventListener("click", () => { zoom = Math.min(1.4, zoom + .1); render(); }); $("#zoom-out").addEventListener("click", () => { zoom = Math.max(.35, zoom - .1); render(); }); $("#zoom-fit").addEventListener("click", () => { zoom = Math.min(.92, ($("#stage").clientWidth - 60) / 1200, ($("#stage").clientHeight - 60) / 760); render(); });

document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b === button)); document.querySelectorAll("[data-view]").forEach((view) => view.classList.toggle("active", view.dataset.view === button.dataset.tab)); }));
document.querySelectorAll("[data-template]").forEach((button) => button.addEventListener("click", () => replaceDiagram(createDiagram(button.dataset.template), `${button.textContent.trim().replace(/^\d+/, "")} loaded`)));
document.querySelectorAll("[data-palette]").forEach((button) => button.addEventListener("click", () => updateDiagram((d) => d.theme = { ...PALETTES[button.dataset.palette] })));

async function importFile(file) {
  try { const source = await file.text(); let next; if (/\.(mmd|mermaid|md)$/i.test(file.name)) next = parseMermaid(source); else if (/\.(drawio|xml)$/i.test(file.name)) next = parseDrawio(source); else next = parseProject(source); replaceDiagram(next, `${file.name} imported`); }
  catch (error) { toast(error.message); setStatus("Import needs attention"); }
}
$("#file-import").addEventListener("change", (event) => event.target.files[0] && importFile(event.target.files[0]));
$("#paste-source").addEventListener("click", () => $("#source-dialog").showModal());
$("#import-source").addEventListener("click", (event) => { event.preventDefault(); try { const source = $("#source-text").value; const next = source.trim().startsWith("<") ? parseDrawio(source) : parseMermaid(source); $("#source-dialog").close(); replaceDiagram(next, "Pasted source imported"); } catch (error) { toast(error.message); } });
$("#extract-brand").addEventListener("click", async () => { try { setStatus("Reading brand styles..."); const theme = await extractBrandFromURL($("#brand-url").value); updateDiagram((d) => d.theme = { ...d.theme, ...theme }); toast(theme.source === "domain-derived" ? "Coordinated fallback theme created" : "Brand styles extracted"); setStatus("Brand theme applied"); } catch (error) { toast(error.message); } });
$("#brand-file").addEventListener("change", async (event) => { const file = event.target.files[0]; if (!file) return; const theme = extractBrandFromHTML(await file.text(), file.name); updateDiagram((d) => d.theme = { ...d.theme, ...theme }); toast("Local brand styles extracted"); });

for (const [selector, field] of [["#inspector-title","title"],["#description","description"]]) $(selector).addEventListener("change", (event) => updateDiagram((d) => d[field] = event.target.value));
for (const name of ["paper", "accent", "accent2"]) { $(`#${name}-color`).addEventListener("input", (event) => { diagram.theme[name] = event.target.value; $(`#${name}-text`).value = event.target.value; render({ preserveInspectorFocus: true }); }); $(`#${name}-text`).addEventListener("change", (event) => updateDiagram((d) => d.theme[name] = event.target.value)); }
$("#grid-check").addEventListener("change", (event) => updateDiagram((d) => d.settings.grid = event.target.checked));
for (const [selector, key] of [["#node-label","label"],["#node-sublabel","sublabel"],["#node-tone","tone"]]) $(selector).addEventListener("input", (event) => { const node = selectedNode(); if (node) { node[key] = event.target.value; render({ preserveInspectorFocus: true }); } });
$("#node-value").addEventListener("input", (event) => { const node = selectedNode(); if (node) { node.value = Number(event.target.value); $("#node-value-output").value = node.value; render({ preserveInspectorFocus: true }); } });
for (const key of ["x","y","w","h"]) $(`#node-${key}`).addEventListener("change", (event) => { const node = selectedNode(); if (node) { snapshot(); node[key] = Number(event.target.value); render(); } });
function deleteSelected() { const node = selectedNode(); if (!node) return; snapshot(); diagram.nodes = diagram.nodes.filter((item) => item.id !== node.id); diagram.edges = diagram.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id); selectedId = null; render(); }
$("#delete-node").addEventListener("click", deleteSelected);

function undo() { if (!history.length) return; future.push(cloneDiagram(diagram)); diagram = history.pop(); selectedId = null; render(); }
function redo() { if (!future.length) return; history.push(cloneDiagram(diagram)); diagram = future.pop(); selectedId = null; render(); }
$("#undo").addEventListener("click", undo); $("#redo").addEventListener("click", redo);
window.addEventListener("keydown", (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); } else if ((event.key === "Delete" || event.key === "Backspace") && selectedId && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) deleteSelected(); });

$("#save-project").addEventListener("click", () => { exportProject(diagram); toast("Editable project downloaded"); });
$("#export-menu").addEventListener("click", () => $("#export-popover").hidden = !$("#export-popover").hidden);
document.querySelectorAll("[data-export]").forEach((button) => button.addEventListener("click", async () => { try { const format = button.dataset.export; if (format === "svg") exportSVG(diagram); if (format === "png") await exportPNG(diagram); if (format === "pdf") await exportPDF(diagram); if (format === "html") exportHTML(diagram); if (format === "copy") await copySVG(diagram); $("#export-popover").hidden = true; toast(format === "copy" ? "SVG copied" : `${format.toUpperCase()} exported`); } catch (error) { toast(`Export failed: ${error.message}`); } }));
document.addEventListener("click", (event) => { if (!event.target.closest("#export-menu, #export-popover")) $("#export-popover").hidden = true; });

const validation = validateDiagram(diagram); if (validation.length) { diagram = createDiagram(); toast("Recovered an invalid autosave"); }
render(); setTimeout(() => $("#zoom-fit").click(), 0);
