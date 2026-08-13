# Tree

> Parent and child relationships in a taxonomy

- **Family:** `hierarchy`
- **Type id:** `tree`
- **Starter size:** 920×544 px, 7 nodes, 6 connections

## Use it for

A taxonomy: what contains what.

## Do not use it for

Anything with a flow. Containment is not a direction of travel, which is why the connectors carry no arrowheads.

## Composition rules

- Keep to three levels on one page.
- Siblings should be genuinely parallel in kind.

## The mistake people make

Using a tree for a dependency graph, where a child can have two parents.

## Model fields this type reads

Node: `tone`

## Starter content

```ds
tree "Tree overview"
theme plate
describe "Parent and child relationships in a taxonomy"

platform "Platform" *
experience "Experience"
services "Services"
web "Web"
mobile "Mobile"
identity "Identity"
billing "Billing"

platform -> experience
platform -> services
experience -> web
experience -> mobile
services -> identity
services -> billing
```

## As Mermaid

> Mermaid has no tree type; exported as a flowchart, which loses the hierarchy structure.

```
%% Tree overview
%% Mermaid has no tree type; exported as a flowchart, which loses the hierarchy structure.
flowchart LR
  N1["Platform"]
  N2["Experience"]
  N3["Services"]
  N4["Web"]
  N5["Mobile"]
  N6["Identity"]
  N7["Billing"]
  N1 --> N2
  N1 --> N3
  N2 --> N4
  N2 --> N5
  N3 --> N6
  N3 --> N7
```

## Build one

```bash
diagram-studio create tree -o tree.svg
```

Rendered examples: [`docs/gallery/tree-light.svg`](../../../docs/gallery/tree-light.svg) · [dark](../../../docs/gallery/tree-dark.svg)
