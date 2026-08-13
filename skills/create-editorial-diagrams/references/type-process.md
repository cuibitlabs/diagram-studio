# Process

> Multi-step operational workflow

- **Family:** `layered`
- **Type id:** `process`
- **Starter size:** 1544×480 px, 5 nodes, 4 connections
- **Default direction:** LR

## Use it for

An operational workflow where the order matters and nothing branches.

## Do not use it for

Anything with a real decision in it. Use a flowchart.

## Composition rules

- Step numbers come from the graph, so inserting a step renumbers the rest automatically.
- Sublabels say what 'done' means for that step.

## The mistake people make

Using a process diagram to hide branching that exists in reality.

## Model fields this type reads

Node: `badge`, `sublabel`, `tone`

## Starter content

```ds
process "Process overview"
theme editorial
describe "Multi-step operational workflow"

intake "Intake" / "Request logged"
qualify "Qualify" / "Scope and owner agreed"
plan "Plan" / "Sequence and dependencies"
execute "Execute" *
review "Review" / "Outcome recorded"

intake -> qualify
qualify -> plan
plan -> execute
execute -> review
```

## As Mermaid

```
%% Process overview
flowchart LR
  N1["Intake · Request logged"]
  N2["Qualify · Scope and owner agreed"]
  N3["Plan · Sequence and dependencies"]
  N4["Execute"]
  N5["Review · Outcome recorded"]
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

## Build one

```bash
diagram-studio create process -o process.svg
```

Rendered examples: [`docs/gallery/process-light.svg`](../../../docs/gallery/process-light.svg) · [dark](../../../docs/gallery/process-dark.svg)
