# Data flow

> Sources, transformations and destinations

- **Family:** `layered`
- **Type id:** `data-flow`
- **Starter size:** 1632×480 px, 5 nodes, 4 connections
- **Default direction:** LR

## Use it for

Where data comes from, what happens to it, and where it lands.

## Do not use it for

Implying execution order. A data flow says 'feeds', not 'then'.

## Composition rules

- Sources are parallelograms, transformations are boxes, stores are cylinders.
- Label the edges with what moves, not with how it moves.

## The mistake people make

Labelling every arrow with the transport. Nobody is helped by five arrows all saying 'HTTP'.

## Model fields this type reads

Node: `icon`, `role`, `sublabel`, `tone`

## Starter content

```ds
data-flow "Data flow overview"
theme editorial
describe "Sources, transformations and destinations"

operational-systems: input "Operational systems" #table
ingest "Ingest" / "Batch and stream" #stream
transform "Transform" / "Clean, join, conform" * #pipeline
warehouse: store "Warehouse" #database
reporting: output "Reporting" #chart

operational-systems -> ingest
ingest -> transform
transform -> warehouse "load"
warehouse -> reporting "serve"
```

## As Mermaid

```
%% Data flow overview
flowchart LR
  N1[/"Operational systems"/]
  N2["Ingest · Batch and stream"]
  N3["Transform · Clean, join, conform"]
  N4[("Warehouse")]
  N5[\"Reporting"\]
  N1 --> N2
  N2 --> N3
  N3 -->|load| N4
  N4 -->|serve| N5
```

## Build one

```bash
diagram-studio create data-flow -o data-flow.svg
```

Rendered examples: [`docs/gallery/data-flow-light.svg`](../../../docs/gallery/data-flow-light.svg) · [dark](../../../docs/gallery/data-flow-dark.svg)
