# Stacked bar

> What each category is made of, and how the totals compare

- **Family:** `chart`
- **Type id:** `stacked-bar`
- **Starter size:** 1120×736 px, 4 nodes, 0 connections

## Use it for

Composition across categories, when the totals also matter.

## Do not use it for

Comparing the middle bands. Only the bottom one shares a baseline.

## Composition rules

- Series order is the model's and is never re-sorted; the legend names the comparable band.
- A missing series value leaves the band out and is counted, rather than padded with a zero.
- Four series at most, or the bands stop being distinguishable.

## The mistake people make

Stacking percentages and totals in the same chart. Pick which question you are answering.

## Model fields this type reads

Node: `fixedSize`, `tone`, `values`

Diagram: `unit`

## Starter content

```ds
stacked-bar "Stacked bar overview"
theme plate
describe "What each category is made of, and how the totals compare"
unit "k"

q1 "Q1"
q2 "Q2"
q3 "Q3" *
q4 "Q4"
```

## As Mermaid

> Mermaid cannot express a stacked bar. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Stacked bar overview
%% Mermaid cannot express a stacked bar. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Q1"]
  N2["Q2"]
  N3["Q3"]
  N4["Q4"]
```

## Build one

```bash
diagram-studio create stacked-bar -o stacked-bar.svg
```

Rendered examples: [`docs/gallery/stacked-bar-light.svg`](../../../docs/gallery/stacked-bar-light.svg) · [dark](../../../docs/gallery/stacked-bar-dark.svg)
