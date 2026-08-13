# Current state

> Legacy landscape with its constraints made explicit

- **Family:** `layered`
- **Type id:** `current-state`
- **Starter size:** 1496×480 px, 5 nodes, 4 connections
- **Default direction:** LR

## Use it for

Making an existing landscape and its constraints undeniable before proposing a change.

## Do not use it for

Presenting the target state. Draw both, side by side, and label which is which.

## Composition rules

- Legacy elements are dashed and recede; the constraint is written next to the element that causes it.
- Name the pain in the constraint text, not in the node label.

## The mistake people make

Editorialising in the labels. Let the constraints do the arguing.

## Model fields this type reads

Node: `constraint`, `dashed`, `role`, `sublabel`, `tone`

## Starter content

```ds
current-state "Current state overview"
theme plate
describe "Legacy landscape with its constraints made explicit"

channels "Channels" / "Five front doors"
point-solutions: legacy "Point solutions"
legacy-core: legacy "Legacy core" *
data-silos: store "Data silos"
manual-operations "Manual operations"

channels -> point-solutions
point-solutions -> legacy-core
legacy-core -> data-silos
data-silos -> manual-operations
```

## As Mermaid

```
%% Current state overview
flowchart LR
  N1["Channels · Five front doors"]
  N2["Point solutions"]
  N3["Legacy core"]
  N4[("Data silos")]
  N5["Manual operations"]
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

## Build one

```bash
diagram-studio create current-state -o current-state.svg
```

Rendered examples: [`docs/gallery/current-state-light.svg`](../../../docs/gallery/current-state-light.svg) · [dark](../../../docs/gallery/current-state-dark.svg)
