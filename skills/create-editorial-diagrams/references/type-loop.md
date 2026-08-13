# Loop / flywheel

> A reinforcing cycle of stages

- **Family:** `radial`
- **Type id:** `loop`
- **Starter size:** 744×640 px, 5 nodes, 0 connections

## Use it for

A reinforcing cycle where each stage feeds the next.

## Do not use it for

A process that ends. If there is a last step, it is a process.

## Composition rules

- Four to six stages. The hub is optional and its text comes from the model — the renderer never invents a centre label.
- The reinforcement is the claim; make sure each stage genuinely feeds the next.

## The mistake people make

Drawing a wheel because it looks strategic, when the stages are just a list.

## Model fields this type reads

Node: `sublabel`, `tone`

Diagram: `hub`

## Starter content

```ds
loop "Loop / flywheel overview"
theme plate
describe "A reinforcing cycle of stages"
hub "Shared context"

discover "Discover" / "Find the real problem"
decide "Decide" / "Choose one bet"
deliver "Deliver" *
measure "Measure" / "Against the bet"
learn "Learn" / "Feed the next cycle"
```

## As Mermaid

> Mermaid has no loop / flywheel type; exported as a flowchart, which loses the radial structure.

```
%% Loop / flywheel overview
%% Mermaid has no loop / flywheel type; exported as a flowchart, which loses the radial structure.
flowchart LR
  N1["Discover · Find the real problem"]
  N2["Decide · Choose one bet"]
  N3["Deliver"]
  N4["Measure · Against the bet"]
  N5["Learn · Feed the next cycle"]
```

## Build one

```bash
diagram-studio create loop -o loop.svg
```

Rendered examples: [`docs/gallery/loop-light.svg`](../../../docs/gallery/loop-light.svg) · [dark](../../../docs/gallery/loop-dark.svg)
