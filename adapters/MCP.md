# Connecting the MCP server

`bin/mcp-server.mjs` speaks JSON-RPC 2.0 over stdio — the standard MCP transport
— with no dependencies. Any client that speaks MCP over stdio can run it.

Three things are worth knowing before you paste a config:

1. **The key name differs between clients.** Most use `mcpServers`; VS Code uses
   `servers` and wants an explicit `"type": "stdio"`; Zed uses
   `context_servers`. Copying the wrong shape is the usual reason a server
   "doesn't work".
2. **Project configs take relative paths; global configs need absolute ones.**
   A file in your home directory has no idea where the repo is.
3. **stdout carries the protocol.** Do not wrap the command in anything that
   prints — no `npm run`, no shell wrapper that echoes. Call `node` directly.

## Verify it before wiring it up

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node bin/mcp-server.mjs
```

Two JSON lines back means the server is fine and any remaining problem is in the
client's config.

## Claude Code

Project scope — `.mcp.json` at the repo root ships with this repository, so
opening it is enough. Otherwise:

```bash
claude mcp add diagram-studio -- node /absolute/path/to/bin/mcp-server.mjs
```

## Claude Desktop

`claude_desktop_config.json` — macOS
`~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\`:

```json
{
  "mcpServers": {
    "diagram-studio": {
      "command": "node",
      "args": ["/absolute/path/to/bin/mcp-server.mjs"]
    }
  }
}
```

## Cursor

`.cursor/mcp.json` in the project (ships with this repo) or
`~/.cursor/mcp.json` globally with an absolute path. Same shape as Claude
Desktop.

## VS Code — Copilot agent mode

`.vscode/mcp.json` (ships with this repo). Note `servers`, not `mcpServers`:

```json
{
  "servers": {
    "diagram-studio": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/bin/mcp-server.mjs"]
    }
  }
}
```

## Windsurf

`~/.codeium/windsurf/mcp_config.json`, absolute path, `mcpServers` shape.

## Zed

`settings.json` — note `context_servers` and the nested `command` object:

```json
{
  "context_servers": {
    "diagram-studio": {
      "command": {
        "path": "node",
        "args": ["/absolute/path/to/bin/mcp-server.mjs"]
      }
    }
  }
}
```

## Cline / Roo Code

`cline_mcp_settings.json` from the extension's MCP panel, `mcpServers` shape,
absolute path.

## Continue

`config.yaml`:

```yaml
mcpServers:
  - name: diagram-studio
    command: node
    args: ["/absolute/path/to/bin/mcp-server.mjs"]
```

## JetBrains AI Assistant

Settings → Tools → AI Assistant → MCP → add as JSON, same shape as Claude
Desktop, absolute path.

## What the server offers

| Tool | Does |
| --- | --- |
| `list_diagram_types` | the 43 types and the job each does — call this before choosing |
| `create_diagram` | from a type id, or from a prompt |
| `import_diagram` | Mermaid or draw.io, returns the fidelity ledger |
| `render_diagram` | a saved project to SVG, Mermaid, draw.io or normalised JSON |
| `audit_diagram` | contrast, composition budget and provenance |
| `extract_brand` | a site's CSS to a contrast-repaired theme |

The composition budget and the no-invented-values rule are sent as server
instructions, so a client that surfaces them does not need the model to remember.

## Protocol notes

- Revisions spoken: `2025-06-18`, `2025-03-26`, `2024-11-05`. The server answers
  in the revision the client asked for when it is one of these, and in the newest
  otherwise.
- `resources/list`, `prompts/list`, `resources/templates/list`, `ping`,
  `logging/setLevel` and `completion/complete` all answer successfully even
  though no such capability is advertised, because several clients probe for
  them on connect and log an error server otherwise.
- Notifications are never answered.
- JSON-RPC batches are supported.
- Tool failures come back as `isError` content rather than a transport error, so
  a bad argument is something the model can correct rather than a dead session.
- Diagnostics go to stderr. Nothing but protocol is ever written to stdout.

## Honest limits

This has been tested against a scripted client covering handshake, negotiation,
notifications, batches, probes and tool errors — not against every IDE in the
list above. The configs are the documented shapes for each client. If one of
them misbehaves, run the verification command first: it separates a server
problem from a config problem in one step.
