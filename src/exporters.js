/**
 * Export targets.
 *
 * SVG is the primary format: text stays text, ids are namespaced, and the file
 * opens in Figma or Illustrator with its structure intact. Everything else is
 * derived from that same SVG so the formats cannot drift apart.
 */

import { buildSVG, uidFor } from "./render/svg.js";
import { DARK_FOR, PALETTES } from "./theme/palettes.js";
import { toDrawio } from "./export/drawio.js";
import { toMermaid } from "./export/mermaid.js";

export { toDrawio, toMermaid };

function save(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Download arbitrary text — used by the diagram-language export. */
export const exportText = (content, filename, mime = "text/plain") =>
  save(new Blob([content], { type: `${mime};charset=utf-8` }), filename);

export const slug = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "diagram";

/** Render for delivery: no editor affordances, stable id prefix. */
export const renderForExport = (diagram, options = {}) =>
  buildSVG(diagram, { interactive: false, uid: uidFor(diagram.id ?? diagram.title), ...options });

export function exportSVG(diagram, options = {}) {
  const svg = renderForExport(diagram, options);
  save(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${slug(diagram.title)}${options.suffix ?? ""}.svg`);
  return svg;
}

export function htmlDocument(diagram, options = {}) {
  const svg = renderForExport(diagram, options);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${diagram.title}</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:${diagram.theme.paper};padding:32px;font-family:Inter,system-ui,sans-serif}
  figure{margin:0;max-width:100%}
  svg{max-width:100%;height:auto;display:block}
  figcaption{margin-top:16px;color:${diagram.theme.muted};font-size:14px;max-width:72ch}
</style>
</head>
<body>
<figure>
  ${svg}
  ${diagram.description ? `<figcaption>${diagram.description}</figcaption>` : ""}
</figure>
</body>
</html>`;
}

export function exportHTML(diagram) {
  save(new Blob([htmlDocument(diagram)], { type: "text/html;charset=utf-8" }), `${slug(diagram.title)}.html`);
}

export function exportProject(diagram) {
  save(new Blob([`${JSON.stringify(diagram, null, 2)}\n`], { type: "application/json" }), `${slug(diagram.title)}.diagram.json`);
}

export async function copySVG(diagram) {
  await navigator.clipboard.writeText(renderForExport(diagram));
}

/**
 * Light, dark and titled variants — the three deliverables a document, a slide
 * and a dark-mode site actually need.
 */
export function exportVariants(diagram) {
  const paletteId = Object.keys(PALETTES).find((id) => PALETTES[id].accent === diagram.theme.accent) ?? "editorial";
  const dark = { ...diagram, theme: { ...PALETTES[DARK_FOR[paletteId] ?? "midnight"] } };
  const titled = { ...diagram, settings: { ...diagram.settings, showTitle: true } };
  exportSVG(diagram, { suffix: "-light" });
  exportSVG(dark, { suffix: "-dark" });
  exportSVG(titled, { suffix: "-titled" });
}

/**
 * Round-trip back to Mermaid. Returns the notes so the caller can tell the
 * author what the target format cannot carry.
 */
export function exportMermaid(diagram) {
  const { text, notes } = toMermaid(diagram);
  save(new Blob([`${text}\n`], { type: "text/plain;charset=utf-8" }), `${slug(diagram.title)}.mmd`);
  return notes;
}

/** Round-trip back to an uncompressed draw.io file. */
export function exportDrawio(diagram) {
  save(new Blob([toDrawio(diagram)], { type: "application/xml;charset=utf-8" }), `${slug(diagram.title)}.drawio`);
}

async function rasterize(diagram, { type = "image/png", scale = 2, background = null } = {}) {
  const source = renderForExport(diagram);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("the browser could not rasterise this SVG"));
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = diagram.width * scale;
  canvas.height = diagram.height * scale;
  const context = canvas.getContext("2d");
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return {
    canvas,
    blob: await new Promise((resolve) => canvas.toBlob(resolve, type, type === "image/jpeg" ? 0.92 : undefined)),
  };
}

/**
 * @param {object} diagram
 * @param {{transparent?: boolean, scale?: number}} [options]
 */
export async function exportPNG(diagram, options = {}) {
  const { blob } = await rasterize(diagram, {
    scale: options.scale ?? 2,
    background: options.transparent ? null : diagram.theme.paper,
  });
  save(blob, `${slug(diagram.title)}.png`);
}

function dataURLBytes(dataURL) {
  const binary = atob(dataURL.split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Single-page PDF holding a high-resolution raster of the diagram.
 *
 * Text is not selectable in this output. When that matters, export SVG and let
 * the destination application place it — the SVG keeps its text.
 */
export async function exportPDF(diagram) {
  const { canvas } = await rasterize(diagram, { type: "image/jpeg", scale: 3, background: diagram.theme.paper });
  const jpeg = dataURLBytes(canvas.toDataURL("image/jpeg", 0.92));
  const landscape = diagram.width >= diagram.height;
  const pageW = landscape ? 841.89 : 595.28;
  const pageH = landscape ? 595.28 : 841.89;
  const margin = 32;
  const scale = Math.min((pageW - margin * 2) / diagram.width, (pageH - margin * 2) / diagram.height);
  const imageW = diagram.width * scale;
  const imageH = diagram.height * scale;
  const x = (pageW - imageW) / 2;
  const y = (pageH - imageH) / 2;

  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let length = 0;
  const push = (part) => {
    const bytes = typeof part === "string" ? encoder.encode(part) : part;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (id, body) => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
    for (const chunk of body) push(chunk);
    push("\nendobj\n");
  };

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  object(2, ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
  object(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`]);
  const stream = `q\n${imageW} 0 0 ${imageH} ${x} ${y} cm\n/Im0 Do\nQ`;
  object(4, [`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]);
  object(5, [
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    jpeg,
    "\nendstream",
  ]);
  const xref = length;
  push("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++) push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);

  save(new Blob(parts, { type: "application/pdf" }), `${slug(diagram.title)}.pdf`);
}
