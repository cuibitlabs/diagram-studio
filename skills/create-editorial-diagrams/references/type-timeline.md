# Timeline

> Events in order along a single axis

- **Family:** `timeline`
- **Type id:** `timeline`
- **Starter size:** 1336×480 px, 5 nodes, 0 connections

## Use it for

Events in order along a single axis.

## Do not use it for

Work in progress with durations. Use a Gantt.

## Composition rules

- Cards alternate above and below so long labels never collide.
- The axis carries only the marks the model contains — no invented intervals.

## The mistake people make

Even spacing for uneven time. If the gaps matter, say so in the marker text.

## Model fields this type reads

Node: `marker`, `sublabel`, `tone`

## Starter content

```ds
timeline "Timeline overview"
theme plate
describe "Events in order along a single axis"

discovery "Discovery" / "Problem framed with users"
prototype "Prototype" / "Two competing approaches"
pilot "Pilot" / "One region, real traffic" *
launch "Launch" / "All regions"
scale "Scale" / "Second product line"
```

## As Mermaid

> Mermaid cannot express a timeline. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Timeline overview
%% Mermaid cannot express a timeline. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Discovery · Problem framed with users"]
  N2["Prototype · Two competing approaches"]
  N3["Pilot · One region, real traffic"]
  N4["Launch · All regions"]
  N5["Scale · Second product line"]
```

## Build one

```bash
diagram-studio create timeline -o timeline.svg
```

Rendered examples: [`docs/gallery/timeline-light.svg`](../../../docs/gallery/timeline-light.svg) · [dark](../../../docs/gallery/timeline-dark.svg)
