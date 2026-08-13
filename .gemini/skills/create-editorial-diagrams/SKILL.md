---
name: create-editorial-diagrams
description: Create, redesign, import, validate, and export polished editorial diagrams for documents, websites, slides, social posts, and technical communication. Use for architecture diagrams, flowcharts, sequence and state diagrams, ER models, timelines, swimlanes, quadrants, trees, org charts, Venn diagrams, layers, pyramids, matrices, radar charts, loops, data flows, network and deployment views, roadmaps, journeys, charts, Mermaid or draw.io redraws, brand-matched diagram systems, and SVG, HTML, PNG, PDF, ASCII or diagram-language deliverables.
---

# Create editorial diagrams

Turn source material into the smallest diagram that makes the relationship clearer than prose. Produce accessible, editable SVG first. Keep the visual hierarchy deliberate and the output suited to its destination.

The layout engine is deterministic and shared by the browser studio, the CLI and the MCP server, so a diagram you generate is byte-identical to the one a person opens and edits. Do not hand-write SVG when a tool call will produce it.

## Workflow

1. Identify the communication job, the audience, the destination, and the source fidelity required.
2. Choose the structure from [diagram-types.md](references/diagram-types.md), then read that type's own reference. Each one states when the form is **wrong** as well as when it is right. Do not default to a flowchart.
3. If behaviour rather than shape drives the meaning — fan-in, governance, a trust boundary, a feedback loop — read [semantic-patterns.md](references/semantic-patterns.md) first; it may change the type.
4. For a Mermaid or draw.io source, read [import-export.md](references/import-export.md) and import it rather than retyping it. Compressed draw.io files are handled.
5. Choose size and detail with [output-spec.md](references/output-spec.md).
6. Apply the system in [visual-system.md](references/visual-system.md). With a brand source, map its tokens before drawing and let the contrast repair run.
7. Build the diagram. Prefer the `.ds` language or a `.diagram.json` project over hand-authored markup; both round-trip.
8. Validate: `diagram-studio audit project.diagram.json` reports contrast, composition budget and import fidelity in one pass.
9. Deliver the requested formats, and pass on the fidelity ledger for any import or simplification.

## Composition rules

- Make the reading order obvious in three seconds.
- Reserve the accent for **at most two** elements.
- Budget: **nine nodes, twelve connections**. Beyond that, split into an overview plus a detail diagram.
- Target a density of 4/10. Remove decoration and repeated labels before shrinking text.
- 4 px geometry increments, 1 px hairlines, restrained corner radii.
- Primary labels at least 14 px for documents and 16 px for projected slides.
- Connectors are orthogonal elbows with rounded corners. Diagonals are allowed only in the radial and chart families, where a bend would imply routing that is not part of the meaning.
- Write labels in the audience's language. Technical detail belongs in sublabels, not in every headline.
- Monospace only for code, IDs, ports, field types and compact metadata.
- Never use shadow, glow, glossy gradients, random icons, or colour as the only carrier of meaning. Shape and dash pattern carry role, so a diagram survives greyscale.

## Never invent content

A renderer draws what the model contains and nothing else.

- A chart with a missing value shows a gap and a note, never a zero.
- A funnel is proportional only when every level has a value.
- A journey draws its sentiment line only when sentiment was measured.
- A Gantt task without a start and duration is listed as unscheduled.
- A loop's hub is labelled only if the model has a hub label.
- Axis names come from the model.

If the source does not contain a number, do not draw one.

## Output contract

**SVG** — stable `viewBox`, explicit width and height, `role="img"`, and `aria-labelledby` pointing at `<title>`/`<desc>` whose ids are prefixed per render so two diagrams can share a page. Text stays text. Markers, filters and icon symbols are namespaced.

**HTML** — self-contained, no network requests, the description carried as a `<figcaption>`.

**`.diagram.json`** — `version`, `type`, `title`, `description`, `width`, `height`, `theme`, `nodes`, `edges`, `settings`, and optionally `groups`, `axes`, `lanes`, `horizons`, `hub`, `annotations`, `provenance`. Every node and edge has a stable unique id. Semantic relationships live in `edges`; never infer them from coordinates.

**`.ds`** — the diagram language: the same model in a form a reviewer can read a diff of. See [diagram-language.md](references/diagram-language.md).

**ASCII** — `diagram-studio convert project.json out.txt` for a README or a terminal.

Validate with:

```bash
diagram-studio validate path/to/project.diagram.json
diagram-studio audit path/to/project.diagram.json
```

## Brand matching

Extract semantic roles rather than copying arbitrary colours:

| Source role | Diagram role |
| --- | --- |
| Page background | `paper` |
| Card or surface | `panel` |
| Main text | `ink` |
| Secondary text | `muted` |
| Primary CTA or link | `accent` |
| Secondary brand cue | `accent2` |
| Borders and rules | `line` |

Design tokens (`--brand-primary`, `--surface-card`) are trusted over ad-hoc values, and colours are classified by saturation, lightness and frequency rather than document order. Anything failing contrast is repaired with the hue preserved, backgrounds are never moved, and every adjustment is reported. See [onboarding.md](references/onboarding.md).

## Import fidelity

Treat imports as editorial redraws, not blind conversions. Preserve the source meaning and the critical paths. Simplify only as far as the requested detail level allows, and end with the ledger:

```text
Detail: balanced · 14 source nodes → 9 drawn
Collapsed: duplicate retry branches → one labelled feedback edge
Dropped: unconnected implementation note
Preserved: sign-in and payment paths
```

`diagram-studio simplify` produces this ledger for you and writes it into `provenance`. When a source changes, use `import --onto` so the layout the author settled on survives.

## Style and motion

Default output is static and editorial. [primitives.md](references/primitives.md) covers the terminal and sketchy variants, icons, and annotations. [motion.md](references/motion.md) covers the opt-in reveal and loop animations and the reduced-motion contract. Motion is never on by default and never carries meaning on its own.

## Tool portability

This skill is model- and IDE-independent. Use the same workflow in any agent that can read Markdown and run a command. Read [agent-portability.md](references/agent-portability.md) when packaging it for another tool, and prefer the MCP server (`diagram-studio-mcp`) where the agent supports it.
