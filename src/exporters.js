import { buildSVG } from "./renderer.js";

function save(blob, filename) {
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "diagram";

export function exportSVG(diagram) { save(new Blob([buildSVG(diagram)], { type: "image/svg+xml" }), `${slug(diagram.title)}.svg`); }
export function exportHTML(diagram) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${diagram.title}</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:${diagram.theme.paper}}svg{max-width:100%;height:auto}</style></head><body>${buildSVG(diagram)}</body></html>`;
  save(new Blob([html], { type: "text/html" }), `${slug(diagram.title)}.html`);
}
export function exportProject(diagram) { save(new Blob([JSON.stringify(diagram, null, 2)], { type: "application/json" }), `${slug(diagram.title)}.diagram.json`); }
export async function copySVG(diagram) { await navigator.clipboard.writeText(buildSVG(diagram)); }

async function rasterize(diagram, type = "image/png", scale = 2) {
  const source = buildSVG(diagram); const blob = new Blob([source], { type: "image/svg+xml" }); const url = URL.createObjectURL(blob); const image = new Image();
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
  const canvas = document.createElement("canvas"); canvas.width = diagram.width * scale; canvas.height = diagram.height * scale; const context = canvas.getContext("2d");
  context.fillStyle = diagram.theme.paper; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
  return { canvas, blob: await new Promise((resolve) => canvas.toBlob(resolve, type, type === "image/jpeg" ? .92 : undefined)) };
}

export async function exportPNG(diagram) { const { blob } = await rasterize(diagram); save(blob, `${slug(diagram.title)}.png`); }

function dataURLBytes(dataURL) {
  const binary = atob(dataURL.split(",")[1]); const bytes = new Uint8Array(binary.length); for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i); return bytes;
}

export async function exportPDF(diagram) {
  const { canvas } = await rasterize(diagram, "image/jpeg", 2); const jpeg = dataURLBytes(canvas.toDataURL("image/jpeg", .92));
  const pageW = 841.89, pageH = 595.28; const imageW = pageW - 48, imageH = imageW * diagram.height / diagram.width; const y = (pageH - imageH) / 2;
  const encoder = new TextEncoder(); const parts = []; const offsets = [0]; let length = 0;
  const push = (part) => { const bytes = typeof part === "string" ? encoder.encode(part) : part; parts.push(bytes); length += bytes.length; };
  push("%PDF-1.4\n%âãÏÓ\n");
  const obj = (id, bodyParts) => { offsets[id] = length; push(`${id} 0 obj\n`); for (const part of bodyParts) push(part); push("\nendobj\n"); };
  obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]); obj(2, ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
  obj(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`]);
  const stream = `q\n${imageW} 0 0 ${imageH} 24 ${y} cm\n/Im0 Do\nQ`;
  obj(4, [`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]);
  obj(5, [`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, "\nendstream"]);
  const xref = length; push("xref\n0 6\n0000000000 65535 f \n"); for (let i = 1; i <= 5; i++) push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`); push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  save(new Blob(parts, { type: "application/pdf" }), `${slug(diagram.title)}.pdf`);
}
