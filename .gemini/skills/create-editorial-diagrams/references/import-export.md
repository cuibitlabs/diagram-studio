# Import and export

An import is an editorial redraw, not a format conversion. The source meaning survives; the source's visual decisions do not have to.

## Mermaid

Supported headers and what is read from each:

| Header | Becomes | Read |
| --- | --- | --- |
| `flowchart` / `graph` | flowchart | direction, node shape syntax → roles, `\|labels\|`, dotted and thick links, `A & B --> C`, `subgraph` → groups, `classDef`/`class` → accent |
| `sequenceDiagram` | sequence | `participant`/`actor` with aliases, call vs return arrows |
| `stateDiagram-v2` | state | `state "X" as Y`, `A --> B : event`, `[*]` → entry and terminal markers |
| `erDiagram` | ER | entity blocks with types and PK/FK, relationship labels |
| `gantt` | gantt | sections, durations in d/w/h/y → day offsets |
| `journey` | journey | 1–5 scores → a 0–100 sentiment axis |
| `mindmap` | mind map | indentation → hierarchy |
| `quadrantChart` | quadrant | axis names, `[x, y]` coordinates |
| `pie` | bar | drawn as bars: angle is harder to compare than length |
| `timeline` | timeline | periods → markers |

Anything not represented — `alt`/`loop` blocks, notes, `style` directives — is listed in the ledger rather than dropped in silence.

```bash
diagram-studio import architecture.mmd -o architecture.svg
```

## draw.io

Both the plain `<mxGraphModel>` form and the **compressed `<diagram>` payload** are handled in-process; there is no need to re-save the file with compression disabled. Styles map to roles (`shape=cylinder` → store, `rhombus` → decision, `dashed=1` → dashed), and source coordinates are preserved — the file carried deliberate geometry, so it is kept until you ask for a re-layout.

`<!DOCTYPE>` and `<!ENTITY>` are rejected outright, and the 2 MiB / 200-node / 400-edge limits apply.

```bash
diagram-studio import platform.drawio -o platform.svg   # keeps the source layout
diagram-studio import platform.drawio -o p.json         # then "Re-layout" in the studio
```

## The fidelity ledger

Every import records what happened in `diagram.provenance`, and the CLI prints it:

```text
Source: mermaid · flowchart · 14 source nodes → 9 drawn
Collapsed: duplicate retry branches → one labelled feedback edge
Dropped: Handover (no duration in the source)
Not represented: alt, note
```

Pass this on. A redraw presented as a faithful copy is the failure mode this whole tool exists to avoid.

## Simplifying

```bash
diagram-studio simplify platform.drawio --level balanced -o platform.svg
```

| Level | Does |
| --- | --- |
| `light` | merges duplicate labels, folds parallel connections into one labelled edge |
| `balanced` | also removes repeated connections and unconnected decoration |
| `aggressive` | also collapses pass-through nodes into the connection they were forwarding |

A node with a role, sublabel, icon or accent is never collapsed. Every action is written to the ledger.

## Re-importing a changed source

```bash
diagram-studio import platform.mmd --onto platform.diagram.json -o platform.svg
```

Nodes that survived keep their exact positions; new ones are parked below the drawing and reported. A one-line source change becomes a one-node canvas change instead of a full rearrangement.

## Exporting back

```bash
diagram-studio convert project.diagram.json out.mmd      # Mermaid, with a note on what was lost
diagram-studio convert project.diagram.json out.drawio   # uncompressed, diffable
diagram-studio convert project.diagram.json out.ds       # the diagram language
diagram-studio convert project.diagram.json out.txt      # ASCII
```

Mermaid cannot express most of the measurement types. The writer exports the closest honest structure and states the mismatch in a header comment rather than emitting a lossy file quietly.

## Batch

```bash
diagram-studio batch ./docs/diagrams --out ./docs/img --theme cobalt --variants
```

A folder of sources becomes a folder of branded diagrams, light and dark. Failures are reported per file and do not stop the run.
