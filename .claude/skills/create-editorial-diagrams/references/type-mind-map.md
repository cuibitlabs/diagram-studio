# Mind map

> Ideas branching from a central concept

- **Family:** `radial`
- **Type id:** `mind-map`
- **Starter size:** 1192×1096 px, 9 nodes, 8 connections

## Use it for

Opening a topic out — branches from one idea, before there is any structure.

## Do not use it for

A finished argument. Once the relationships are known, a tree or an architecture is clearer.

## Composition rules

- One central idea. Two levels of branches.
- Spokes are straight; radial layouts are exempt from the orthogonal rule.

## The mistake people make

Presenting a mind map as a conclusion. It is a starting point.

## Model fields this type reads

Node: `tone`

## Starter content

```ds
mind-map "Mind map overview"
theme editorial
describe "Ideas branching from a central concept"

product-strategy "Product strategy" *
people "People"
process "Process"
technology "Technology"
market "Market"
hiring-plan "Hiring plan"
rituals "Rituals"
platform "Platform"
segments "Segments"

product-strategy -> people
product-strategy -> process
product-strategy -> technology
product-strategy -> market
people -> hiring-plan
process -> rituals
technology -> platform
market -> segments
```

## As Mermaid

```
%% Mind map overview
mindmap
  Product strategy
    People
      Hiring plan
    Process
      Rituals
    Technology
      Platform
    Market
      Segments
```

## Build one

```bash
diagram-studio create mind-map -o mind-map.svg
```

Rendered examples: [`docs/gallery/mind-map-light.svg`](../../../docs/gallery/mind-map-light.svg) · [dark](../../../docs/gallery/mind-map-dark.svg)
