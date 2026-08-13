# Heatmap

> One measure across two categories, with the number in every cell

- **Family:** `chart`
- **Type id:** `heatmap`
- **Starter size:** 1120×776 px, 9 nodes, 0 connections

## Use it for

One measure across two categories, where the pattern matters more than any single figure.

## Do not use it for

A single series. That is a bar chart, and easier to read.

## Composition rules

- The number is printed in every cell; intensity is the second encoding, not the only one.
- The label colour is chosen by measured contrast against its own cell.
- An unmeasured cell is left empty and marked, never shaded as zero.

## The mistake people make

A rainbow scale. One hue ramp keeps the order readable and survives colour-vision differences.

## Model fields this type reads

Node: `col`, `fixedSize`, `row`, `tone`, `value`

Diagram: `unit`

## Starter content

```ds
heatmap "Heatmap overview"
theme plate
describe "One measure across two categories, with the number in every cell"
unit "ms"

checkout-p50 "Checkout / p50" =120
checkout-p95 "Checkout / p95" =480
checkout-p99 "Checkout / p99" * =1400
search-p50 "Search / p50" =80
search-p95 "Search / p95" =210
search-p99 "Search / p99" =640
account-p50 "Account / p50" =60
account-p95 "Account / p95" =150
account-p99 "Account / p99" =320
```

## As Mermaid

> Mermaid cannot express a heatmap. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Heatmap overview
%% Mermaid cannot express a heatmap. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Checkout / p50"]
  N2["Checkout / p95"]
  N3["Checkout / p99"]
  N4["Search / p50"]
  N5["Search / p95"]
  N6["Search / p99"]
  N7["Account / p50"]
  N8["Account / p95"]
  N9["Account / p99"]
```

## Build one

```bash
diagram-studio create heatmap -o heatmap.svg
```

Rendered examples: [`docs/gallery/heatmap-light.svg`](../../../docs/gallery/heatmap-light.svg) · [dark](../../../docs/gallery/heatmap-dark.svg)
