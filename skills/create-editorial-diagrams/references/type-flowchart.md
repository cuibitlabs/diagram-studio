# Flowchart

> Decisions and process logic

- **Family:** `layered`
- **Type id:** `flowchart`
- **Starter size:** 640×784 px, 5 nodes, 5 connections
- **Default direction:** TB

## Use it for

Decisions, branches, and what happens on each outcome.

## Do not use it for

A linear sequence of steps with no branching — that is a process, and drawing it as a flowchart implies choices that do not exist.

## Composition rules

- Top to bottom. Terminals are stadiums, decisions are diamonds.
- Every edge leaving a decision carries its condition. An unlabelled fork is the most common way a flowchart lies.
- Loops go back to the decision, not to the start, unless the whole thing really does restart.

## The mistake people make

Nesting decisions more than three deep. Split into a second diagram at that point.

## Model fields this type reads

Node: `role`, `tone`

## Starter content

```ds
flowchart "Flowchart overview"
theme editorial
describe "Decisions and process logic"

request-received: terminal "Request received"
fields-complete: decision "Fields complete?"
return-errors "Return errors"
process-request "Process request" *
confirmation-sent: terminal "Confirmation sent"

request-received -> fields-complete
fields-complete -> return-errors "no"
fields-complete -> process-request "yes"
process-request -> confirmation-sent
return-errors ~> fields-complete "resubmit"
```

## As Mermaid

```
%% Flowchart overview
flowchart TB
  N1(["Request received"])
  N2{"Fields complete?"}
  N3["Return errors"]
  N4["Process request"]
  N5(["Confirmation sent"])
  N1 --> N2
  N2 -->|no| N3
  N2 -->|yes| N4
  N4 --> N5
  N3 -.->|resubmit| N2
```

## Build one

```bash
diagram-studio create flowchart -o flowchart.svg
```

Rendered examples: [`docs/gallery/flowchart-light.svg`](../../../docs/gallery/flowchart-light.svg) · [dark](../../../docs/gallery/flowchart-dark.svg)
