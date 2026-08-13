# Diagram Studio

An editorial diagram system for people and for coding agents. One deterministic layout engine behind three front ends — a browser studio, a command-line tool and an MCP server — so a diagram an agent generates is byte-identical to the one a person opens and edits.

```bash
npm install
npm run dev            # the studio
npx diagram-studio --help
```

## What it does

- **31 diagram and chart structures**, each with its own layout and drawing rules, not one generic renderer with 31 names.
- **A real layout engine.** Text is measured, so a node is sized by its content and a label cannot clip. Connectors are orthogonal elbows with allocated attach points, obstacle avoidance and an A\* fallback, so a connector never crosses a node it does not belong to. Everything sits on a 4 px grid.
- **It never invents content.** A chart with a missing value shows a gap and a note, not a zero. A funnel is proportional only when every level has a value. A journey draws its sentiment line only when sentiment was measured. A Gantt task without a duration is listed as unscheduled.
- **Accessibility in the product, not the review.** WCAG contrast is audited for nine role pairs per palette at the sizes the type scale uses, failing pairs are shown in the editor, brand colours are repaired with the hue preserved, and four colour-vision types can be simulated. Accessible-name ids are namespaced per render, so two diagrams can share a page.
- **Import that is honest.** Ten Mermaid diagram types, and draw.io including its compressed payload. Every import records a fidelity ledger: source versus drawn counts, what was collapsed, dropped or not representable.
- **Export that survives the hand-off.** SVG, self-contained HTML, PNG, PDF, Mermaid, draw.io, ASCII, the `.ds` language, the editable project — plus PowerPoint as real editable shapes, an Excalidraw scene with bound arrows, a React component, a custom element, and a Figma-ready flat SVG.
- **Review tooling.** A visual diff that draws what was added, removed and edited (removals as ghosts in their old positions), an accessibility report you can hand to a reviewer, and decks that keep one theme across every slide.
- **An editor worth using.** Multi-select, alignment and distribution, live snapping guides, a command palette, presentation mode that reveals by reading order, undo that treats a drag as one action.
- **A language for git.** `.ds` is the same model in a form a reviewer can read a diff of, and it round-trips exactly.

## The studio

```bash
npm run dev
```

Compose from a prompt, pick a structure, import a source, or write `.ds`. Drag with snapping guides, `Ctrl+K` for the command palette, `F5` to present. Everything autosaves locally; nothing leaves the browser.

## The CLI

```bash
diagram-studio create architecture --theme cobalt -o architecture.svg
diagram-studio import platform.drawio -o platform.svg
diagram-studio simplify platform.drawio --level balanced -o simple.svg
diagram-studio import platform.mmd --onto platform.diagram.json -o platform.svg
diagram-studio batch ./docs/diagrams --out ./docs/img --theme moss --variants
diagram-studio audit platform.diagram.json
diagram-studio report platform.diagram.json -o report.html
diagram-studio diff before.json after.json -o diff.svg
diagram-studio deck overview.json detail.json -o review.pptx
diagram-studio convert platform.diagram.json platform.txt
```

Formats in: `.ds .mmd .mermaid .md .drawio .xml .json`.
Formats out: `.ds .svg .html .mmd .drawio .json .txt .pptx .excalidraw .jsx .js`, plus `--flat` for a Figma-ready SVG with resolved styles and named layers.

## With an agent

Register the MCP server and the agent gets typed tools plus the composition budget as server instructions:

```bash
claude mcp add diagram-studio -- node ./bin/mcp-server.mjs
```

Or point any agent at `skills/create-editorial-diagrams/SKILL.md`. Adapters ship for Claude Code, Codex, Gemini CLI, Copilot, Cursor, Windsurf, Cline, Continue, Roo Code, Amazon Q and Aider, plus `AGENTS.md` for everything else.

Example requests:

- "Turn this deployment description into an executive architecture diagram."
- "Redraw `checkout.mmd` for a 16:9 technical presentation."
- "Import `platform.drawio`, simplify it to balanced detail, and export SVG and PNG."
- "Match this diagram to our website and keep WCAG AA contrast."

## Project structure

```text
src/engine/       text metrics, geometry, orthogonal router, layout algorithms
src/types/        one module per diagram type, plus the editorial guidance map
src/render/       SVG shell, skin, shapes, icons, annotations
src/theme/        colour parsing, contrast audit and repair, brand extraction
src/import|export Mermaid, draw.io, ASCII, the diagram language
src/edit/         simplification with a ledger, project diff, stable redraw
src/editor/       selection, snapping, command palette, presentation
bin/              CLI and MCP server
skills/           the agent skill: 31 type references plus 10 guides
scripts/          doc generator, gallery, and five verifiers
docs/gallery/     every type rendered light and dark
```

## Checks

```bash
npm run check      # tests, build and verifiers
```

160+ tests, plus five verifiers that fail the build on: content drawn outside the canvas, overlapping nodes, a diagonal or node-crossing connector, geometry off the 4 px grid, a truncated label, a contrast pair below target, a missing accessible name, a shadow or gradient, a literal colour outside the token set, an over-budget accent count, a stale type reference, and an import that no longer renders.

CI runs all of it on Linux, Windows and macOS.

## Design principles

Diagrams should be sparse, readable, accessible and editable. One or two elements get the accent. Text remains text. Semantic relationships live in the model, never inferred from coordinates. Nothing appears in the picture that is not in the model.

## Acknowledgement

The idea of an agent skill focused on tasteful editorial diagrams was inspired by Cathryn Lavery's MIT-licensed [`diagram-design`](https://github.com/cathrynlavery/diagram-design). Diagram Studio is an original implementation: its own layout engine, editor, project model, importers, exporters, theme system and verifiers. The reference project's copyright and MIT licence are acknowledged in `THIRD_PARTY_NOTICES.md`.

## Licence

MIT. See `LICENSE`.
