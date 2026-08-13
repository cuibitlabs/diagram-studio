# Line chart

> A measured trend over an ordered axis

- **Family:** `chart`
- **Type id:** `line`
- **Starter size:** 1112×688 px, 6 nodes, 0 connections

## Use it for

A measured trend along an ordered axis.

## Do not use it for

Unordered categories. The line implies continuity that is not there.

## Composition rules

- Gaps break the line rather than being interpolated across.
- Label the last point rather than adding a legend for one series.

## The mistake people make

Hiding a truncated axis. Start at zero or say plainly that you did not.

## Model fields this type reads

Node: `fixedSize`, `tone`, `value`

Diagram: `unit`

## Starter content

```ds
line "Line chart overview"
theme editorial
describe "A measured trend over an ordered axis"
unit "Active teams"

jan "Jan" =24
feb "Feb" =31
mar "Mar" =29
apr "Apr" =46
may "May" =58
jun "Jun" * =71
```

## As Mermaid

> Mermaid cannot express a line chart. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Line chart overview
%% Mermaid cannot express a line chart. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Jan"]
  N2["Feb"]
  N3["Mar"]
  N4["Apr"]
  N5["May"]
  N6["Jun"]
```

## Build one

```bash
diagram-studio create line -o line.svg
```

Rendered examples: [`docs/gallery/line-light.svg`](../../../docs/gallery/line-light.svg) · [dark](../../../docs/gallery/line-dark.svg)
