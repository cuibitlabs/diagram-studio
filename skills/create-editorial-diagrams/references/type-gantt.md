# Gantt

> Tasks against a declared time scale

- **Family:** `chart`
- **Type id:** `gantt`
- **Starter size:** 1120×576 px, 5 nodes, 0 connections

## Use it for

Tasks against a declared time scale.

## Do not use it for

Dependencies as the main point. Use a flow.

## Composition rules

- Bars come from start and duration in the unit the model declares.
- Tasks missing either value are listed as unscheduled rather than given a plausible bar.

## The mistake people make

Implying certainty. A Gantt reads as a promise; say which bars are estimates.

## Model fields this type reads

Node: `duration`, `fixedSize`, `start`, `tone`

Diagram: `timeUnit`

## Starter content

```ds
gantt "Gantt overview"
theme plate
describe "Tasks against a declared time scale"

discovery "Discovery"
design "Design"
build "Build" *
pilot "Pilot"
launch "Launch"
```

## As Mermaid

> Gantt exported with numeric day offsets rather than calendar dates.

```
%% Gantt overview
%% Gantt exported with numeric day offsets rather than calendar dates.
gantt
  dateFormat X
  axisFormat %s
  section Schedule
  Discovery : 0, 3
  Design : 2, 3
  Build : 4, 6
  Pilot : 9, 2
  Launch : 11, 1
```

## Build one

```bash
diagram-studio create gantt -o gantt.svg
```

Rendered examples: [`docs/gallery/gantt-light.svg`](../../../docs/gallery/gantt-light.svg) · [dark](../../../docs/gallery/gantt-dark.svg)
