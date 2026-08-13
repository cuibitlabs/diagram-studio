# Medallion

> Raw, cleaned and trusted data tiers with promotion rules

- **Family:** `band`
- **Type id:** `medallion`
- **Starter size:** 1176×480 px, 3 nodes, 2 connections

## Use it for

Raw, cleaned and trusted data tiers, and the rule that promotes between them.

## Do not use it for

Any pipeline that is not tiered by data quality.

## Composition rules

- The promotion rule sits on the arrow: it is the point of the pattern.
- Say what each tier guarantees, not what tools built it.

## The mistake people make

Naming the tools instead of the guarantees.

## Model fields this type reads

Node: `fixedSize`, `sublabel`, `tone`

## Starter content

```ds
medallion "Medallion overview"
theme editorial
describe "Raw, cleaned and trusted data tiers with promotion rules"

bronze "Bronze" / "Landed exactly as received. Nothing dropped, nothing renamed."
silver "Silver" / "Deduplicated, typed and conformed to shared keys."
gold "Gold" / "Modelled for a named consumer and contract-tested." *

bronze -> silver "validate and conform"
silver -> gold "model for use"
```

## As Mermaid

> Mermaid has no medallion type; exported as a flowchart, which loses the band structure.

```
%% Medallion overview
%% Mermaid has no medallion type; exported as a flowchart, which loses the band structure.
flowchart LR
  N1["Bronze · Landed exactly as received. Nothing dropped, nothing renamed."]
  N2["Silver · Deduplicated, typed and conformed to shared keys."]
  N3["Gold · Modelled for a named consumer and contract-tested."]
  N1 -->|validate and conform| N2
  N2 -->|model for use| N3
```

## Build one

```bash
diagram-studio create medallion -o medallion.svg
```

Rendered examples: [`docs/gallery/medallion-light.svg`](../../../docs/gallery/medallion-light.svg) · [dark](../../../docs/gallery/medallion-dark.svg)
