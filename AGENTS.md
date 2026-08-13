# Diagram Studio agent instructions

When the user asks to create, redraw, import, edit, brand, validate, or export a diagram, read `skills/create-editorial-diagrams/SKILL.md` completely. Load only the directly linked reference relevant to the selected diagram type or operation. Use the bundled deterministic script for Mermaid, draw.io, brand, validation, and non-interactive rendering when applicable.

The browser editor lives in `src/`. Keep the versioned project model compatible with `src/model.js` and `skills/create-editorial-diagrams/scripts/diagram_tool.py`. Run `npm run check` after source changes and `python3 test/test_skill_tool.py` after changing the skill script.
