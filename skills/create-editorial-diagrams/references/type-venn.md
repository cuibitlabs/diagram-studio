# Venn

> Set overlap and the value that lives in the intersection

- **Family:** `set`
- **Type id:** `venn`
- **Starter size:** 704×728 px, 3 nodes, 0 connections

## Use it for

Two or three sets and the value in the overlap.

## Do not use it for

Four or more sets — unreadable. Use a matrix.

## Composition rules

- Labels sit outside the circles.
- Intersection text comes from the model; an unlabelled centre stays empty.

## The mistake people make

Filling the centre with a platitude.

## Model fields this type reads

Node: `fixedSize`, `sublabel`

Diagram: `overlaps`

## Starter content

```ds
venn "Venn overview"
theme plate
describe "Set overlap and the value that lives in the intersection"

desirable "Desirable" / "People want it"
viable "Viable" / "The business can sustain it"
feasible "Feasible" / "We can build it"
```

## As Mermaid

> Mermaid cannot express a venn. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Venn overview
%% Mermaid cannot express a venn. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Desirable · People want it"]
  N2["Viable · The business can sustain it"]
  N3["Feasible · We can build it"]
```

## Build one

```bash
diagram-studio create venn -o venn.svg
```

Rendered examples: [`docs/gallery/venn-light.svg`](../../../docs/gallery/venn-light.svg) · [dark](../../../docs/gallery/venn-dark.svg)
