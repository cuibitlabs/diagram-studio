import { getType } from "./model.js";

const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const point = (node) => ({ x: node.x + node.w / 2, y: node.y + node.h / 2 });

function textLines(label, width = 22) {
  const words = String(label).split(/\s+/); const lines = []; let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > width && current) { lines.push(current); current = word; }
    else current = `${current} ${word}`.trim();
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function nodeMarkup(node, selectedId) {
  const accent = node.tone === "accent";
  const lines = textLines(node.label);
  return `<g class="ds-node ${accent ? "is-accent" : ""} ${selectedId === node.id ? "is-selected" : ""}" data-node-id="${esc(node.id)}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button" aria-label="${esc(node.label)}">
    <rect width="${node.w}" height="${node.h}" rx="var(--corner)" />
    <circle class="node-index" cx="20" cy="20" r="11"/><text class="node-index-text" x="20" y="24" text-anchor="middle">${esc(node.label.slice(0, 1).toUpperCase())}</text>
    ${lines.map((line, i) => `<text class="node-title" x="20" y="${48 + i * 18}">${esc(line)}</text>`).join("")}
    ${lines.length < 2 ? `<text class="node-sub" x="20" y="70">${esc(node.sublabel || "")}</text>` : ""}
  </g>`;
}

function edgeMarkup(edge, nodes) {
  const source = nodes.find((node) => node.id === edge.source); const target = nodes.find((node) => node.id === edge.target);
  if (!source || !target) return "";
  const a = point(source); const b = point(target); const dx = b.x - a.x; const dy = b.y - a.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const start = { x: a.x + (dx / length) * Math.min(source.w, source.h) * .45, y: a.y + (dy / length) * Math.min(source.w, source.h) * .45 };
  const end = { x: b.x - (dx / length) * Math.min(target.w, target.h) * .45, y: b.y - (dy / length) * Math.min(target.w, target.h) * .45 };
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  return `<g class="ds-edge ${edge.dashed ? "is-dashed" : ""}" data-edge-id="${esc(edge.id)}"><path d="M ${start.x} ${start.y} L ${end.x} ${end.y}" marker-end="url(#arrow)"/>${edge.label ? `<rect x="${mid.x - 36}" y="${mid.y - 13}" width="72" height="22" rx="11"/><text x="${mid.x}" y="${mid.y + 3}" text-anchor="middle">${esc(edge.label)}</text>` : ""}</g>`;
}

function standard(diagram, selectedId) {
  return `${diagram.edges.map((edge) => edgeMarkup(edge, diagram.nodes)).join("")}${diagram.nodes.map((node) => nodeMarkup(node, selectedId)).join("")}`;
}

function sequence(diagram, selectedId) {
  const nodes = diagram.nodes; const margin = 100; const gap = (diagram.width - margin * 2) / Math.max(1, nodes.length);
  const heads = nodes.map((node, index) => ({ ...node, x: margin + index * gap, y: 90, w: Math.min(164, gap - 24), h: 72 }));
  const lifelines = heads.map((node) => `<path class="lifeline" d="M ${node.x + node.w / 2} ${node.y + node.h} V 650"/>`).join("");
  const messages = diagram.edges.map((edge, index) => {
    const a = heads.find((node) => node.id === edge.source); const b = heads.find((node) => node.id === edge.target); if (!a || !b) return "";
    const y = 220 + index * 76; const x1 = a.x + a.w / 2; const x2 = b.x + b.w / 2;
    return `<g class="sequence-message"><path d="M ${x1} ${y} H ${x2}" marker-end="url(#arrow)"/><text x="${(x1 + x2) / 2}" y="${y - 12}" text-anchor="middle">${esc(edge.label || `Step ${index + 1}`)}</text><circle cx="${x1}" cy="${y}" r="4"/></g>`;
  }).join("");
  return `${lifelines}${messages}${heads.map((node) => nodeMarkup(node, selectedId)).join("")}`;
}

function timeline(diagram, selectedId) {
  const y = 370;
  return `<path class="axis-line" d="M 110 ${y} H 1090" marker-end="url(#arrow)"/>${diagram.nodes.map((node, index) => {
    const x = 140 + index * (900 / Math.max(1, diagram.nodes.length - 1)); const above = index % 2 === 0; const ny = above ? 170 : 440;
    return `<path class="timeline-stem" d="M ${x} ${y} V ${above ? ny + 88 : ny}"/><circle class="timeline-dot" cx="${x}" cy="${y}" r="8"/>${nodeMarkup({ ...node, x: x - 92, y: ny, w: 184, h: 88 }, selectedId)}`;
  }).join("")}`;
}

function quadrant(diagram, selectedId) {
  const left = 150, top = 110, w = 900, h = 520, cx = left + w / 2, cy = top + h / 2;
  const labels = diagram.nodes.slice(0, 4);
  return `<rect class="plot-bg" x="${left}" y="${top}" width="${w}" height="${h}"/><path class="axis-line" d="M ${left} ${cy} H ${left + w} M ${cx} ${top} V ${top + h}"/>
    <text class="axis-label" x="${left}" y="${top - 20}">HIGH VALUE</text><text class="axis-label" x="${left + w}" y="${top + h + 34}" text-anchor="end">HIGH EFFORT</text>
    ${labels.map((node, index) => {
      const positions = [[cx + 100, cy - 180], [cx - 300, cy - 180], [cx - 300, cy + 70], [cx + 100, cy + 70]]; const [x, y] = positions[index];
      return nodeMarkup({ ...node, x, y, w: 210, h: 92 }, selectedId);
    }).join("")}`;
}

function venn(diagram) {
  const nodes = diagram.nodes.slice(0, 3); const coords = [[420, 310], [650, 310], [535, 480]];
  return `${nodes.map((node, index) => `<g data-node-id="${esc(node.id)}" class="venn-set venn-${index}"><circle cx="${coords[index][0]}" cy="${coords[index][1]}" r="190"/><text x="${coords[index][0]}" y="${coords[index][1] - 34}" text-anchor="middle">${esc(node.label)}</text></g>`).join("")}<text class="venn-core" x="535" y="370" text-anchor="middle">Shared value</text>`;
}

function pyramid(diagram) {
  const nodes = diagram.nodes; const top = 110, totalH = 520, center = 600;
  return nodes.map((node, index) => {
    const y1 = top + index * totalH / nodes.length; const y2 = top + (index + 1) * totalH / nodes.length;
    const half1 = 70 + index * 82; const half2 = 70 + (index + 1) * 82;
    return `<g class="pyramid-level ${index === 0 ? "is-accent" : ""}" data-node-id="${esc(node.id)}"><path d="M ${center - half1} ${y1} L ${center + half1} ${y1} L ${center + half2} ${y2 - 6} L ${center - half2} ${y2 - 6} Z"/><text x="${center}" y="${(y1 + y2) / 2 + 6}" text-anchor="middle">${esc(node.label)}</text></g>`;
  }).join("");
}

function loop(diagram, selectedId) {
  const cx = 600, cy = 380, radius = 250; const nodes = diagram.nodes;
  const arranged = nodes.map((node, index) => { const angle = (-Math.PI / 2) + index * Math.PI * 2 / nodes.length; return { ...node, x: cx + Math.cos(angle) * radius - 88, y: cy + Math.sin(angle) * radius - 42, w: 176, h: 84 }; });
  const edges = arranged.map((node, index) => edgeMarkup({ id: `loop-${index}`, source: node.id, target: arranged[(index + 1) % arranged.length].id, label: "", dashed: index === arranged.length - 1 }, arranged)).join("");
  return `${edges}<g class="loop-core"><circle cx="${cx}" cy="${cy}" r="105"/><text x="${cx}" y="${cy - 8}" text-anchor="middle">SHARED</text><text x="${cx}" y="${cy + 22}" text-anchor="middle">MEMORY</text></g>${arranged.map((node) => nodeMarkup(node, selectedId)).join("")}`;
}

function layers(diagram, selectedId) {
  const nodes = diagram.nodes; return nodes.map((node, index) => {
    const inset = index * 42; const y = 120 + index * 105;
    return nodeMarkup({ ...node, x: 140 + inset, y, w: 920 - inset * 2, h: 82 }, selectedId);
  }).join("");
}

function chart(diagram, family) {
  const left = 150, top = 120, w = 900, h = 480; const nodes = diagram.nodes;
  let marks = "";
  if (family === "bar") {
    const gap = w / nodes.length; marks = nodes.map((node, index) => { const bh = h * node.value / 100; return `<g data-node-id="${esc(node.id)}" class="chart-mark"><rect x="${left + index * gap + 28}" y="${top + h - bh}" width="${gap - 56}" height="${bh}"/><text x="${left + index * gap + gap / 2}" y="${top + h + 30}" text-anchor="middle">${esc(node.label)}</text><text x="${left + index * gap + gap / 2}" y="${top + h - bh - 12}" text-anchor="middle">${node.value}</text></g>`; }).join("");
  } else if (family === "line") {
    const gap = w / Math.max(1, nodes.length - 1); const pts = nodes.map((node, index) => `${left + index * gap},${top + h - h * node.value / 100}`).join(" ");
    marks = `<polyline class="line-mark" points="${pts}"/>${nodes.map((node, index) => `<g class="chart-mark" data-node-id="${esc(node.id)}"><circle cx="${left + index * gap}" cy="${top + h - h * node.value / 100}" r="8"/><text x="${left + index * gap}" y="${top + h + 30}" text-anchor="middle">${esc(node.label)}</text></g>`).join("")}`;
  } else if (family === "scatter") {
    marks = nodes.map((node, index) => `<g class="chart-mark" data-node-id="${esc(node.id)}"><circle cx="${left + 90 + (index * 151) % 760}" cy="${top + h - h * node.value / 110}" r="${8 + index * 2}"/><text x="${left + 105 + (index * 151) % 760}" y="${top + h - h * node.value / 110 - 12}">${esc(node.label)}</text></g>`).join("");
  }
  return `<rect class="plot-bg" x="${left}" y="${top}" width="${w}" height="${h}"/><path class="axis-line" d="M ${left} ${top} V ${top + h} H ${left + w}"/>${[25,50,75,100].map((v) => `<path class="grid-line" d="M ${left} ${top + h - h * v / 100} H ${left + w}"/><text class="axis-label" x="${left - 18}" y="${top + h - h * v / 100 + 4}" text-anchor="end">${v}</text>`).join("")}${marks}`;
}

function radar(diagram) {
  const cx = 600, cy = 375, radius = 260, nodes = diagram.nodes; const count = nodes.length;
  const rings = [0.25, .5, .75, 1].map((scale) => `<polygon class="radar-ring" points="${nodes.map((_, i) => { const a = -Math.PI/2 + i*Math.PI*2/count; return `${cx+Math.cos(a)*radius*scale},${cy+Math.sin(a)*radius*scale}`; }).join(" ")}"/>`).join("");
  const axes = nodes.map((node, i) => { const a=-Math.PI/2+i*Math.PI*2/count; const x=cx+Math.cos(a)*radius, y=cy+Math.sin(a)*radius; return `<path class="grid-line" d="M ${cx} ${cy} L ${x} ${y}"/><text class="axis-label" x="${cx+Math.cos(a)*(radius+38)}" y="${cy+Math.sin(a)*(radius+38)+4}" text-anchor="middle">${esc(node.label)}</text>`; }).join("");
  const values = nodes.map((node,i)=>{ const a=-Math.PI/2+i*Math.PI*2/count; const r=radius*node.value/100; return `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`; }).join(" ");
  return `${rings}${axes}<polygon class="radar-value" points="${values}"/>`;
}

function gantt(diagram) {
  const left = 310, top = 130, row = 86, w = 760;
  return `<text class="axis-label" x="${left}" y="90">WEEK 1</text><text class="axis-label" x="${left+w/2}" y="90">WEEK 6</text><text class="axis-label" x="${left+w}" y="90" text-anchor="end">WEEK 12</text>${[0,.25,.5,.75,1].map((n)=>`<path class="grid-line" d="M ${left+w*n} 108 V 650"/>`).join("")}${diagram.nodes.map((node,index)=>{ const start=(index%4)*85; const width=Math.min(w-start, 220+(index%3)*80); const y=top+index*row; return `<g class="gantt-task" data-node-id="${esc(node.id)}"><text x="110" y="${y+30}">${esc(node.label)}</text><rect x="${left+start}" y="${y}" width="${width}" height="44" rx="6"/><text x="${left+start+16}" y="${y+28}">${index === diagram.nodes.length-1 ? "Milestone" : `${2+index} weeks`}</text></g>`;}).join("")}`;
}

export function buildSVG(diagram, selectedId = null) {
  const family = getType(diagram.type).family; let body = "";
  if (family === "sequence") body = sequence(diagram, selectedId);
  else if (family === "timeline") body = timeline(diagram, selectedId);
  else if (family === "quadrant") body = quadrant(diagram, selectedId);
  else if (family === "venn") body = venn(diagram);
  else if (family === "pyramid") body = pyramid(diagram);
  else if (family === "loop") body = loop(diagram, selectedId);
  else if (family === "layers") body = layers(diagram, selectedId);
  else if (["bar", "line", "scatter"].includes(family)) body = chart(diagram, family);
  else if (family === "radar") body = radar(diagram);
  else if (family === "gantt") body = gantt(diagram);
  else body = standard(diagram, selectedId);
  const t = diagram.theme;
  return `<svg id="diagram-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${diagram.width} ${diagram.height}" width="${diagram.width}" height="${diagram.height}" role="img" aria-labelledby="diagram-title diagram-desc" style="--paper:${t.paper};--panel:${t.panel};--ink:${t.ink};--muted:${t.muted};--accent:${t.accent};--accent-2:${t.accent2};--line:${t.line};--corner:${diagram.settings.corner || 8}px">
  <title id="diagram-title">${esc(diagram.title)}</title><desc id="diagram-desc">${esc(diagram.description)}</desc>
  <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--line)" stroke-opacity=".22" stroke-width="1"/></pattern><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--ink)"/></marker></defs>
  <style>${svgStyles()}</style><rect class="canvas-bg" width="1200" height="760"/>${diagram.settings.grid ? '<rect class="canvas-grid" width="1200" height="760"/>' : ""}<g class="diagram-content">${body}</g></svg>`;
}

function svgStyles() { return `
  .canvas-bg{fill:var(--paper)}.canvas-grid{fill:url(#grid)}text{fill:var(--ink);font-family:Inter,ui-sans-serif,system-ui,sans-serif}.ds-node{cursor:grab}.ds-node rect{fill:var(--panel);stroke:var(--line);stroke-width:1.2}.ds-node.is-accent rect{fill:var(--accent);stroke:var(--accent)}.ds-node.is-accent text{fill:#fff}.ds-node.is-selected rect{stroke:var(--accent-2);stroke-width:3}.node-title{font-size:15px;font-weight:700}.node-sub{font-size:10px;fill:var(--muted);font-family:ui-monospace,monospace}.node-index{fill:var(--paper);stroke:var(--line)}.node-index-text{font-size:9px;font-weight:800}.ds-edge path,.sequence-message path,.axis-line,.timeline-stem{stroke:var(--ink);stroke-width:1.4;fill:none}.ds-edge.is-dashed path,.lifeline{stroke-dasharray:6 7}.ds-edge rect{fill:var(--paper)}.ds-edge text,.sequence-message text{font-size:10px;font-family:ui-monospace,monospace}.lifeline{stroke:var(--line);stroke-width:1}.sequence-message circle,.timeline-dot{fill:var(--accent)}.plot-bg{fill:var(--panel);stroke:var(--line)}.grid-line{stroke:var(--line);stroke-width:1;fill:none}.axis-label{font-size:10px;letter-spacing:.12em;fill:var(--muted);font-family:ui-monospace,monospace}.venn-set circle{fill:var(--accent);fill-opacity:.2;stroke:var(--accent);stroke-width:1.5}.venn-1 circle{fill:var(--accent-2);stroke:var(--accent-2)}.venn-2 circle{fill:var(--ink);stroke:var(--ink);fill-opacity:.12}.venn-set text{font-size:17px;font-weight:700}.venn-core{font-size:18px;font-weight:800}.pyramid-level path{fill:var(--panel);stroke:var(--line)}.pyramid-level.is-accent path{fill:var(--accent);stroke:var(--accent)}.pyramid-level.is-accent text{fill:#fff}.pyramid-level text{font-size:16px;font-weight:700}.loop-core circle{fill:var(--accent-2)}.loop-core text{fill:#fff;font-size:16px;font-weight:800;letter-spacing:.1em}.chart-mark rect,.chart-mark circle,.gantt-task rect{fill:var(--accent)}.chart-mark text,.gantt-task text{font-size:11px;font-weight:650}.line-mark{fill:none;stroke:var(--accent);stroke-width:4}.radar-ring{fill:none;stroke:var(--line)}.radar-value{fill:var(--accent);fill-opacity:.28;stroke:var(--accent);stroke-width:3}
  `; }

export function renderDiagram(diagram, host, { selectedId = null, onSelect, onMove, onEdit } = {}) {
  host.innerHTML = buildSVG(diagram, selectedId);
  const svg = host.querySelector("svg");
  let drag = null;
  const toPoint = (event) => { const rect = svg.getBoundingClientRect(); return { x: (event.clientX - rect.left) * diagram.width / rect.width, y: (event.clientY - rect.top) * diagram.height / rect.height }; };
  svg.querySelectorAll("[data-node-id]").forEach((element) => {
    element.addEventListener("click", (event) => { event.stopPropagation(); onSelect?.(element.dataset.nodeId); });
    element.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSelect?.(element.dataset.nodeId); } });
    element.addEventListener("dblclick", (event) => { event.stopPropagation(); onEdit?.(element.dataset.nodeId); });
    element.addEventListener("pointerdown", (event) => {
      const node = diagram.nodes.find((item) => item.id === element.dataset.nodeId); if (!node || !element.classList.contains("ds-node")) return;
      element.setPointerCapture?.(event.pointerId); const p = toPoint(event); drag = { node, dx: p.x - node.x, dy: p.y - node.y };
    });
    element.addEventListener("pointermove", (event) => { if (!drag) return; const p = toPoint(event); drag.node.x = Math.round((p.x - drag.dx) / 4) * 4; drag.node.y = Math.round((p.y - drag.dy) / 4) * 4; onMove?.(drag.node); });
    element.addEventListener("pointerup", () => { drag = null; });
  });
  svg.addEventListener("click", () => onSelect?.(null));
  return svg;
}
