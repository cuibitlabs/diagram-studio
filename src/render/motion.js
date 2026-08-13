/**
 * The step-motion contract.
 *
 * `reveal` and `loop` are pure CSS and need nothing here. `step` is different:
 * it is a taught explanation, so the reader has to be able to stop, go back and
 * take their time. That needs controls, and controls need a small amount of
 * script — which is exactly where motion contracts usually break, because the
 * diagram stops working when the script does not run.
 *
 * The contract:
 *
 * 1. **The static frame is the source.** Every node, label and connector is in
 *    the markup and fully visible before any script runs. Only rules under
 *    `.motion-ready` — a class the controller adds to itself — may dim anything.
 * 2. **No script, no problem.** With JavaScript disabled, print, or a stable
 *    capture, the reader gets the finished diagram.
 * 3. **`?motion=static` opts out** without editing the file, for screenshots.
 * 4. **Reduced motion removes the transition**, not the stepping.
 * 5. **The script never touches labels or values** — it only toggles a class.
 * 6. **A live region announces the step**, so it is followable without sight.
 */

export const MOTION_MODES = ["", "reveal", "step", "loop"];

/** Controls markup. Rendered outside the SVG, hidden until the script runs. */
export const motionControls = (total) => `<div class="ds-motion" data-motion-controls hidden>
  <button type="button" data-motion="prev" aria-label="Previous step">←</button>
  <button type="button" data-motion="play" aria-label="Play">Play</button>
  <button type="button" data-motion="next" aria-label="Next step">→</button>
  <button type="button" data-motion="all" aria-label="Show the whole diagram">Show all</button>
  <span class="ds-motion-count" role="status" aria-live="polite">1 / ${total}</span>
</div>`;

export const MOTION_CONTROL_CSS = `
.ds-motion{display:flex;gap:8px;align-items:center;margin-top:16px;font:12px ui-monospace,SFMono-Regular,Menlo,monospace}
.ds-motion button{min-width:40px;padding:6px 10px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;opacity:.75}
.ds-motion button:hover,.ds-motion button:focus-visible{opacity:1}
.ds-motion-count{opacity:.6;min-width:56px}
@media print{.ds-motion{display:none}}
`;

/**
 * The controller. Deliberately small, dependency-free, and scoped to one figure
 * so several stepped diagrams can share a page.
 */
export const motionController = () => `
(() => {
  const figures = document.querySelectorAll("[data-motion-figure]");
  const staticRequested = new URLSearchParams(location.search).get("motion") === "static";
  if (staticRequested) return;

  for (const figure of figures) {
    const svg = figure.querySelector("svg");
    const controls = figure.querySelector("[data-motion-controls]");
    if (!svg || !controls) continue;

    const steppable = [...svg.querySelectorAll("[style*='--step']")];
    if (!steppable.length) continue;

    const stepOf = (element) => Number(element.style.getPropertyValue("--step")) || 0;
    const total = Math.max(...steppable.map(stepOf)) + 1;
    let current = 0;
    let timer = null;

    // Only now does anything become hidden: before this line the figure is
    // complete, which is what a reader without JavaScript sees.
    svg.classList.add("motion-ready");
    svg.setAttribute("data-frame", "step");
    controls.hidden = false;

    const paint = () => {
      for (const element of steppable) element.classList.toggle("is-shown", stepOf(element) <= current);
      controls.querySelector(".ds-motion-count").textContent = (current + 1) + " / " + total;
    };
    const go = (index) => { current = Math.max(0, Math.min(total - 1, index)); paint(); };
    const stop = () => { clearInterval(timer); timer = null; controls.querySelector("[data-motion=play]").textContent = "Play"; };
    const play = () => {
      if (timer) return stop();
      controls.querySelector("[data-motion=play]").textContent = "Pause";
      timer = setInterval(() => { if (current >= total - 1) return stop(); go(current + 1); }, 1400);
    };

    controls.addEventListener("click", (event) => {
      const action = event.target.closest("button")?.dataset.motion;
      if (action === "next") { stop(); go(current + 1); }
      if (action === "prev") { stop(); go(current - 1); }
      if (action === "all") { stop(); go(total - 1); }
      if (action === "play") play();
    });

    paint();
  }
})();
`;

/** True when a diagram opts into stepping. */
export const isStepped = (diagram) => diagram?.settings?.motion === "step";

/** How many steps a stepped diagram has, for the control label. */
export function stepTotal(svg) {
  const steps = [...String(svg).matchAll(/--step:(\d+)/g)].map((match) => Number(match[1]));
  return steps.length ? Math.max(...steps) + 1 : 1;
}
