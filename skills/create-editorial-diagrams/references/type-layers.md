# Layer stack

> Stacked abstractions from experience down to infrastructure

- **Family:** `band`
- **Type id:** `layers`
- **Starter size:** 1072×680 px, 5 nodes, 0 connections

## Use it for

Stacked abstractions where each layer only knows the one below.

## Do not use it for

Systems that call across layers freely. The picture would be a lie.

## Composition rules

- Equal bands unless the model weights them.
- Sublabels say what the layer is responsible for.

## The mistake people make

Adding an arrow. If direction matters, it is an architecture diagram.

## Model fields this type reads

Node: `fixedSize`, `sublabel`, `tone`

## Starter content

```ds
layers "Layer stack overview"
theme editorial
describe "Stacked abstractions from experience down to infrastructure"

experience "Experience" / "What people touch"
application "Application" / "Use cases and orchestration"
domain "Domain" / "Rules that outlive the UI" *
data "Data" / "Records of truth"
infrastructure "Infrastructure" / "Runtime and network"
```

## As Mermaid

> Mermaid has no layer stack type; exported as a flowchart, which loses the band structure.

```
%% Layer stack overview
%% Mermaid has no layer stack type; exported as a flowchart, which loses the band structure.
flowchart LR
  N1["Experience · What people touch"]
  N2["Application · Use cases and orchestration"]
  N3["Domain · Rules that outlive the UI"]
  N4["Data · Records of truth"]
  N5["Infrastructure · Runtime and network"]
```

## Build one

```bash
diagram-studio create layers -o layers.svg
```

Rendered examples: [`docs/gallery/layers-light.svg`](../../../docs/gallery/layers-light.svg) · [dark](../../../docs/gallery/layers-dark.svg)
