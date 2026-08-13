# Scatter plot

> Distribution and correlation across two measures

- **Family:** `chart`
- **Type id:** `scatter`
- **Starter size:** 1024×768 px, 6 nodes, 0 connections

## Use it for

Distribution and correlation across two measures.

## Do not use it for

Fewer than eight points. A table is clearer.

## Composition rules

- Both coordinates are data; nothing is positioned by index.
- Points missing a coordinate are listed under the plot, not placed somewhere plausible.

## The mistake people make

Drawing a trend line the data does not support.

## Model fields this type reads

Node: `fixedSize`, `px`, `py`, `tone`

Diagram: `axes`

## Starter content

```ds
scatter "Scatter plot overview"
theme plate
describe "Distribution and correlation across two measures"
axis x "Adoption" "" ""
axis y "Satisfaction" "" ""

alpha "Alpha"
beta "Beta"
gamma "Gamma"
delta "Delta" *
epsilon "Epsilon"
zeta "Zeta"
```

## As Mermaid

> Mermaid cannot express a scatter plot. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Scatter plot overview
%% Mermaid cannot express a scatter plot. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Alpha"]
  N2["Beta"]
  N3["Gamma"]
  N4["Delta"]
  N5["Epsilon"]
  N6["Zeta"]
```

## Build one

```bash
diagram-studio create scatter -o scatter.svg
```

Rendered examples: [`docs/gallery/scatter-light.svg`](../../../docs/gallery/scatter-light.svg) · [dark](../../../docs/gallery/scatter-dark.svg)
