# Consultant matrix

> Four named strategies against two axes

- **Family:** `matrix`
- **Type id:** `matrix`
- **Starter size:** 1024×760 px, 4 nodes, 0 connections

## Use it for

Four named strategies, each with a recommendation.

## Do not use it for

Plotting many items. That is a quadrant.

## Composition rules

- The cell is the content; nothing floats inside it.
- Each cell carries the action, not just the label.

## The mistake people make

Naming the cells cleverly instead of usefully.

## Model fields this type reads

Node: `action`, `fixedSize`, `sublabel`, `tone`

Diagram: `axes`

## Starter content

```ds
matrix "Consultant matrix overview"
theme editorial
describe "Four named strategies against two axes"
axis x "Cost to run" "Low" "High"
axis y "Business value" "Low" "High"

transform "Transform" / "High value to the business and expensive to keep as it is." *
optimise "Optimise" / "Valuable and healthy. Small investments compound here."
maintain "Maintain" / "Low value but low cost. Leave it alone."
retire "Retire" / "Low value and high cost to run."
```

## As Mermaid

> Mermaid cannot express a consultant matrix. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Consultant matrix overview
%% Mermaid cannot express a consultant matrix. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Transform · High value to the business and expensive to keep as it is."]
  N2["Optimise · Valuable and healthy. Small investments compound here."]
  N3["Maintain · Low value but low cost. Leave it alone."]
  N4["Retire · Low value and high cost to run."]
```

## Build one

```bash
diagram-studio create matrix -o matrix.svg
```

Rendered examples: [`docs/gallery/matrix-light.svg`](../../../docs/gallery/matrix-light.svg) · [dark](../../../docs/gallery/matrix-dark.svg)
