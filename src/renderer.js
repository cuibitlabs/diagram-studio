/**
 * Editor-facing rendering: build the SVG, mount it, and wire pointer and
 * keyboard interaction.
 *
 * Drag reports its start and end separately so the editor can push exactly one
 * undo entry per gesture. Dragging a node that is part of a multi-selection
 * moves the whole selection, and near-alignments snap with a visible guide.
 */

import { buildSVG } from "./render/svg.js";
import { roundTo } from "./engine/text.js";
import { guideMarkup, snapToNeighbours } from "./editor/guides.js";

export { buildSVG };
export { CANVAS, uidFor } from "./render/svg.js";

const GRID_STEP = 4;
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * @param {object} diagram
 * @param {HTMLElement} host
 * @param {{
 *   selectedIds?: Set<string>|string[],
 *   selectedEdgeId?: string|null,
 *   snap?: boolean,
 *   onSelect?: (id: string|null, event: {additive: boolean}) => void,
 *   onSelectMany?: (ids: string[], event: {additive: boolean}) => void,
 *   onSelectEdge?: (id: string|null) => void,
 *   onEdit?: (id: string) => void,
 *   onDragStart?: (id: string) => void,
 *   onDrag?: () => void,
 *   onDragEnd?: () => void,
 * }} handlers
 */
export function renderDiagram(diagram, host, handlers = {}) {
  const {
    selectedEdgeId = null,
    snap = true,
    onSelect,
    onSelectMany,
    onSelectEdge,
    onEdit,
    onDragStart,
    onDrag,
    onDragEnd,
  } = handlers;

  const selectedIds = new Set(handlers.selectedIds ?? []);

  host.innerHTML = buildSVG(diagram, {
    selectedIds: [...selectedIds],
    selectedId: selectedEdgeId,
    interactive: true,
  });
  const svg = host.querySelector("svg");
  if (!svg) return null;

  const overlay = document.createElementNS(SVG_NS, "g");
  overlay.setAttribute("class", "editor-overlay");
  overlay.setAttribute("pointer-events", "none");
  svg.append(overlay);

  const toDiagramPoint = (event) => {
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * diagram.width) / rect.width,
      y: ((event.clientY - rect.top) * diagram.height) / rect.height,
    };
  };

  let drag = null;
  let marquee = null;

  /* --------------------------------------------------------------- nodes */

  for (const element of svg.querySelectorAll("[data-node-id]")) {
    const id = element.dataset.nodeId;

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      onSelect?.(id, { additive: event.shiftKey || event.metaKey || event.ctrlKey });
    });

    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        onSelect?.(id, { additive: event.shiftKey });
      } else if (event.key === "F2") {
        event.preventDefault();
        onEdit?.(id);
      }
    });

    element.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      onEdit?.(id);
    });

    element.addEventListener("pointerdown", (event) => {
      const node = diagram.nodes.find((item) => item.id === id);
      if (!node || node.locked) return;
      event.stopPropagation();
      element.setPointerCapture?.(event.pointerId);
      const point = toDiagramPoint(event);
      // Dragging a member of the selection moves the whole selection.
      const group = selectedIds.has(id)
        ? diagram.nodes.filter((item) => selectedIds.has(item.id) && !item.locked)
        : [node];
      drag = {
        element,
        lead: node,
        group,
        origins: new Map(group.map((item) => [item.id, { x: item.x, y: item.y }])),
        dx: point.x - node.x,
        dy: point.y - node.y,
        moved: false,
      };
    });

    element.addEventListener("pointermove", (event) => {
      if (!drag || drag.element !== element) return;
      const point = toDiagramPoint(event);
      let x = roundTo(point.x - drag.dx, GRID_STEP);
      let y = roundTo(point.y - drag.dy, GRID_STEP);
      let guides = [];

      if (snap && drag.group.length === 1) {
        const others = diagram.nodes.filter((item) => item.id !== drag.lead.id);
        const snapped = snapToNeighbours({ ...drag.lead, x, y }, others);
        x = snapped.x;
        y = snapped.y;
        guides = snapped.guides;
      }

      const origin = drag.origins.get(drag.lead.id);
      const shiftX = x - origin.x;
      const shiftY = y - origin.y;
      if (!shiftX && !shiftY && !drag.moved) return;

      if (!drag.moved) {
        drag.moved = true;
        onDragStart?.(drag.lead.id);
      }
      for (const item of drag.group) {
        const start = drag.origins.get(item.id);
        item.x = start.x + shiftX;
        item.y = start.y + shiftY;
      }
      overlay.innerHTML = guideMarkup(guides);
      onDrag?.();
    });

    const endDrag = () => {
      if (!drag) return;
      const finished = drag;
      drag = null;
      overlay.innerHTML = "";
      if (finished.moved) onDragEnd?.();
    };

    element.addEventListener("pointerup", endDrag);
    element.addEventListener("pointercancel", endDrag);
    element.addEventListener("lostpointercapture", endDrag);
  }

  /* --------------------------------------------------------------- edges */

  for (const element of svg.querySelectorAll("[data-edge-id]")) {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      onSelectEdge?.(element.dataset.edgeId);
    });
  }

  /* ------------------------------------------------------------- marquee */

  svg.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-node-id], [data-edge-id]")) return;
    const point = toDiagramPoint(event);
    marquee = { x1: point.x, y1: point.y, x2: point.x, y2: point.y, additive: event.shiftKey, moved: false };
    svg.setPointerCapture?.(event.pointerId);
  });

  svg.addEventListener("pointermove", (event) => {
    if (!marquee) return;
    const point = toDiagramPoint(event);
    marquee.x2 = point.x;
    marquee.y2 = point.y;
    marquee.moved = Math.abs(marquee.x2 - marquee.x1) > 3 || Math.abs(marquee.y2 - marquee.y1) > 3;
    if (!marquee.moved) return;
    const x = Math.min(marquee.x1, marquee.x2);
    const y = Math.min(marquee.y1, marquee.y2);
    overlay.innerHTML = `<rect class="marquee" x="${x}" y="${y}" width="${Math.abs(marquee.x2 - marquee.x1)}" height="${Math.abs(marquee.y2 - marquee.y1)}"/>`;
  });

  const endMarquee = () => {
    if (!marquee) return;
    const finished = marquee;
    marquee = null;
    overlay.innerHTML = "";
    if (finished.moved) onSelectMany?.(finished, { additive: finished.additive });
    else {
      onSelect?.(null, { additive: false });
      onSelectEdge?.(null);
    }
  };

  svg.addEventListener("pointerup", endMarquee);
  svg.addEventListener("pointercancel", endMarquee);

  return svg;
}
