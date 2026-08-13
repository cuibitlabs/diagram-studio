# Sankey

> Where a quantity goes, drawn to scale

- **Family:** `chart`
- **Type id:** `sankey`
- **Starter size:** 1296×768 px, 6 nodes, 6 connections

## Use it for

Showing where a quantity actually goes.

## Do not use it for

Flows you cannot measure. Thickness is a number, so an unmeasured flow cannot be drawn.

## Composition rules

- A band's thickness is its value; a node's height is the greater of in and out.
- Where in and out disagree the imbalance is named rather than smoothed.
- Keep to three or four columns — ribbons cross badly beyond that.

## The mistake people make

Using it for a process. A Sankey answers 'how much', never 'in what order'.

## Model fields this type reads

Node: `fixedSize`, `tone`

Diagram: `unit`

## Starter content

```ds
sankey "Sankey overview"
theme plate
describe "Where a quantity goes, drawn to scale"
unit "accounts"

trial-signups "Trial signups"
activated "Activated"
lapsed "Lapsed"
paid "Paid"
churned "Churned" *
retained "Retained"

trial-signups -> activated
trial-signups -> lapsed
activated -> paid
activated -> lapsed
paid -> churned
paid -> retained
```

## As Mermaid

> Mermaid cannot express a sankey. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Sankey overview
%% Mermaid cannot express a sankey. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Trial signups"]
  N2["Activated"]
  N3["Lapsed"]
  N4["Paid"]
  N5["Churned"]
  N6["Retained"]
  N1 --> N2
  N1 --> N3
  N2 --> N4
  N2 --> N3
  N4 --> N5
  N4 --> N6
```

## Build one

```bash
diagram-studio create sankey -o sankey.svg
```

Rendered examples: [`docs/gallery/sankey-light.svg`](../../../docs/gallery/sankey-light.svg) · [dark](../../../docs/gallery/sankey-dark.svg)
