# Swimlane

> Cross-functional flow with explicit ownership

- **Family:** `swimlane`
- **Type id:** `swimlane`
- **Starter size:** 1872×840 px, 6 nodes, 5 connections

## Use it for

A flow where ownership is the point: who does what, in what order.

## Do not use it for

A flow with a single owner. The lanes add nothing.

## Composition rules

- A node's lane is data, never a coordinate guess, so re-layout cannot reassign work to the wrong team.
- Hand-offs between lanes are the interesting moments; make sure they are visible and labelled.

## The mistake people make

More than five lanes. At that point the diagram is an org chart with arrows.

## Model fields this type reads

Node: `lane`, `tone`

Diagram: `lanes`

## Starter content

```ds
swimlane "Swimlane overview"
theme plate
describe "Cross-functional flow with explicit ownership"

request-raised "Request raised"
triage "Triage"
design-change "Design change"
build-and-test "Build and test" *
release "Release"
confirmed "Confirmed"

request-raised -> triage
triage -> design-change
design-change -> build-and-test
build-and-test -> release
release -> confirmed
```

## As Mermaid

> Mermaid has no swimlane type; exported as a flowchart, which loses the swimlane structure.

```
%% Swimlane overview
%% Mermaid has no swimlane type; exported as a flowchart, which loses the swimlane structure.
flowchart LR
  N1["Request raised"]
  N2["Triage"]
  N3["Design change"]
  N4["Build and test"]
  N5["Release"]
  N6["Confirmed"]
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
  N5 --> N6
```

## Build one

```bash
diagram-studio create swimlane -o swimlane.svg
```

Rendered examples: [`docs/gallery/swimlane-light.svg`](../../../docs/gallery/swimlane-light.svg) · [dark](../../../docs/gallery/swimlane-dark.svg)
