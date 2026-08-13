# Waterfall

> How a starting figure becomes an ending one

- **Family:** `chart`
- **Type id:** `waterfall`
- **Starter size:** 1144×720 px, 6 nodes, 0 connections

## Use it for

Explaining how a starting figure became an ending one.

## Do not use it for

Categories that do not sum to the total. The format promises arithmetic.

## Composition rules

- The closing bar is drawn from the running total, so a mismatch with the stated total is shown, not hidden.
- Increases and decreases are distinguished by direction and label, not by colour alone.
- Keep to about seven contributions; aggregate the rest.

## The mistake people make

Reordering the contributions to make the story smoother. The order is part of the claim.

## Model fields this type reads

Node: `fixedSize`, `kind`, `tone`, `value`

Diagram: `unit`

## Starter content

```ds
waterfall "Waterfall overview"
theme plate
describe "How a starting figure becomes an ending one"
unit "k"

opening-arr "Opening ARR" =4200
new-business "New business" =1400
expansion "Expansion" * =620
contraction "Contraction" =-280
churn "Churn" =-740
closing-arr "Closing ARR" =5200
```

## As Mermaid

> Mermaid cannot express a waterfall. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Waterfall overview
%% Mermaid cannot express a waterfall. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Opening ARR"]
  N2["New business"]
  N3["Expansion"]
  N4["Contraction"]
  N5["Churn"]
  N6["Closing ARR"]
```

## Build one

```bash
diagram-studio create waterfall -o waterfall.svg
```

Rendered examples: [`docs/gallery/waterfall-light.svg`](../../../docs/gallery/waterfall-light.svg) · [dark](../../../docs/gallery/waterfall-dark.svg)
