# 5. Imports are redraws, and say so

**Status:** accepted

## Context

Importing a Mermaid or draw.io file into an editorial system always loses something. Mermaid has no concept of a semantic role beyond its shape syntax; draw.io has styling this system deliberately does not honour; both can express structures with no equivalent here.

The tempting behaviour is to import silently and present the result as the same diagram. That is how a reader ends up believing a redrawn architecture still shows every service the original did.

## Decision

Every import writes a ledger into `diagram.provenance`:

```json
{
  "format": "mermaid",
  "header": "flowchart",
  "sourceNodes": 14,
  "drawnNodes": 9,
  "collapsed": ["duplicate retry branches → one labelled feedback edge"],
  "dropped": ["Handover (no duration in the source)"],
  "unsupported": ["alt", "note"]
}
```

The CLI prints it, the studio shows it in the status bar, the MCP tool appends it to its result, and `simplify` adds its own actions to the same record. Export to Mermaid states in a header comment what the target format cannot carry.

## Consequences

- Importers are more work: every branch that skips something has to record it.
- `provenance` is part of the project format and survives a save, so the ledger is still there weeks later.
- The honest answer to "is this the same diagram?" is available without re-reading the source.
