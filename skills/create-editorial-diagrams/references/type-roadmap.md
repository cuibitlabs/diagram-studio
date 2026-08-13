# Roadmap

> Initiatives grouped by delivery horizon

- **Family:** `timeline`
- **Type id:** `roadmap`
- **Starter size:** 960×480 px, 5 nodes, 0 connections

## Use it for

Initiatives grouped by commitment horizon.

## Do not use it for

Dates you do not have. Horizons are named commitments, not a calendar.

## Composition rules

- Three horizons. Cards are outcomes, not tasks.
- The count per column is shown, which makes an overloaded 'Now' obvious.

## The mistake people make

Turning Later into a wish list nobody has agreed to.

## Model fields this type reads

Node: `horizon`, `tone`

Diagram: `horizons`

## Starter content

```ds
roadmap "Roadmap overview"
theme plate
describe "Initiatives grouped by delivery horizon"

single-sign-on "Single sign-on" *
audit-trail "Audit trail"
self-serve-provisioning "Self-serve provisioning"
usage-analytics "Usage analytics"
partner-marketplace "Partner marketplace"
```

## As Mermaid

> Mermaid cannot express a roadmap. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Roadmap overview
%% Mermaid cannot express a roadmap. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Single sign-on"]
  N2["Audit trail"]
  N3["Self-serve provisioning"]
  N4["Usage analytics"]
  N5["Partner marketplace"]
```

## Build one

```bash
diagram-studio create roadmap -o roadmap.svg
```

Rendered examples: [`docs/gallery/roadmap-light.svg`](../../../docs/gallery/roadmap-light.svg) · [dark](../../../docs/gallery/roadmap-dark.svg)
