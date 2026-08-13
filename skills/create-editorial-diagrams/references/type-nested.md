# Nested systems

> Hierarchy expressed by containment rather than flow

- **Family:** `band`
- **Type id:** `nested`
- **Starter size:** 952×712 px, 4 nodes, 0 connections

## Use it for

Hierarchy expressed by containment: 'is part of', not 'flows to'.

## Do not use it for

More than four levels. The innermost box stops being readable.

## Composition rules

- Label each ring on its own top edge.
- Give the accent to the layer under discussion.

## The mistake people make

Using containment to imply a call direction it does not have.

## Model fields this type reads

Node: `fixedSize`, `sublabel`, `tone`

## Starter content

```ds
nested "Nested systems overview"
theme editorial
describe "Hierarchy expressed by containment rather than flow"

platform "Platform" / "Everything we run"
experience-layer "Experience layer" / "Web, mobile, partner APIs"
service-layer "Service layer" / "Domain capabilities"
data-layer "Data layer" / "Records of truth" *
```

## As Mermaid

> Mermaid has no nested systems type; exported as a flowchart, which loses the band structure.

```
%% Nested systems overview
%% Mermaid has no nested systems type; exported as a flowchart, which loses the band structure.
flowchart LR
  N1["Platform · Everything we run"]
  N2["Experience layer · Web, mobile, partner APIs"]
  N3["Service layer · Domain capabilities"]
  N4["Data layer · Records of truth"]
```

## Build one

```bash
diagram-studio create nested -o nested.svg
```

Rendered examples: [`docs/gallery/nested-light.svg`](../../../docs/gallery/nested-light.svg) · [dark](../../../docs/gallery/nested-dark.svg)
