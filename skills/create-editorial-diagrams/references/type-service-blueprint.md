# Service blueprint

> A journey with the frontstage, backstage and the line of visibility

- **Family:** `swimlane`
- **Type id:** `service-blueprint`
- **Starter size:** 2400×784 px, 8 nodes, 6 connections

## Use it for

Finding where a service breaks: what the customer does, what they see, and what has to happen out of sight.

## Do not use it for

A journey where nothing behind the scenes is in question. Use a customer journey.

## Composition rules

- The lanes are fixed by the format, so a diagram can be compared with another one.
- The line of visibility is drawn heavier than the other rules — it is the thing to point at.
- Every crossing of that line is a hand-off worth naming.

## The mistake people make

Filling the backstage lanes with system names instead of the work being done.

## Model fields this type reads

Node: `lane`, `tone`

## Starter content

```ds
service-blueprint "Service blueprint overview"
theme plate
describe "A journey with the frontstage, backstage and the line of visibility"

order-confirmation-email "Order confirmation email"
places-the-order "Places the order"
tracks-the-delivery "Tracks the delivery"
checkout-confirms "Checkout confirms"
tracking-page-updates "Tracking page updates" *
payment-captured "Payment captured"
warehouse-picks-and-pack "Warehouse picks and packs"
carrier-books-the-collec "Carrier books the collection"

places-the-order -> checkout-confirms
checkout-confirms -> payment-captured
payment-captured -> warehouse-picks-and-pack
warehouse-picks-and-pack -> carrier-books-the-collec
carrier-books-the-collec -> tracking-page-updates
tracking-page-updates -> tracks-the-delivery
```

## As Mermaid

> Mermaid cannot express a service blueprint. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Service blueprint overview
%% Mermaid cannot express a service blueprint. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Order confirmation email"]
  N2["Places the order"]
  N3["Tracks the delivery"]
  N4["Checkout confirms"]
  N5["Tracking page updates"]
  N6["Payment captured"]
  N7["Warehouse picks and packs"]
  N8["Carrier books the collection"]
  N2 --> N4
  N4 --> N6
  N6 --> N7
  N7 --> N8
  N8 --> N5
  N5 --> N3
```

## Build one

```bash
diagram-studio create service-blueprint -o service-blueprint.svg
```

Rendered examples: [`docs/gallery/service-blueprint-light.svg`](../../../docs/gallery/service-blueprint-light.svg) · [dark](../../../docs/gallery/service-blueprint-dark.svg)
