# AI coding tool support

`AGENTS.md` is the universal entry point. The current AGENTS.md ecosystem includes Codex, Jules, Factory, Aider, Goose, OpenCode, Zed, Warp, VS Code, Devin, UiPath, JetBrains Junie, Amp, Cursor, Roo Code, Gemini CLI, Kilo Code, Phoenix, Semgrep, GitHub Copilot, Ona, Windsurf, and Augment Code. Tools without direct AGENTS.md discovery can use one of the thin native adapters below.

| Tool | Included adapter |
| --- | --- |
| Codex and AGENTS-compatible agents | `AGENTS.md` |
| Claude Code | `CLAUDE.md` and `.claude/skills/create-editorial-diagrams/` |
| Gemini CLI | `GEMINI.md`, `.gemini/settings.json`, and `.gemini/skills/create-editorial-diagrams/` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursor/rules/diagram-studio.mdc` |
| Windsurf | `.windsurf/rules/diagram-studio.md` |
| Cline | `.clinerules/diagram-studio.md` |
| Continue | `.continue/rules/diagram-studio.md` |
| Roo Code | `.roo/rules/diagram-studio.md` |
| Amazon Q Developer | `.amazonq/rules/diagram-studio.md` |
| Aider | `.aider.conf.yml` |
| Any Markdown-context agent | Read `skills/create-editorial-diagrams/SKILL.md` |

Run `npm run sync:adapters` after changing the canonical skill. Thin rules deliberately reference the canonical skill so the detailed design system stays synchronized.
