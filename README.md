# Diagram Studio

Diagram Studio is a complete, open-source diagram system for people and AI coding agents. It combines an SVG-native browser editor with a portable agent skill, deterministic import tools, 31 visual structures, brand-aware themes, and exports for the web, documents, and presentations.

## What is included

- Prompt-to-diagram composition with automatic structure selection
- 31 diagram and chart structures
- Drag-and-drop editing, direct labels, inspector controls, connections, themes, grid, zoom, undo, redo, and local autosave
- Mermaid, draw.io XML, and editable `.diagram.json` imports
- Brand extraction from website URLs, local HTML, and CSS
- SVG, PNG, PDF, self-contained HTML, and editable project exports
- A progressive-disclosure skill for diagram reasoning, source fidelity, accessibility, visual design, and format selection
- Native or rule-based adapters for Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, Windsurf, Cline, Continue, Roo Code, and other `AGENTS.md`-compatible agents
- Amazon Q Developer and Aider adapters, plus broad AGENTS.md support for Jules, Factory, Goose, OpenCode, Zed, Warp, Devin, Junie, Amp, Kilo Code, and other participating tools
- Deterministic Python import, validation, brand, render, and optional CairoSVG conversion utilities

## Run the studio

```bash
npm install
npm run dev
```

Production validation:

```bash
npm run check
python3 test/test_skill_tool.py
```

## Use with an AI coding agent

Point your agent at `skills/create-editorial-diagrams/SKILL.md`, or use the included adapter for your tool. Example requests:

- "Turn this deployment description into an executive architecture diagram."
- "Redraw `checkout.mmd` for a 16:9 technical presentation."
- "Import `platform.drawio`, simplify it to balanced detail, and export SVG and PNG."
- "Match this diagram to our website and keep WCAG AA contrast."

## Project structure

```text
src/                          Browser editor, model, renderers, importers, exporters
skills/create-editorial-diagrams/
  SKILL.md                    Canonical agent workflow
  references/                 Type, visual, output, import, and portability guides
  scripts/diagram_tool.py     Deterministic CLI utilities
  assets/                     Standalone diagram scaffold
adapters and rule folders     Thin integrations for major coding agents
examples/                     Mermaid and draw.io fixtures
test/                         JavaScript and Python validation
```

## Design principles

Diagrams should be sparse, readable, accessible, and editable. One or two focal elements receive the accent. Text remains text. Semantic relationships live in the project model instead of being implied only by coordinates.

## Acknowledgment

The idea of an agent skill focused on tasteful editorial diagrams was inspired by Cathryn Lavery's MIT-licensed [`diagram-design`](https://github.com/cathrynlavery/diagram-design) project. Diagram Studio is an original implementation with a visual editor, a versioned project model, interactive editing, additional diagram structures, portable agent adapters, and expanded import and export tooling. The reference project's copyright and MIT license are acknowledged in `THIRD_PARTY_NOTICES.md`.

## License

MIT. See `LICENSE`.
