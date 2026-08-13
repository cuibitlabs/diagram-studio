# Org chart

> Teams, ownership and reporting lines

- **Family:** `hierarchy`
- **Type id:** `org-chart`
- **Starter size:** 968×552 px, 6 nodes, 5 connections

## Use it for

Reporting lines and where accountability sits.

## Do not use it for

Showing how work flows. Use a swimlane.

## Composition rules

- Sublabels are the remit, not the job title.
- Vacancies are drawn dashed rather than omitted.

## The mistake people make

Drawing the whole company. Draw the part the reader has a question about.

## Model fields this type reads

Node: `sublabel`, `tone`

## Starter content

```ds
org-chart "Org chart overview"
theme editorial
describe "Teams, ownership and reporting lines"

chief-executive "Chief executive" *
product "Product" / "Discovery and roadmap"
engineering "Engineering" / "Delivery and platform"
design "Design" / "Research and craft"
platform-team "Platform team" / "Shared services"
product-teams "Product teams" / "Stream aligned"

chief-executive -> product
chief-executive -> engineering
chief-executive -> design
engineering -> platform-team
engineering -> product-teams
```

## As Mermaid

> Mermaid has no org chart type; exported as a flowchart, which loses the hierarchy structure.

```
%% Org chart overview
%% Mermaid has no org chart type; exported as a flowchart, which loses the hierarchy structure.
flowchart LR
  N1["Chief executive"]
  N2["Product · Discovery and roadmap"]
  N3["Engineering · Delivery and platform"]
  N4["Design · Research and craft"]
  N5["Platform team · Shared services"]
  N6["Product teams · Stream aligned"]
  N1 --> N2
  N1 --> N3
  N1 --> N4
  N3 --> N5
  N3 --> N6
```

## Build one

```bash
diagram-studio create org-chart -o org-chart.svg
```

Rendered examples: [`docs/gallery/org-chart-light.svg`](../../../docs/gallery/org-chart-light.svg) · [dark](../../../docs/gallery/org-chart-dark.svg)
