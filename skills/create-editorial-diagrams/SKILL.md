---
name: create-editorial-diagrams
description: Create, redesign, import, validate, and export polished editorial diagrams for documents, websites, slides, social posts, and technical communication. Use for architecture diagrams, flowcharts, sequence and state diagrams, ER models, timelines, swimlanes, quadrants, trees, org charts, Venn diagrams, layers, pyramids, matrices, radar charts, loops, data flows, network and deployment views, roadmaps, journeys, charts, Mermaid or draw.io redraws, brand-matched diagram systems, and SVG, HTML, PNG, or PDF diagram deliverables.
---

# Create editorial diagrams

Turn source material into the smallest diagram that makes the relationship clearer than prose. Produce accessible, editable SVG first. Keep the visual hierarchy deliberate and the output suited to its destination.

## Workflow

1. Identify the communication job, audience, destination, and source fidelity required.
2. Choose the diagram type using [diagram-types.md](references/diagram-types.md). Do not default to a flowchart when another structure communicates the relationship better.
3. If the source is Mermaid or draw.io, read [import-export.md](references/import-export.md) and use `scripts/diagram_tool.py` when its deterministic importer applies.
4. Choose size and detail with [output-spec.md](references/output-spec.md).
5. Apply the visual system in [visual-system.md](references/visual-system.md). If a brand source is provided, map its tokens before drawing.
6. Build a versioned project model or a self-contained HTML/SVG deliverable. Start from `assets/editorial-template.html` when a standalone file is useful.
7. Validate semantics, layout, accessibility, and export integrity. Run the deterministic validator for `.diagram.json` projects.
8. Deliver the requested formats and a short fidelity note for imports or simplifications.

## Composition rules

- Make the reading order obvious in three seconds.
- Reserve the accent for one or two focal elements.
- Target a density of 4/10. Remove decorations and repeated labels before shrinking text.
- Use 4 px geometry increments, 1 px hairlines, and restrained corner radii.
- Keep primary labels at least 14 px for documents and 16 px for projected slides.
- Use direct connector paths. Avoid crossings; if unavoidable, reroute or regroup.
- Write labels in audience language. Preserve technical detail in sublabels, not in every headline.
- Use monospaced type only for code, IDs, ports, field types, and compact metadata.
- Never use shadow, glow, glossy gradients, random icons, or color as the only carrier of meaning.

## Output contract

For SVG output:

- Include a stable `viewBox`, explicit width and height, and all required styles.
- Set `role="img"` and connect `aria-labelledby` to first-child `<title>` and `<desc>` elements with unique IDs.
- Keep text as text unless the destination requires outlined glyphs.
- Prefix markers, clip paths, filters, and accessible-name IDs per diagram.

For HTML output:

- Make the file self-contained unless the user requests a component or framework integration.
- Include responsive sizing and a neutral page wrapper around the SVG.
- Preserve keyboard or editing interactions only when requested.

For a `.diagram.json` project:

- Use `version`, `type`, `title`, `description`, `width`, `height`, `theme`, `nodes`, `edges`, and `settings`.
- Give every node and edge a unique stable ID.
- Store semantic relations in `edges`, never infer them only from coordinates.
- Validate with:

```bash
python3 scripts/diagram_tool.py validate path/to/project.diagram.json
```

## Brand matching

Extract or infer semantic roles rather than copying arbitrary colors:

| Source role | Diagram role |
| --- | --- |
| Page background | `paper` |
| Card or surface | `panel` |
| Main text | `ink` |
| Secondary text | `muted` |
| Primary CTA or link | `accent` |
| Secondary brand cue | `accent2` |
| Borders and rules | `line` |

Check normal-size text contrast. If the provided palette fails, adjust the ink or paper while preserving hue and explain the accessibility correction.

## Import fidelity

Treat imports as editorial redraws, not blind format conversions. Preserve the source meaning and critical paths. Simplify only when the requested detail level permits it. End with a short ledger such as:

```text
Detail: balanced · 14 source nodes → 9 drawn
Collapsed: duplicate retry branches → one labelled feedback edge
Dropped: unconnected implementation note
Preserved: sign-in and payment paths
```

## Tool portability

This skill is model- and IDE-independent. Use the same workflow in any agent that can read Markdown and local resources. Read [agent-portability.md](references/agent-portability.md) when packaging the skill for another AI coding tool or repository convention.
