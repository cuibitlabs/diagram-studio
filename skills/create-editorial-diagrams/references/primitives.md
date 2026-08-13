# Primitives

The parts a diagram is built from, and the rules for each.

## Shape

Shape is semantic, not decorative. It is the reason a diagram still works in greyscale, in a photocopy, and for a reader who cannot separate the accent from the ink.

| Role | Shape | Means |
| --- | --- | --- |
| _(none)_ | rounded box | a component |
| `store` | cylinder | data at rest |
| `decision` | diamond | a branch with labelled outcomes |
| `terminal`, `actor`, `state` | stadium | a start, an end, or a person |
| `gateway`, `security` | hexagon | a control point |
| `input`, `output` | parallelogram | data crossing the boundary |
| `event` | circle | a moment |
| `external` | dashed stadium | outside your control |
| `legacy`, `optional` | dashed box | present but not the subject |
| `note` | folded corner | commentary, not a component |
| `document` | waved base | a produced artefact |

Set `role` and let the shape follow; set `shape` directly only when the role would be misleading.

## Icons

44 original glyphs, one weight, one optical size, drawn for this system — so there is no attribution surface and no visual mismatch between a vendored set and the diagram around it. Only the icons a diagram actually uses are emitted into its SVG.

Icons are **decorative**. Every node carrying one also carries its label, and no meaning depends on recognising a glyph. Use them to speed up scanning of a familiar landscape, not to replace words.

```ds
gateway: gateway "API gateway" #gateway
store: store "Order store" #database
```

Names: people and access (`user`, `users`, `key`, `lock`, `shield`, `identity`), compute (`server`, `cloud`, `container`, `cluster`, `function`, `terminal`, `robot`, `code`), data (`database`, `table`, `file`, `folder`, `archive`, `queue`, `cache`, `pipeline`, `stream`), interface (`browser`, `mobile`, `desktop`, `form`, `search`, `mail`, `bell`), network (`globe`, `network`, `firewall`, `balancer`, `gateway`, `cdn`), process (`clock`, `refresh`, `bolt`, `gear`, `branch`, `merge`, `package`, `deploy`), analysis (`chart`, `trend`, `target`, `warning`, `check`, `cross`).

## Annotations

Authored commentary, kept out of the node model so it can never be mistaken for part of the system being described. Notes sit in the margin with a thin leader to whatever they are about.

```json
"annotations": [
  { "id": "a1", "text": "Retries are decided here.", "target": "node-3" }
]
```

Use an annotation for the thing a reader will ask about. Do not use one to apologise for a diagram that is too complicated — simplify instead.

## Style variants

Applied to the content group, so a variant can redefine the fonts the root sets.

**`editorial`** (default) — the system described in `visual-system.md`.

**`terminal`** — monospace throughout, unfilled shapes, the accent carried by stroke rather than fill. For engineering documentation that sits beside code, and for anything that will be read on a dark terminal background.

**`sketchy`** — a turbulence displacement filter, not a blur or a shadow. For work in progress, where a polished diagram would imply more certainty than exists. Use it deliberately: a sketchy diagram in a final document reads as carelessness rather than as humility.

```ds
architecture "Draft topology"
style sketchy
```

## ASCII

`diagram-studio convert project.json out.txt` renders a real character grid — box-drawing glyphs, routed connectors, arrowheads — from the same layout the SVG uses. The cell size scales to the requested width rather than clipping, so no node is silently dropped.

For a README, a commit message, an issue, or a terminal where SVG is useless. Labelled connections are listed underneath, because a character grid cannot carry edge labels legibly.
