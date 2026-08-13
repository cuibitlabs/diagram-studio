/**
 * Editor-facing rendering: build the SVG, mount it, and wire pointer and
 * keyboard interaction.
 *
 * Drag reports its start and end separately so the editor can push exactly one
 * undo entry per gesture instead of none (the previous behaviour) or one per
 * pointer move.
 */

import { buildSVG } from "./render/svg.js";
import { roundTo } from "./engine/text.js";

export { buildSVG };
export { CANVAS, uidFor } from "./render/svg.js";

const GRID_STEP = 4;

/**
 * @param {object} diagram
 * @param {HTMLElement} host
 * @param {{
 *   selectedId?: string|null,
 *   selectedEdgeId?: string|null,
 *   onSelect?: (id: string|null) => void,
 *   onSelectEdge?: (id: string|null) => void,
 *   onEdit?: (id: string) => void,
 *   onDragStart?: (id: string) => void,
 *   onDrag?: (node: object) => void,
 *   onDragEnd?: (node: object) => void,
 * }} handlers
 */
export function renderDiagram(diagram, host, handlers = {}) {
  const {
    selectedId = null,
    selectedEdgeId = null,
    onSelect,
    onSelectEdge,
    onEdit,
    onDragStart,
    onDrag,
    onDragEnd,
  } = handlers;

  host.innerHTML = buildSVG(diagram, { selectedId: selectedId ?? selectedEdgeId, interactive: true });
  const svg = host.querySelector("svg");
  if (!svg) return null;

  const toDiagramPoint = (event) => {
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * diagram.width) / rect.width,
      y: ((event.clientY - rect.top) * diagram.height) / rect.height,
    };
  };

  let drag = null;

  for (const element of svg.querySelectorAll("[data-node-id]")) {
    const id = element.dataset.nodeId;

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      onSelect?.(id);
    });

    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        onSelect?.(id);
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
      const point = toDiagramPoint(event);
      element.setPointerCapture?.(event.pointerId);
      drag = { node, dx: point.x - node.x, dy: point.y - node.y, moved: false, element };
    });

    element.addEventListener("pointermove", (event) => {
      if (!drag || drag.element !== element) return;
      const point = toDiagramPoint(event);
      const x = roundTo(point.x - drag.dx, GRID_STEP);
      const y = roundTo(point.y - drag.dy, GRID_STEP);
      if (x === drag.node.x && y === drag.node.y) return;
      if (!drag.moved) {
        drag.moved = true;
        onDragStart?.(drag.node.id);
      }
      drag.node.x = x;
      drag.node.y = y;
      onDrag?.(drag.node);
    });

    const endDrag = () => {
      if (!drag) return;
      const finished = drag;
      drag = null;
      if (finished.moved) onDragEnd?.(finished.node);
    };

    element.addEventListener("pointerup", endDrag);
    element.addEventListener("pointercancel", endDrag);
    element.addEventListener("lostpointercapture", endDrag);
  }

  for (const element of svg.querySelectorAll("[data-edge-id]")) {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      onSelectEdge?.(element.dataset.edgeId);
    });
  }

  svg.addEventListener("click", () => {
    onSelect?.(null);
    onSelectEdge?.(null);
  });

  return svg;
}
