# Bar chart

> Comparison across categories

- **Family:** `chart`
- **Type id:** `bar`
- **Starter size:** 1104×712 px, 5 nodes, 0 connections

## Use it for

Comparing a value across categories.

## Do not use it for

Change over time with many points — use a line.

## Composition rules

- The scale starts at zero and the maximum is a rounded value above the data, never one chosen to flatter a bar.
- Categories without a value are drawn as a gap and counted in a note, not as zero.

## The mistake people make

Sorting by value when the categories have a natural order.

## Model fields this type reads

Node: `fixedSize`, `tone`, `value`

Diagram: `unit`

## Starter content

```ds
bar "Bar chart overview"
theme plate
describe "Comparison across categories"
unit "Days"

research "Research" =18
design "Design" =26
build "Build" * =64
launch "Launch" =22
improve "Improve" =41
```

## As Mermaid

> Mermaid cannot express a bar chart. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Bar chart overview
%% Mermaid cannot express a bar chart. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Research"]
  N2["Design"]
  N3["Build"]
  N4["Launch"]
  N5["Improve"]
```

## Build one

```bash
diagram-studio create bar -o bar.svg
```

Rendered examples: [`docs/gallery/bar-light.svg`](../../../docs/gallery/bar-light.svg) · [dark](../../../docs/gallery/bar-dark.svg)
