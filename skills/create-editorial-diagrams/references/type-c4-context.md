# C4 context

> One system, its users, and the systems around it

- **Family:** `layered`
- **Type id:** `c4-context`
- **Starter size:** 856×648 px, 5 nodes, 4 connections
- **Default direction:** TB

## Use it for

Agreeing what the system is and who it touches, before anyone argues about how it works.

## Do not use it for

Any question about internals. A context diagram showing a database has stopped being one.

## Composition rules

- One system with the accent. Everything else is a person or another system.
- Label every relationship with what it is for, in the reader's words, not the protocol.
- External systems are dashed, so the boundary reads without colour.

## The mistake people make

Adding a second system you also own. If two systems matter equally, you have two context diagrams.

## Model fields this type reads

Node: `c4`, `dashed`, `icon`, `role`, `sublabel`, `tone`

## Starter content

```ds
c4-context "C4 context overview"
theme plate
describe "One system, its users, and the systems around it"

customer: actor "Customer" / "Places and tracks orders" #user
support-agent: actor "Support agent" / "Resolves order queries" #users
order-platform "Order platform" / "The system being described" *
payment-provider: external "Payment provider" / "Authorises and captures"
carrier-network: external "Carrier network" / "Books and tracks shipments"

customer -> order-platform "places orders"
support-agent -> order-platform "looks up orders"
order-platform ~> payment-provider "authorises payment"
order-platform ~> carrier-network "books shipment"
```

## As Mermaid

> Mermaid cannot express a c4 context. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% C4 context overview
%% Mermaid cannot express a c4 context. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart TB
  N1(["Customer · Places and tracks orders"])
  N2(["Support agent · Resolves order queries"])
  N3["Order platform · The system being described"]
  N4["Payment provider · Authorises and captures"]
  N5["Carrier network · Books and tracks shipments"]
  N1 -->|places orders| N3
  N2 -->|looks up orders| N3
  N3 -.->|authorises payment| N4
  N3 -.->|books shipment| N5
```

## Build one

```bash
diagram-studio create c4-context -o c4-context.svg
```

Rendered examples: [`docs/gallery/c4-context-light.svg`](../../../docs/gallery/c4-context-light.svg) · [dark](../../../docs/gallery/c4-context-dark.svg)
