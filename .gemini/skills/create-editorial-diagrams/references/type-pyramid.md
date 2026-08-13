# Pyramid / funnel

> Priority, maturity or drop-off across levels

- **Family:** `band`
- **Type id:** `pyramid`
- **Starter size:** 952×704 px, 5 nodes, 0 connections

## Use it for

Priority, maturity, or drop-off between levels.

## Do not use it for

Anything where the levels are not nested or ordered.

## Composition rules

- Widths are proportional when every level has a value, and evenly stepped when they do not — a funnel drawn to invented proportions is a chart that lies.
- Five levels at most.

## The mistake people make

Using a funnel for conversion without the numbers.

## Model fields this type reads

Node: `fixedSize`, `sublabel`, `tone`

## Starter content

```ds
pyramid "Pyramid / funnel overview"
theme editorial
describe "Priority, maturity or drop-off across levels"

vision "Vision" / "Why this exists"
strategy "Strategy" / "Where we will win"
programmes "Programmes" / "Funded bets" *
projects "Projects" / "Scoped delivery"
tasks "Tasks" / "This fortnight"
```

## As Mermaid

> Mermaid has no pyramid / funnel type; exported as a flowchart, which loses the band structure.

```
%% Pyramid / funnel overview
%% Mermaid has no pyramid / funnel type; exported as a flowchart, which loses the band structure.
flowchart LR
  N1["Vision · Why this exists"]
  N2["Strategy · Where we will win"]
  N3["Programmes · Funded bets"]
  N4["Projects · Scoped delivery"]
  N5["Tasks · This fortnight"]
```

## Build one

```bash
diagram-studio create pyramid -o pyramid.svg
```

Rendered examples: [`docs/gallery/pyramid-light.svg`](../../../docs/gallery/pyramid-light.svg) · [dark](../../../docs/gallery/pyramid-dark.svg)
