/**
 * Presentation mode.
 *
 * Reveals the diagram one rank at a time so it can be talked through, then
 * leaves the finished diagram on screen. The steps come from the graph rank, so
 * the reveal order is the reading order rather than the order nodes happened to
 * be created.
 *
 * The animation is a plain class toggle and is skipped entirely when the viewer
 * has asked for reduced motion.
 */

import { assignRanks } from "../engine/layout/graph.js";
import { buildSVG } from "../render/svg.js";

/** Step index per node id: graph rank where there is one, model order otherwise. */
export function stepsFor(diagram) {
  const steps = new Map();
  if (diagram.edges?.length) {
    const rank = assignRanks(diagram.nodes, diagram.edges);
    for (const node of diagram.nodes) steps.set(node.id, rank.get(node.id) ?? 0);
  } else {
    diagram.nodes.forEach((node, index) => steps.set(node.id, index));
  }
  return steps;
}

export const stepCount = (steps) => (steps.size ? Math.max(...steps.values()) + 1 : 0);

/**
 * Open the overlay. Returns a `close()` function.
 *
 * @param {object} diagram
 * @param {Document} doc
 */
export function present(diagram, doc = document) {
  const steps = stepsFor(diagram);
  const total = stepCount(steps);
  const reduced = doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const overlay = doc.createElement("div");
  overlay.className = "present-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", `${diagram.title}, presentation`);
  overlay.innerHTML = `
    <div class="present-stage">${buildSVG(diagram, { interactive: false, showTitle: true, uid: "present" })}</div>
    <div class="present-bar">
      <button data-step="-1" aria-label="Previous step">←</button>
      <span class="present-count" aria-live="polite"></span>
      <button data-step="1" aria-label="Next step">→</button>
      <button data-close aria-label="Close presentation">Esc</button>
    </div>`;
  doc.body.append(overlay);

  const svg = overlay.querySelector("svg");
  const groups = [...svg.querySelectorAll("[data-node-id]")];
  const edges = [...svg.querySelectorAll("[data-edge-id]")];
  const edgeStep = new Map(
    edges.map((element) => {
      const edge = diagram.edges.find((item) => item.id === element.dataset.edgeId);
      return [element, edge ? Math.max(steps.get(edge.source) ?? 0, steps.get(edge.target) ?? 0) : 0];
    }),
  );

  svg.classList.add("stepping");
  // Reduced motion still gets the stepping, just without the transition.
  if (reduced) svg.classList.add("no-motion");

  let current = 0;
  const render = () => {
    for (const element of groups) {
      const step = steps.get(element.dataset.nodeId) ?? 0;
      element.classList.toggle("is-pending", step > current);
    }
    for (const [element, step] of edgeStep) {
      element.classList.toggle("is-pending", step > current);
    }
    overlay.querySelector(".present-count").textContent = `${Math.min(current + 1, total)} / ${total}`;
  };

  const step = (delta) => {
    current = Math.max(0, Math.min(total - 1, current + delta));
    render();
  };

  const close = () => {
    doc.removeEventListener("keydown", onKey, true);
    overlay.remove();
  };

  function onKey(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "Home") {
      current = 0;
      render();
    } else if (event.key === "End") {
      current = total - 1;
      render();
    }
  }

  overlay.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-close")) close();
    else step(Number(button.dataset.step));
  });
  doc.addEventListener("keydown", onKey, true);

  render();
  overlay.querySelector("[data-step='1']")?.focus();
  return close;
}
