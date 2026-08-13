# High-level system

> End-to-end platform view for a non-specialist audience

- **Family:** `layered`
- **Type id:** `high-level`
- **Starter size:** 1456×480 px, 5 nodes, 4 connections
- **Default direction:** LR

## Use it for

One slide for an audience that does not run the system.

## Do not use it for

Any conversation where someone will ask which queue it uses. Draw the architecture instead.

## Composition rules

- Five blocks or fewer, no technology names, no protocol labels.
- Sublabels describe the job in the reader's language, not the implementation.

## The mistake people make

Shrinking a detailed architecture instead of redrawing it. Detail removed by scaling is still detail the reader tries to parse.

## Model fields this type reads

Node: `sublabel`, `tone`

## Starter content

```ds
high-level "High-level system overview"
theme editorial
describe "End-to-end platform view for a non-specialist audience"

customers "Customers"
experience "Experience" / "Web and mobile"
platform "Platform" / "Shared services" *
intelligence "Intelligence" / "Analytics and models"
operations "Operations" / "Support and finance"

customers -> experience
experience -> platform
platform -> intelligence
platform -> operations
```

## As Mermaid

```
%% High-level system overview
flowchart LR
  N1["Customers"]
  N2["Experience · Web and mobile"]
  N3["Platform · Shared services"]
  N4["Intelligence · Analytics and models"]
  N5["Operations · Support and finance"]
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N3 --> N5
```

## Build one

```bash
diagram-studio create high-level -o high-level.svg
```

Rendered examples: [`docs/gallery/high-level-light.svg`](../../../docs/gallery/high-level-light.svg) · [dark](../../../docs/gallery/high-level-dark.svg)
