/**
 * Decks.
 *
 * A single diagram rarely tells the whole story: the honest answer to "this is
 * too complicated" is an overview plus details, which is a deck. A deck holds
 * several diagrams under one theme, and exports as a keyboard-navigable HTML
 * page or a PowerPoint file with one slide per diagram.
 */

import { buildSVG } from "../render/svg.js";
import { esc } from "../render/primitives.js";
import { toPPTXDeck } from "./pptx.js";

/**
 * Apply the deck's theme to every diagram, so a deck cannot drift into
 * mismatched palettes slide by slide.
 */
export function normaliseDeck(deck) {
  const theme = deck.theme ?? deck.diagrams?.[0]?.theme;
  return {
    title: deck.title ?? "Deck",
    description: deck.description ?? "",
    theme,
    diagrams: (deck.diagrams ?? []).map((diagram) => (theme ? { ...diagram, theme: { ...theme } } : diagram)),
  };
}

export const toDeckPPTX = (deck) => toPPTXDeck(normaliseDeck(deck).diagrams);

/**
 * A self-contained HTML deck. Arrow keys and click move between slides; it
 * degrades to a scrollable document with no JavaScript, because a deck that
 * needs a script to be readable is a deck that fails when emailed.
 */
export function toDeckHTML(deck) {
  const normalised = normaliseDeck(deck);
  const theme = normalised.theme ?? {};

  const slides = normalised.diagrams
    .map((diagram, index) => {
      const svg = buildSVG(diagram, { interactive: false, uid: `deck-${index}` });
      return `<section class="slide" id="slide-${index + 1}" aria-label="${esc(diagram.title)}">
  <header><h2>${esc(diagram.title)}</h2>${diagram.description ? `<p>${esc(diagram.description)}</p>` : ""}</header>
  <figure>${svg}</figure>
  <footer>${index + 1} / ${normalised.diagrams.length}</footer>
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(normalised.title)}</title>
<style>
  :root{--paper:${theme.paper ?? "#f3f0e9"};--ink:${theme.ink ?? "#1d211f"};--muted:${theme.muted ?? "#5f665f"};--hair:${theme.line ?? "#c8c4ba"}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Inter,system-ui,sans-serif}
  .deck-title{padding:48px 48px 0;max-width:72ch}
  .deck-title h1{font:400 44px/1.1 'Instrument Serif',Georgia,serif;margin:0 0 8px}
  .deck-title p{color:var(--muted);margin:0}
  .slide{padding:48px;border-bottom:1px solid var(--hair)}
  .slide header{max-width:72ch;margin-bottom:24px}
  .slide h2{font:400 30px/1.2 'Instrument Serif',Georgia,serif;margin:0 0 4px}
  .slide header p{color:var(--muted);margin:0}
  figure{margin:0;overflow-x:auto}
  svg{max-width:100%;height:auto}
  footer{margin-top:24px;font:12px ui-monospace,monospace;color:var(--muted)}
  /* Presentation mode is opt-in and additive: without it the deck is a document. */
  body.presenting .slide{display:none;min-height:100vh;place-content:center;border:0}
  body.presenting .slide.is-current{display:grid}
  body.presenting .deck-title{display:none}
  .deck-controls{position:fixed;right:24px;bottom:24px;display:flex;gap:8px;font:12px ui-monospace,monospace}
  .deck-controls button{padding:8px 12px;border:1px solid var(--hair);background:var(--paper);color:inherit;cursor:pointer}
  @media print{.deck-controls{display:none}.slide{page-break-after:always;border:0}}
</style>
</head>
<body>
<div class="deck-title"><h1>${esc(normalised.title)}</h1>${normalised.description ? `<p>${esc(normalised.description)}</p>` : ""}</div>
${slides}
<div class="deck-controls"><button data-deck="present">Present</button><button data-deck="prev" hidden>←</button><button data-deck="next" hidden>→</button></div>
<script>
(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const controls = document.querySelector(".deck-controls");
  let index = 0;
  let presenting = false;

  const show = () => {
    slides.forEach((slide, i) => slide.classList.toggle("is-current", i === index));
  };
  const setMode = (on) => {
    presenting = on;
    document.body.classList.toggle("presenting", on);
    controls.querySelector("[data-deck=prev]").hidden = !on;
    controls.querySelector("[data-deck=next]").hidden = !on;
    controls.querySelector("[data-deck=present]").textContent = on ? "Exit" : "Present";
    if (on) show();
  };
  const step = (delta) => {
    index = Math.max(0, Math.min(slides.length - 1, index + delta));
    show();
  };

  controls.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.deck;
    if (action === "present") setMode(!presenting);
    if (action === "next") step(1);
    if (action === "prev") step(-1);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") return setMode(false);
    if (!presenting) return;
    if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); step(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
  });
})();
</script>
</body>
</html>
`;
}
