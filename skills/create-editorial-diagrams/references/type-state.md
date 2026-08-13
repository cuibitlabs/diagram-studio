# State machine

> States and the events that move between them

- **Family:** `layered`
- **Type id:** `state`
- **Starter size:** 1440×480 px, 5 nodes, 5 connections
- **Default direction:** LR

## Use it for

The states a thing can be in and the events that move it between them.

## Do not use it for

Describing who does the work. That is a swimlane.

## Composition rules

- Every transition is labelled with its event, in the vocabulary of the domain.
- Declare the entry and terminal states rather than relying on inference — a lifecycle with a rejection path back to the first state has no state without an incoming transition.

## The mistake people make

Mixing states with actions. 'Approved' is a state; 'Approve' is a transition.

## Model fields this type reads

Node: `stateKind`, `tone`

## Starter content

```ds
state "State machine overview"
theme plate
describe "States and the events that move between them"

draft "Draft"
in-review "In review"
approved "Approved" *
published "Published"
archived "Archived"

draft -> in-review "submit"
in-review -> approved "approve"
in-review ~> draft "reject"
approved -> published "publish"
published -> archived "retire"
```

## As Mermaid

```
%% State machine overview
stateDiagram-v2
  state "Draft" as N1
  state "In review" as N2
  state "Approved" as N3
  state "Published" as N4
  state "Archived" as N5
  [*] --> N1
  N1 --> N2 : submit
  N2 --> N3 : approve
  N2 --> N1 : reject
  N3 --> N4 : publish
  N4 --> N5 : retire
  N5 --> [*]
```

## Build one

```bash
diagram-studio create state -o state.svg
```

Rendered examples: [`docs/gallery/state-light.svg`](../../../docs/gallery/state-light.svg) · [dark](../../../docs/gallery/state-dark.svg)
