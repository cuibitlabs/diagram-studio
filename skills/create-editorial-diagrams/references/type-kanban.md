# Kanban board

> Work in columns, with the limit that makes it a system

- **Family:** `band`
- **Type id:** `kanban`
- **Starter size:** 1152×560 px, 7 nodes, 0 connections

## Use it for

Making work in progress and its limit visible at the same time.

## Do not use it for

Planning. A board shows what is happening now, not what is intended.

## Composition rules

- Columns are the real workflow states, including the waiting ones.
- A column without a limit is a list; state the limit and let an over-limit column be marked.
- Cards carry the blocker, not the assignee.

## The mistake people make

A Done column that grows forever. Archive it, or the board stops being readable.

## Model fields this type reads

Node: `column`, `sublabel`, `tone`

## Starter content

```ds
kanban "Kanban board overview"
theme plate
describe "Work in columns, with the limit that makes it a system"

rename-the-billing-endpo "Rename the billing endpoints" / "Blocked on the client release"
idempotency-keys-on-retr "Idempotency keys on retries"
split-the-orders-read-mo "Split the orders read model" *
drop-the-legacy-webhook "Drop the legacy webhook"
backfill-the-audit-log "Backfill the audit log"
retire-the-v1-api "Retire the v1 API"
contract-tests-for-carri "Contract tests for carriers"
```

## As Mermaid

> Mermaid cannot express a kanban board. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Kanban board overview
%% Mermaid cannot express a kanban board. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["Rename the billing endpoints · Blocked on the client release"]
  N2["Idempotency keys on retries"]
  N3["Split the orders read model"]
  N4["Drop the legacy webhook"]
  N5["Backfill the audit log"]
  N6["Retire the v1 API"]
  N7["Contract tests for carriers"]
```

## Build one

```bash
diagram-studio create kanban -o kanban.svg
```

Rendered examples: [`docs/gallery/kanban-light.svg`](../../../docs/gallery/kanban-light.svg) · [dark](../../../docs/gallery/kanban-dark.svg)
