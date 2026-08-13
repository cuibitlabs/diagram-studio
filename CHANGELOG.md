# Changelog

## 0.1.0 — first release

Diagrams as code, with a layout engine rather than a template.

`0.x` is deliberate. The engine, the CLI and the MCP tools are covered by 218
tests and six verifiers, but the `.diagram.json` schema and the `.ds` grammar
have not been through contact with anyone else's diagrams yet. Expect additive
change, and read the changelog before upgrading until this reaches `1.0`.

### The engine

- **Measured text.** Node size is derived from wrapped, measured text, so a
  label cannot clip. Measurement uses a fixed metric table rather than a loaded
  font, which is what lets the browser studio, the CLI, the tests and the MCP
  server agree on geometry byte-for-byte.
- **Orthogonal connector routing** with port allocation, candidate scoring,
  obstacle avoidance and an A\* visibility-lattice fallback. A connector never
  crosses a node it does not belong to.
- **Layout algorithms**: layered (Sugiyama-style), tidy tree, radial and band.
- Every coordinate on a 4 px module.

### 43 diagram types

Architecture, C4 context and container, high-level, current state, flowchart,
process, state machine, sequence, data flow, deployment, network, ER, swimlane,
service blueprint, value stream, kanban, tree, org chart, nested, mind map,
loop, layers, medallion, pyramid, timeline, roadmap, journey, quadrant, matrix,
Wardley, fishbone, Venn, radar, bar, line, scatter, stacked bar, waterfall,
sankey, treemap, heatmap, gantt.

Each is its own renderer with its own rules, and each has a reference page that
states when the form is **wrong** as well as when it is right.

### Nothing is invented

The rule the whole project is built around. A chart with a missing value shows a
gap and a note, never a zero. A funnel is proportional only when every level has
a value. A journey draws its sentiment line only when sentiment was measured. A
Gantt task without a duration is listed as unscheduled. An unplaced Wardley
component, a valueless Sankey flow and an empty heatmap cell are all reported
rather than guessed at, and a waterfall shows the sum when the parts disagree
with the stated total.

### Design

- A `plate` default skin — cool vellum, graphite ink, raw sienna focal —
  chosen against the cream-paper-and-terracotta look that arrives with most
  generated design.
- Nine audited palettes; twelve contrast pairs checked per palette.
- Accent nodes are tinted cards behind an accent border, not solid blocks.
- Shape carries semantic role, so a diagram survives greyscale.
- Terminal and sketchy style variants, annotations, opt-in plate furniture, and
  an opt-in motion contract whose stepped mode still works with JavaScript
  disabled.

### Accessibility

- WCAG 2.1 contrast engine with hue-preserving repair.
- Failing pairs surfaced in the editor and in `diagram-studio audit`.
- Four colour-vision simulations.
- Accessible-name ids namespaced per render, so two diagrams can share a page.
- An exportable accessibility report: contrast table, reading order, alt text.

### Import and export

- **In**: ten Mermaid diagram types, draw.io including its compressed payload,
  the `.ds` language, and saved projects.
- **Out**: SVG, self-contained HTML, PNG, PDF, Mermaid, draw.io, ASCII, `.ds`,
  PowerPoint with real editable shapes, Excalidraw with bound arrows, a React
  component, a custom element, and a Figma-ready flat SVG.
- Every import records a **fidelity ledger** in `provenance`: source versus
  drawn counts, and what was collapsed, dropped or not representable.

### Tooling

- A CLI and a dependency-free MCP server sharing the engine.
- Accountable simplification, stable redraw when a source changes, and a visual
  project diff.
- 127 icons: 56 original concept glyphs and 71 product marks (simple-icons, CC0).
- Editor: multi-select, alignment and distribution, snapping guides, command
  palette, presentation mode, undo that treats a drag as one action.

### Checks

218 tests and six verifiers, on Linux, Windows and macOS. The build fails on:
content outside the canvas, overlapping nodes, a diagonal or node-crossing
connector, geometry off the module, truncated or hard-broken labels, a contrast
pair below target, a missing accessible name, a shadow or gradient, a literal
colour outside the token set, an over-budget accent count, a stale reference
page or example, an example that would make a network request, and an import
that no longer renders.

### Not included, deliberately

- **APCA contrast.** Its constants have moved across draft revisions; shipping a
  version that cannot be checked against the spec would give false confidence in
  a number people rely on. WCAG 2.1 only.
- **Vector PDF.** The PDF export is a high-resolution raster in a PDF wrapper,
  and says so. When selectable text matters, place the SVG instead.
- **AWS, Azure, Slack, Tableau, Power BI, OpenAI, Twilio, SendGrid, Heroku, dbt
  and SonarQube marks.** Removed from the upstream CC0 icon set at the trademark
  owners' request, and not sourced from anywhere else. `UNAVAILABLE_MARKS` maps
  each to the concept icon to use instead.

### Known limits

- The PDF caveat above.
- Mermaid export is lossy for the measurement types, which the writer states in
  a header comment rather than emitting a lossy file quietly.
- The MCP server is tested against a scripted client covering handshake,
  negotiation, notifications, batches, probes and tool errors — not against
  every IDE listed in `adapters/MCP.md`.

### Background

This grew out of an internal prototype that declared 31 diagram types but
rendered 17 of them identically, drew straight diagonal connectors through
nodes, fixed every node at 88 px tall, and printed content that was in no
model — a hardcoded hub label, fixed quadrant axis names, invented Gantt
durations and scatter points positioned by `(index * 151) % 760`. None of that
was ever released. It is recorded here because the verifiers exist to make that
class of defect impossible to reintroduce, and that is easier to understand with
the original in view.
