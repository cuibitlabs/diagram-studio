# Wardley map

> Components by user visibility and evolution, with their dependencies

- **Family:** `map`
- **Type id:** `wardley`
- **Starter size:** 1240×816 px, 6 nodes, 6 connections

## Use it for

Arguing about what to build, buy and outsource, by position rather than by opinion.

## Do not use it for

Anything where evolution is not in question. A dependency graph is simpler and says more.

## Composition rules

- Both coordinates are data. A component with no stated evolution is listed as unplaced, not guessed at.
- Movement is drawn only where the model claims it, because a movement arrow is a prediction.
- Dependencies point down the chain, from what the user sees to what it rests on.

## The mistake people make

Treating position as fact. The value of the map is that it can be wrong in public.

## Model fields this type reads

Node: `movement`, `px`, `py`, `tone`

## Starter content

```ds
wardley "Wardley map overview"
theme plate
describe "Components by user visibility and evolution, with their dependencies"

customer "Customer" *
order-tracking "Order tracking"
notification-service "Notification service"
carrier-integration "Carrier integration"
message-queue "Message queue"
compute "Compute"

customer -> order-tracking
order-tracking -> notification-service
order-tracking -> carrier-integration
notification-service -> message-queue
carrier-integration -> message-queue
message-queue -> compute
```

## As Mermaid

> Mermaid cannot express a wardley map. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Wardley map overview
%% Mermaid cannot express a wardley map. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Customer"]
  N2["Order tracking"]
  N3["Notification service"]
  N4["Carrier integration"]
  N5["Message queue"]
  N6["Compute"]
  N1 --> N2
  N2 --> N3
  N2 --> N4
  N3 --> N5
  N4 --> N5
  N5 --> N6
```

## Build one

```bash
diagram-studio create wardley -o wardley.svg
```

Rendered examples: [`docs/gallery/wardley-light.svg`](../../../docs/gallery/wardley-light.svg) · [dark](../../../docs/gallery/wardley-dark.svg)
