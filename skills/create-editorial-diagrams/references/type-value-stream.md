# Value stream

> Steps with process and wait time, and the efficiency that falls out

- **Family:** `timeline`
- **Type id:** `value-stream`
- **Starter size:** 1328×480 px, 5 nodes, 0 connections

## Use it for

Showing that the delay is between the steps, not inside them.

## Do not use it for

Work with no measured waiting time. Without it there is no ratio, and the format has no argument.

## Composition rules

- Process time and wait time are both required for a step to count toward the ratio.
- The efficiency figure is computed from the model and shown with its working.
- A step missing either number is drawn and listed as unmeasured, never assumed to be zero.

## The mistake people make

Optimising the low bars. The ladder exists to show that the high ones are the problem.

## Model fields this type reads

Node: `process`, `sublabel`, `tone`, `wait`

Diagram: `timeUnit`

## Starter content

```ds
value-stream "Value stream overview"
theme plate
describe "Steps with process and wait time, and the efficiency that falls out"

request-raised "Request raised" / "Ticket created"
triage "Triage" / "Scoped and sized"
build "Build" / "Change written and reviewed" *
test "Test" / "Regression pack"
release "Release" / "Deployed to production"
```

## As Mermaid

> Mermaid cannot express a value stream. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Value stream overview
%% Mermaid cannot express a value stream. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Request raised · Ticket created"]
  N2["Triage · Scoped and sized"]
  N3["Build · Change written and reviewed"]
  N4["Test · Regression pack"]
  N5["Release · Deployed to production"]
```

## Build one

```bash
diagram-studio create value-stream -o value-stream.svg
```

Rendered examples: [`docs/gallery/value-stream-light.svg`](../../../docs/gallery/value-stream-light.svg) · [dark](../../../docs/gallery/value-stream-dark.svg)
