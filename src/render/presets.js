/**
 * Canvas presets and the audience dial.
 *
 * Fitting the canvas to the drawing is right for a document and wrong for a
 * slide: a deck wants every diagram on the same 16:9 stage, whatever it
 * contains. A preset pins the canvas and centres the drawing inside it.
 *
 * The audience dial changes wording density rather than layout. The same model
 * serves a board and an on-call engineer; what differs is how much technical
 * detail is drawn, and that is a decision about the reader, not about the
 * system being described.
 */

import { boundsOf, rectOf } from "../engine/geom.js";
import { roundTo } from "../engine/text.js";

/** Every value is divisible by 4, so the grid rule still holds. */
export const CANVAS_PRESETS = {
  fit: { label: "Fit to content", width: null, height: null, note: "the canvas follows the drawing" },
  "doc-inline": { label: "Document, inline", width: 720, height: 480, note: "inside a text column" },
  "doc-wide": { label: "Document, full width", width: 1200, height: 720, note: "full-bleed in a document" },
  "slide-16x9": { label: "Slide 16:9", width: 1600, height: 900, note: "Keynote, PowerPoint, Google Slides" },
  "slide-4x3": { label: "Slide 4:3", width: 1440, height: 1080, note: "older projector stacks" },
  "social-og": { label: "Social / OG card", width: 1200, height: 632, note: "link previews" },
  "social-square": { label: "Social square", width: 1080, height: 1080, note: "feed posts" },
  "print-a4-landscape": { label: "Print A4 landscape", width: 1684, height: 1192, note: "handouts at 144 dpi" },
};

export const PRESET_IDS = Object.keys(CANVAS_PRESETS);

export const presetFor = (id) => CANVAS_PRESETS[id] ?? CANVAS_PRESETS.fit;

/**
 * Centre the drawing inside a pinned canvas.
 *
 * @returns {{width:number, height:number, scaled:boolean}} the canvas actually used
 */
export function fitToPreset(diagram, preset, margin) {
  if (!preset?.width || !preset?.height || !diagram.nodes.length) return null;

  const rects = diagram.nodes.map(rectOf);
  const bounds = boundsOf(rects, 0);
  const available = { w: preset.width - margin.left - margin.right, h: preset.height - margin.top - margin.bottom };
  if (available.w <= 0 || available.h <= 0) return { width: preset.width, height: preset.height, scaled: false };

  // Only ever shrink. Enlarging a small diagram to fill a slide makes a
  // four-node picture look like it is hiding something.
  const scale = Math.min(1, available.w / Math.max(1, bounds.w), available.h / Math.max(1, bounds.h));
  const dx = (preset.width - bounds.w * scale) / 2 - bounds.x * scale;
  const dy = (preset.height - bounds.h * scale) / 2 - bounds.y * scale;

  for (const node of diagram.nodes) {
    node.x = roundTo(node.x * scale + dx);
    node.y = roundTo(node.y * scale + dy);
    if (scale !== 1) {
      node.w = roundTo(node.w * scale);
      node.h = roundTo(node.h * scale);
      node.fixedSize = true;
    }
  }

  return { width: preset.width, height: preset.height, scaled: scale !== 1 };
}

export const AUDIENCES = ["executive", "mixed", "engineer"];

const TECHNICAL = /\b(https?|tcp|udp|tls|ssl|api|sdk|json|xml|yaml|grpc|rest|sql|nosql|kafka|redis|s3|k8s|kubernetes|docker|oauth|jwt|dns|cdn|vpc|subnet|port|\d{2,5}\/(tcp|udp)|:\d{2,5}\b)/i;

/**
 * Apply the audience dial. Mutates in place, before sizing, so the boxes are
 * measured against the text that will actually be drawn.
 *
 * - `executive`: no sublabels, no icons, no metadata. Names only.
 * - `mixed` (default): sublabels kept, technical strings kept out of headlines.
 * - `engineer`: everything, including ports and identifiers.
 *
 * @returns {{dropped:number, audience:string}}
 */
export function applyAudience(diagram, audience = "mixed") {
  const level = AUDIENCES.includes(audience) ? audience : "mixed";
  if (level === "engineer") return { dropped: 0, audience: level };

  let dropped = 0;
  for (const node of diagram.nodes) {
    if (level === "executive") {
      if (node.sublabel) {
        dropped++;
        delete node.sublabel;
      }
      delete node.icon;
      delete node.badge;
      continue;
    }
    // mixed: a sublabel that is only a protocol or a port is noise here.
    if (node.sublabel && TECHNICAL.test(node.sublabel) && node.sublabel.split(/\s+/).length <= 3) {
      dropped++;
      delete node.sublabel;
    }
  }

  if (level === "executive") {
    for (const edge of diagram.edges ?? []) {
      if (edge.label && TECHNICAL.test(edge.label)) {
        dropped++;
        edge.label = "";
      }
    }
  }

  return { dropped, audience: level };
}
