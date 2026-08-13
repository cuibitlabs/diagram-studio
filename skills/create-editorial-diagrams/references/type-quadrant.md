# Quadrant

> Items positioned against two named axes

- **Family:** `matrix`
- **Type id:** `quadrant`
- **Starter size:** 1064×808 px, 4 nodes, 0 connections

## Use it for

Positioning items against two named axes.

## Do not use it for

Two axes that are really the same thing. The plot becomes a diagonal.

## Composition rules

- Axis names come from the model; the renderer never supplies its own.
- Positions are data (px, py), so a position means something.

## The mistake people make

Placing items by feel and then arguing from the picture.

## Model fields this type reads

Node: `px`, `py`, `tone`

Diagram: `axes`

## Starter content

```ds
quadrant "Quadrant overview"
theme plate
describe "Items positioned against two named axes"
axis x "Effort" "Low effort" "High effort"
axis y "Value" "Low value" "High value"

quick-wins "Quick wins" *
strategic-bets "Strategic bets"
fill-ins "Fill-ins"
avoid "Avoid"
```

## As Mermaid

```
%% Quadrant overview
quadrantChart
  x-axis Low effort --> High effort
  y-axis Low value --> High value
  Quick wins: [0.22, 0.78]
  Strategic bets: [0.78, 0.82]
  Fill-ins: [0.20, 0.24]
  Avoid: [0.80, 0.20]
```

## Build one

```bash
diagram-studio create quadrant -o quadrant.svg
```

Rendered examples: [`docs/gallery/quadrant-light.svg`](../../../docs/gallery/quadrant-light.svg) · [dark](../../../docs/gallery/quadrant-dark.svg)
