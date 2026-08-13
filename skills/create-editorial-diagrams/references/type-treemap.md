# Treemap

> Share of a whole, drawn as area

- **Family:** `chart`
- **Type id:** `treemap`
- **Starter size:** 1072×816 px, 8 nodes, 0 connections

## Use it for

Share of a whole across many items, where a pie would be unreadable.

## Do not use it for

Comparing two treemaps. Area is hard to compare between charts; use bars.

## Composition rules

- Squarified so tiles stay labelable — a sliver can be neither read nor compared.
- Items with no value are listed underneath, not given a token tile.
- Print the value and the share; area alone cannot be read precisely.

## The mistake people make

More than about fifteen tiles. Aggregate the tail into a named remainder.

## Model fields this type reads

Node: `fixedSize`, `tone`, `value`

Diagram: `unit`

## Starter content

```ds
treemap "Treemap overview"
theme plate
describe "Share of a whole, drawn as area"
unit "USD/month"

compute "Compute" * =4200
managed-database "Managed database" =2600
object-storage "Object storage" =1400
data-transfer "Data transfer" =900
observability "Observability" =620
search-cluster "Search cluster" =480
queue "Queue" =260
secrets-manager "Secrets manager" =90
```

## As Mermaid

> Mermaid cannot express a treemap. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Treemap overview
%% Mermaid cannot express a treemap. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Compute"]
  N2["Managed database"]
  N3["Object storage"]
  N4["Data transfer"]
  N5["Observability"]
  N6["Search cluster"]
  N7["Queue"]
  N8["Secrets manager"]
```

## Build one

```bash
diagram-studio create treemap -o treemap.svg
```

Rendered examples: [`docs/gallery/treemap-light.svg`](../../../docs/gallery/treemap-light.svg) · [dark](../../../docs/gallery/treemap-dark.svg)
