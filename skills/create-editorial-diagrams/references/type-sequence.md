# Sequence

> Messages between participants arranged over time

- **Family:** `sequence`
- **Type id:** `sequence`
- **Starter size:** 960×696 px, 4 nodes, 6 connections

## Use it for

The order of messages between participants, especially where a round trip matters.

## Do not use it for

Showing structure. Nothing here says what a participant is made of.

## Composition rules

- Message order is the model's order and is never re-sorted; reordering would change the meaning.
- Returns are dashed with an open head, so a reader can see the round trips without counting arrows.
- Keep to six participants: the columns get too narrow to label beyond that.

## The mistake people make

Drawing every retry and timeout. Show the happy path and note the exceptions.

## Model fields this type reads

Node: `role`, `tone`

## Starter content

```ds
sequence "Sequence overview"
theme editorial
describe "Messages between participants arranged over time"

customer: actor "Customer"
web-app "Web app"
auth-service "Auth service" *
account-store: store "Account store"

customer -> web-app "sign in"
web-app -> auth-service "authenticate"
auth-service -> account-store "lookup account"
account-store -> auth-service "profile"
auth-service -> web-app "session token"
web-app -> customer "signed in"
```

## As Mermaid

```
%% Sequence overview
sequenceDiagram
  participant N1 as Customer
  participant N2 as Web app
  participant N3 as Auth service
  participant N4 as Account store
  N1->>N2: sign in
  N2->>N3: authenticate
  N3->>N4: lookup account
  N4-->>N3: profile
  N3-->>N2: session token
  N2-->>N1: signed in
```

## Build one

```bash
diagram-studio create sequence -o sequence.svg
```

Rendered examples: [`docs/gallery/sequence-light.svg`](../../../docs/gallery/sequence-light.svg) · [dark](../../../docs/gallery/sequence-dark.svg)
