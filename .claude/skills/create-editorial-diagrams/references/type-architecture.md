# Architecture

> Systems, services and the connections between them

- **Family:** `layered`
- **Type id:** `architecture`
- **Starter size:** 1688×480 px, 6 nodes, 5 connections
- **Default direction:** LR

## Use it for

Showing which systems exist and what talks to what.

## Do not use it for

Explaining a sequence of events over time — use a sequence diagram; the arrows here mean 'depends on', not 'then'.

## Composition rules

- Read left to right along the request path. The user or trigger is the leftmost element.
- Give the accent to the component the diagram is arguing about, not to the biggest box.
- Stores are cylinders and third parties are dashed stadiums, so the boundary survives greyscale.

## The mistake people make

Drawing every service. An architecture diagram with twenty boxes is an inventory; pick the path being discussed.

## Model fields this type reads

Node: `icon`, `role`, `sublabel`, `tone`

## Starter content

```ds
architecture "Architecture overview"
theme editorial
describe "Systems, services and the connections between them"

customer: actor "Customer" #user
web-app "Web app" / "Browser client" #browser
api-gateway "API gateway" / "Auth and rate limiting" * #gateway
orders-service "Orders service" #server
order-store: store "Order store" #database
payments-provider: external "Payments provider" #cloud

customer -> web-app
web-app -> api-gateway
api-gateway -> orders-service
orders-service -> order-store "read/write"
orders-service ~> payments-provider "charge"
```

## As Mermaid

```
%% Architecture overview
flowchart LR
  N1(["Customer"])
  N2["Web app · Browser client"]
  N3["API gateway · Auth and rate limiting"]
  N4["Orders service"]
  N5[("Order store")]
  N6["Payments provider"]
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 -->|read/write| N5
  N4 -.->|charge| N6
```

## Build one

```bash
diagram-studio create architecture -o architecture.svg
```

Rendered examples: [`docs/gallery/architecture-light.svg`](../../../docs/gallery/architecture-light.svg) · [dark](../../../docs/gallery/architecture-dark.svg)
