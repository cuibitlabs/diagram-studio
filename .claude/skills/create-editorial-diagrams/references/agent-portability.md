# Agent portability

Use `SKILL.md` as the canonical instructions. Keep tool-specific adapters thin and point them back to the canonical skill resources.

| Tool family | Repository entry point |
| --- | --- |
| OpenAI Codex and AGENTS-compatible tools | `AGENTS.md` plus the skill directory |
| Claude Code | `CLAUDE.md` or `.claude/skills/<name>/SKILL.md` |
| Gemini CLI | `GEMINI.md` or `.gemini/skills/<name>/SKILL.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursor/rules/<name>.mdc` |
| Windsurf | `.windsurf/rules/<name>.md` |
| Cline | `.clinerules/<name>.md` |
| Continue | `.continue/rules/<name>.md` |
| Roo Code | `.roo/rules/<name>.md` |
| Other coding agents | `AGENTS.md`, `SKILL.md`, or a Markdown rule that references them |

Do not claim identical native skill support across every tool. The universal fallback is a short repository instruction telling the agent when to load the canonical `SKILL.md` and its relevant references.

Keep generated adapters synchronized from one core instruction. Avoid duplicating the full visual system into every always-loaded rule because it wastes context and becomes stale.
