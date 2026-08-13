# Changelog

## 2.0.0

A rewrite. Version 1 declared 31 diagram types but rendered 17 of them
identically, drew diagonal connectors through nodes, sized every box at a fixed
88 px, and printed content that was not in the model. This release replaces the
renderer with a layout engine and puts the rules under CI.

### Added

**Engine**
- Deterministic text metrics: node size is derived from measured, wrapped text,
  so a label cannot clip and the studio, the CLI, the tests and the MCP server
  all agree on geometry byte-for-byte.
- Orthogonal connector router with port allocation, candidate scoring, obstacle
  avoidance and an A\* visibility-lattice fallback. A connector never crosses a
  node it does not belong to.
- Layered (Sugiyama-style), tidy-tree, radial and band layout algorithms.

**Types** — 43, each with its own layout and drawing rules
- C4 context and container, Wardley map, fishbone, value stream, service
  blueprint, kanban, sankey, treemap, heatmap, waterfall, stacked bar, plus the
  original set rebuilt.

**Design**
- A `plate` default skin: cool vellum, graphite ink, raw sienna focal. Nine
  audited palettes.
- Extended token set — `paper2`, `soft`, `accentTint`, `link`, series colours.
- Accent nodes are tinted cards behind an accent border rather than solid blocks.
- Opt-in plate furniture exposing the real 4 px module.
- Terminal and sketchy style variants; annotations; an opt-in motion contract
  with a stepped mode that keeps working with JavaScript disabled.

**Accessibility**
- WCAG 2.1 contrast engine with hue-preserving repair, twelve audited pairs per
  palette, and four colour-vision simulations.
- Accessible-name ids namespaced per render, so two diagrams can share a page.

**Import and export**
- Ten Mermaid diagram types; draw.io including its compressed payload.
- A fidelity ledger on every import, stored in `provenance`.
- Round-trip export to Mermaid, draw.io and the `.ds` language, plus PowerPoint
  with real editable shapes, Excalidraw, React, a custom element, a Figma-ready
  flat SVG, ASCII, decks and an accessibility report.

**Tooling**
- A CLI and a dependency-free MCP server sharing the engine.
- The `.ds` diagram language, round-tripping exactly.
- Accountable simplification, stable redraw, and a visual project diff.
- 127 icons: 56 original concept glyphs and 71 product marks (simple-icons, CC0).

**Editor**
- Multi-select, alignment and distribution, snapping guides, command palette,
  presentation mode, undo that treats a drag as one action.

**Checks** — 218 tests and six verifiers, on Linux, Windows and macOS
- Fails the build on: content outside the canvas, overlapping nodes, a diagonal
  or node-crossing connector, geometry off the 4 px grid, truncated or
  hard-broken labels, a contrast pair below target, a missing accessible name, a
  shadow or gradient, a literal colour outside the token set, an over-budget
  accent count, a stale reference page or example, an example that would make a
  network request, and an import that no longer renders.

### Fixed

- Seventeen of the declared types shared one generic renderer.
- Connectors were straight diagonals with no routing.
- The background rect hardcoded 1200×760 while the viewBox followed the model.
- `aria-labelledby` used fixed ids, so two diagrams on a page collided.
- Nodes were a fixed 88 px tall regardless of content, clipping labels.
- Tree parents were assigned by `floor(i / 2)`, producing wrong hierarchies.
- Dragging a node was not undoable; connections could not be edited or deleted.
- Sizing and drawing disagreed about shape padding, so stadium, diamond and
  hexagon nodes hard-broke single words mid-word.
- Rendering was scheduled on `requestAnimationFrame` alone, so a tab that was
  not compositing never drew the canvas at all.
- Brand extraction took the first two hex values it found, ignoring CSS custom
  properties, `rgb()`, `hsl()` and `oklch()`, and never checked contrast.
- Compressed draw.io files were rejected with an instruction to re-save them.
- A project saved before a theme role existed rendered that role as
  `transparent` on load.

### Removed

- Content no renderer should ever have drawn: a hardcoded `SHARED MEMORY` hub
  label, `HIGH VALUE` / `HIGH EFFORT` axes on every quadrant, invented Gantt
  durations, scatter points positioned by `(index * 151) % 760`, and
  `Double-click to edit` shipped into exported files as a sublabel.
- Three Google Fonts requests from the studio. It now uses the same stacks as
  every export, so what you see is what the file will show.

### Not included, deliberately

- **APCA contrast.** Its constants have moved across draft revisions; shipping a
  version that cannot be checked against the spec would give false confidence in
  a number people rely on. WCAG 2.1 only.
- **Vector PDF.** The PDF export is a high-resolution raster in a PDF wrapper
  and says so. When selectable text matters, place the SVG.
- **AWS, Azure, Slack, Tableau, Power BI, OpenAI, Twilio, SendGrid, Heroku, dbt
  and SonarQube marks.** Removed from the upstream CC0 set at the trademark
  owners' request, and not sourced from anywhere else.
