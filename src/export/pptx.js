/**
 * PowerPoint export.
 *
 * Real DrawingML shapes, not a picture of a diagram. Someone who receives the
 * deck can move a box, retype a label and recolour a connector — which is what
 * they were going to do anyway, and what forces most diagrams to be redrawn
 * from scratch in PowerPoint.
 *
 * Layout comes from the same engine, scaled into the slide.
 */

import { buildSVG } from "../render/svg.js";
import { rectOf } from "../engine/geom.js";
import { routeEdges } from "../engine/router.js";
import { shapeOf } from "../render/primitives.js";
import { parseColor, toHex } from "../theme/color.js";
import { zip } from "./zip.js";

/** English Metric Units: 914400 per inch, 96 px per inch. */
const EMU_PER_PX = 9525;
const SLIDE = { w: 12192000, h: 6858000 }; // 13.333 × 7.5 inches, 16:9
const MARGIN = 457200; // half an inch

const esc = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));

/** DrawingML wants six hex digits with no leading hash. */
const rgb = (color) => {
  const parsed = parseColor(color);
  return (parsed ? toHex(parsed) : "#000000").slice(1).toUpperCase();
};

const PRESET = {
  diamond: "diamond",
  circle: "ellipse",
  event: "ellipse",
  hexagon: "hexagon",
  stadium: "roundRect",
  cylinder: "can",
  parallelogram: "parallelogram",
  chevron: "chevron",
  note: "foldedCorner",
  document: "flowChartDocument",
  box: "roundRect",
};

function shapeXml(node, index, transform, theme) {
  const rect = rectOf(node);
  const accent = node.tone === "accent";
  const solid = node.tone === "solid";
  const preset = PRESET[shapeOf(node)] ?? "roundRect";
  // The accent card is a tint behind an accent border; DrawingML carries the
  // tint as an alpha on the same colour so the slide matches the SVG.
  const fill = solid ? theme.accent : accent ? theme.accent : node.role === "store" ? theme.paper : theme.panel;
  const fillAlpha = accent && !solid ? 10000 : null;
  const stroke = accent || solid ? theme.accent : theme.line;
  const ink = solid ? theme.onAccent : theme.ink;
  const muted = solid ? theme.onAccent : theme.muted;
  const dashed = node.dashed || node.role === "external" || node.role === "legacy";

  const runs = [
    `<a:p><a:pPr algn="l"/><a:r><a:rPr lang="en" sz="1400" b="1" dirty="0"><a:solidFill><a:srgbClr val="${rgb(ink)}"/></a:solidFill><a:latin typeface="Inter"/></a:rPr><a:t>${esc(node.label)}</a:t></a:r></a:p>`,
  ];
  if (node.sublabel) {
    runs.push(
      `<a:p><a:pPr algn="l"/><a:r><a:rPr lang="en" sz="1000" dirty="0"><a:solidFill><a:srgbClr val="${rgb(muted)}"/></a:solidFill><a:latin typeface="Inter"/></a:rPr><a:t>${esc(node.sublabel)}</a:t></a:r></a:p>`,
    );
  }

  return `<p:sp><p:nvSpPr><p:cNvPr id="${index + 2}" name="${esc(node.label)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${transform.x(rect.x)}" y="${transform.y(rect.y)}"/><a:ext cx="${transform.size(rect.w)}" cy="${transform.size(rect.h)}"/></a:xfrm>
<a:prstGeom prst="${preset}"><a:avLst/></a:prstGeom>
<a:solidFill><a:srgbClr val="${rgb(fill)}">${fillAlpha ? `<a:alpha val="${fillAlpha}"/>` : ""}</a:srgbClr></a:solidFill>
<a:ln w="${accent || solid ? 19050 : 12700}"><a:solidFill><a:srgbClr val="${rgb(stroke)}"/></a:solidFill>${dashed ? '<a:prstDash val="dash"/>' : ""}</a:ln></p:spPr>
<p:txBody><a:bodyPr lIns="137160" tIns="91440" rIns="137160" bIns="91440" anchor="ctr" wrap="square"/><a:lstStyle/>${runs.join("")}</p:txBody></p:sp>`;
}

/** A routed connector as a freeform path, so the elbows survive. */
function connectorXml(edge, route, index, transform, theme) {
  const points = route.points;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(1, Math.max(...xs) - minX);
  const height = Math.max(1, Math.max(...ys) - minY);

  const path = points
    .map((point, i) => {
      const x = Math.round((point.x - minX) * EMU_PER_PX * transform.scale);
      const y = Math.round((point.y - minY) * EMU_PER_PX * transform.scale);
      return i === 0 ? `<a:moveTo><a:pt x="${x}" y="${y}"/></a:moveTo>` : `<a:lnTo><a:pt x="${x}" y="${y}"/></a:lnTo>`;
    })
    .join("");

  const colour = rgb(edge.tone === "accent" ? theme.accent : theme.lineStrong);
  const label = String(edge.label ?? "").trim();

  return `<p:sp><p:nvSpPr><p:cNvPr id="${index + 500}" name="${esc(label || "connector")}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${transform.x(minX)}" y="${transform.y(minY)}"/><a:ext cx="${transform.size(width)}" cy="${transform.size(height)}"/></a:xfrm>
<a:custGeom><a:avLst/><a:gdLst/><a:pathLst><a:path w="${transform.size(width)}" h="${transform.size(height)}">${path}</a:path></a:pathLst></a:custGeom>
<a:ln w="${edge.tone === "accent" ? 25400 : 12700}"><a:solidFill><a:srgbClr val="${colour}"/></a:solidFill>${edge.dashed ? '<a:prstDash val="dash"/>' : ""}<a:tailEnd type="triangle" w="med" len="med"/></a:ln></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>`;
}

const contentTypes = (count) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
${Array.from({ length: count }, (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

const presentationXml = (count) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>${Array.from({ length: count }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join("")}</p:sldIdLst>
<p:sldSz cx="${SLIDE.w}" cy="${SLIDE.h}"/><p:notesSz cx="${SLIDE.h}" cy="${SLIDE.w}"/>
</p:presentation>`;

const presentationRels = (count) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
${Array.from({ length: count }, (_, index) => `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join("")}
<Relationship Id="rId${count + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;

const emptySpTree = (name) =>
  `<p:cSld name="${name}"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>`;

const SLIDE_MASTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
${emptySpTree("Master")}<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`;

const SLIDE_MASTER_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

const SLIDE_LAYOUT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
${emptySpTree("Blank")}</p:sldLayout>`;

const SLIDE_LAYOUT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

const SLIDE_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;

function themeXml(theme) {
  const scheme = [theme.accent, theme.accent2, theme.ink, theme.muted, theme.line, theme.paper].map(rgb);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Diagram Studio">
<a:themeElements>
<a:clrScheme name="Diagram Studio"><a:dk1><a:srgbClr val="${rgb(theme.ink)}"/></a:dk1><a:lt1><a:srgbClr val="${rgb(theme.paper)}"/></a:lt1><a:dk2><a:srgbClr val="${rgb(theme.lineStrong)}"/></a:dk2><a:lt2><a:srgbClr val="${rgb(theme.panel)}"/></a:lt2>
${scheme.map((value, index) => `<a:accent${index + 1}><a:srgbClr val="${value}"/></a:accent${index + 1}>`).join("")}
<a:hlink><a:srgbClr val="${rgb(theme.accent)}"/></a:hlink><a:folHlink><a:srgbClr val="${rgb(theme.accent2)}"/></a:folHlink></a:clrScheme>
<a:fontScheme name="Diagram Studio"><a:majorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>
<a:fmtScheme name="Diagram Studio">
<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
</a:fmtScheme></a:themeElements></a:theme>`;
}

/** One slide's XML for one diagram. */
function slideXml(diagram) {
  buildSVG(diagram, { interactive: false, uid: "pptx" });
  const theme = diagram.theme;

  // Fit the drawing into the slide, never enlarging past 1:1.
  const availableW = SLIDE.w - MARGIN * 2;
  const availableH = SLIDE.h - MARGIN * 2;
  const scale = Math.min(1, availableW / (diagram.width * EMU_PER_PX), availableH / (diagram.height * EMU_PER_PX));
  const drawnW = diagram.width * EMU_PER_PX * scale;
  const drawnH = diagram.height * EMU_PER_PX * scale;
  const originX = Math.round((SLIDE.w - drawnW) / 2);
  const originY = Math.round((SLIDE.h - drawnH) / 2);

  const transform = {
    scale,
    x: (value) => Math.round(originX + value * EMU_PER_PX * scale),
    y: (value) => Math.round(originY + value * EMU_PER_PX * scale),
    size: (value) => Math.max(1, Math.round(value * EMU_PER_PX * scale)),
  };

  const routes = routeEdges(diagram.edges ?? [], diagram.nodes, {});
  const connectors = (diagram.edges ?? [])
    .map((edge, index) => {
      const route = routes.get(edge.id);
      return route ? connectorXml(edge, route, index, transform, theme) : "";
    })
    .join("");
  const shapes = diagram.nodes.map((node, index) => shapeXml(node, index, transform, theme)).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld name="${esc(diagram.title)}"><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${rgb(theme.paper)}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
${connectors}${shapes}</p:spTree></p:cSld>
<p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr>
</p:sld>`;
}

/**
 * A deck: one slide per diagram, sharing the first diagram's theme for the
 * presentation theme part.
 *
 * @param {object[]} diagrams
 * @returns {Uint8Array} a .pptx file
 */
export function toPPTXDeck(diagrams) {
  const slides = diagrams.map((diagram) => slideXml(diagram));
  const theme = diagrams[0]?.theme ?? {};

  return zip([
    { name: "[Content_Types].xml", data: contentTypes(slides.length) },
    { name: "_rels/.rels", data: ROOT_RELS },
    { name: "ppt/presentation.xml", data: presentationXml(slides.length) },
    { name: "ppt/_rels/presentation.xml.rels", data: presentationRels(slides.length) },
    { name: "ppt/slideMasters/slideMaster1.xml", data: SLIDE_MASTER },
    { name: "ppt/slideMasters/_rels/slideMaster1.xml.rels", data: SLIDE_MASTER_RELS },
    { name: "ppt/slideLayouts/slideLayout1.xml", data: SLIDE_LAYOUT },
    { name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: SLIDE_LAYOUT_RELS },
    { name: "ppt/theme/theme1.xml", data: themeXml(theme) },
    ...slides.flatMap((slide, index) => [
      { name: `ppt/slides/slide${index + 1}.xml`, data: slide },
      { name: `ppt/slides/_rels/slide${index + 1}.xml.rels`, data: SLIDE_RELS },
    ]),
  ]);
}

/**
 * @param {object} diagram
 * @returns {Uint8Array} a single-slide .pptx file
 */
export const toPPTX = (diagram) => toPPTXDeck([diagram]);
