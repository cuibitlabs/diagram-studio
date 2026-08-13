# C4 container

> The deployable parts of one system, and the technology each uses

- **Family:** `layered`
- **Type id:** `c4-container`
- **Starter size:** 848×840 px, 7 nodes, 7 connections
- **Default direction:** TB

## Use it for

Showing the separately deployable or storable parts of one system, and what each is built with.

## Do not use it for

Classes, functions or modules — that is a level below this one, and usually better read as code.

## Composition rules

- Every container names its technology in the sublabel. That is the whole difference from the context view.
- The system boundary is a group, so what is inside is data rather than a matter of position.
- Stores are cylinders; people stay stadiums.

## The mistake people make

Drawing a container per service in a large estate. Above about eight, draw the boundary and split.

## Model fields this type reads

Node: `c4`, `dashed`, `icon`, `role`, `sublabel`, `tone`

Diagram: `groups`

## Starter content

```ds
c4-container "C4 container overview"
theme plate
describe "The deployable parts of one system, and the technology each uses"

customer: actor "Customer" #user
web-application "Web application" / "React · server rendered" #react
mobile-app "Mobile app" / "Swift · Kotlin" #mobile
orders-api "Orders API" * #go
order-store: store "Order store" / "PostgreSQL" #postgresql
event-bus: store "Event bus" #kafka
payment-provider: external "Payment provider" #stripe

group "Order platform" {
  web-application mobile-app orders-api order-store event-bus
}

customer -> web-application "uses"
customer -> mobile-app "uses"
web-application -> orders-api "JSON/HTTPS"
mobile-app -> orders-api "JSON/HTTPS"
orders-api -> order-store "reads and writes"
orders-api -> event-bus "publishes"
orders-api ~> payment-provider "authorises"
```

## As Mermaid

> Mermaid cannot express a c4 container. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% C4 container overview
%% Mermaid cannot express a c4 container. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart TB
  subgraph Order platform
    N2["Web application · React · server rendered"]
    N3["Mobile app · Swift · Kotlin"]
    N4["Orders API"]
    N5[("Order store · PostgreSQL")]
    N6[("Event bus")]
  end
  N1(["Customer"])
  N7["Payment provider"]
  N1 -->|uses| N2
  N1 -->|uses| N3
  N2 -->|JSON/HTTPS| N4
  N3 -->|JSON/HTTPS| N4
  N4 -->|reads and writes| N5
  N4 -->|publishes| N6
  N4 -.->|authorises| N7
```

## Build one

```bash
diagram-studio create c4-container -o c4-container.svg
```

Rendered examples: [`docs/gallery/c4-container-light.svg`](../../../docs/gallery/c4-container-light.svg) · [dark](../../../docs/gallery/c4-container-dark.svg)
