# Agent portability

The skill is Markdown plus a command-line tool, so it works in any agent that can read files and run a process. Nothing here depends on a particular model or IDE.

## The three ways to use it

**1. MCP (best, where supported).** The agent gets typed tools and the composition budget as server instructions, so it does not have to remember them.

```bash
claude mcp add diagram-studio -- node /path/to/diagram-studio/bin/mcp-server.mjs
```

Tools: `list_diagram_types`, `create_diagram`, `import_diagram`, `render_diagram`, `audit_diagram`, `extract_brand`. Tool errors come back in band, so a bad project is a recoverable message rather than a crashed server.

**2. CLI.** Anything that can run a shell command.

```bash
diagram-studio create architecture --prompt "checkout platform" -o out.svg
diagram-studio import notes.mmd -o notes.svg
diagram-studio audit out.diagram.json
```

**3. Reading the skill.** Point the agent at `SKILL.md` and let it write `.ds` or `.diagram.json`, then render with the CLI. This is the fallback when neither of the above is available — but let the engine do the layout. Hand-authored SVG will not obey the geometry, contrast or routing rules, and the verifiers will say so.

## Packaging for another tool

`npm run sync:adapters` copies the skill into each tool's expected location. Adapters ship for Claude Code, Codex, Gemini CLI, GitHub Copilot, Cursor, Windsurf, Cline, Continue, Roo Code, Amazon Q and Aider, plus `AGENTS.md` for anything that reads it (Jules, Factory, Goose, OpenCode, Zed, Warp, Devin, Junie, Amp, Kilo Code).

For a tool not listed:

1. Copy `skills/create-editorial-diagrams/` wherever that tool looks for skills.
2. Add a rule file pointing at `SKILL.md` for diagram work.
3. Make the CLI available on `PATH`, or register the MCP server.

## What an agent must not do

- **Do not hand-write SVG.** Every rule this system enforces — measured text, orthogonal routing, contrast, namespaced ids, the 4 px grid — is in the engine. Markup written by hand has none of it.
- **Do not invent values.** If the source has no number, the diagram shows no number.
- **Do not present a redraw as a copy.** Pass on the fidelity ledger.
- **Do not exceed the budget silently.** Nine nodes, twelve connections, two accents. Beyond that, split and say why.
- **Do not disable the verifiers to make a build pass.**

## Determinism

The same project produces the same bytes from the studio, the CLI, a test and the MCP server. Text is measured from a fixed metric table rather than from a loaded font, so a font that has not finished loading cannot change exported coordinates. This is what makes agent-generated and human-edited diagrams interchangeable rather than merely similar.
