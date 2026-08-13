# Radar

> Multi-axis comparison on a single shared scale

- **Family:** `chart`
- **Type id:** `radar`
- **Starter size:** 864×800 px, 6 nodes, 0 connections

## Use it for

Comparing several measures on one shared scale.

## Do not use it for

Measures with different units. The shape would be meaningless.

## Composition rules

- One scale, printed on the rings.
- Five to eight axes; fewer looks broken, more turns to mush.

## The mistake people make

Reading area as a total. The area depends on the axis order.

## Model fields this type reads

Node: `fixedSize`, `tone`, `value`

Diagram: `seriesLabel`

## Starter content

```ds
radar "Radar overview"
theme plate
describe "Multi-axis comparison on a single shared scale"

speed "Speed" =72
quality "Quality" * =84
cost "Cost" =48
security "Security" =66
adoption "Adoption" =58
scale "Scale" =40
```

## As Mermaid

> Mermaid cannot express a radar. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Radar overview
%% Mermaid cannot express a radar. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Speed"]
  N2["Quality"]
  N3["Cost"]
  N4["Security"]
  N5["Adoption"]
  N6["Scale"]
```

## Build one

```bash
diagram-studio create radar -o radar.svg
```

Rendered examples: [`docs/gallery/radar-light.svg`](../../../docs/gallery/radar-light.svg) · [dark](../../../docs/gallery/radar-dark.svg)
