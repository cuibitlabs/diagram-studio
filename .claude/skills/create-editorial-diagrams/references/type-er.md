# ER / data model

> Entities, their fields and the relationships between them

- **Family:** `er`
- **Type id:** `er`
- **Starter size:** 1072×520 px, 4 nodes, 3 connections

## Use it for

Entities, their fields and how they relate.

## Do not use it for

Showing behaviour or process. This is shape, not motion.

## Composition rules

- Fields and types are the content; an entity drawn as an empty box answers nothing.
- Mark keys explicitly (PK, FK) rather than relying on position.
- Relationship labels read as a sentence: Customer places Order.

## The mistake people make

Including every column. Show the keys and the fields the conversation is about.

## Model fields this type reads

Node: `fields`, `tone`

## Starter content

```ds
er "ER / data model overview"
theme editorial
describe "Entities, their fields and the relationships between them"

customer "Customer"
order "Order" *
order-item "Order item"
product "Product"

customer -> order "places"
order -> order-item "contains"
product -> order-item "listed in"
```

## As Mermaid

```
%% ER / data model overview
erDiagram
  N1 ||--o{ N2 : "places"
  N2 ||--o{ N3 : "contains"
  N4 ||--o{ N3 : "listed in"
  N1 {
    uuid id PK
    text email
    timestamptz created_at
  }
  N2 {
    uuid id PK
    uuid customer_id FK
    text status
    timestamptz placed_at
  }
  N3 {
    uuid order_id FK
    uuid product_id FK
    integer quantity
  }
  N4 {
    uuid id PK
    text sku
    text name
  }
```

## Build one

```bash
diagram-studio create er -o er.svg
```

Rendered examples: [`docs/gallery/er-light.svg`](../../../docs/gallery/er-light.svg) · [dark](../../../docs/gallery/er-dark.svg)
