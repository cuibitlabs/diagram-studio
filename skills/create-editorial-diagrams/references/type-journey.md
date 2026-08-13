# Customer journey

> Stages, customer actions and measured sentiment

- **Family:** `timeline`
- **Type id:** `journey`
- **Starter size:** 1272×496 px, 5 nodes, 0 connections

## Use it for

Stages, what the customer does, and how it feels.

## Do not use it for

Internal process. The journey is the customer's view.

## Composition rules

- The sentiment line is drawn only when the model carries measured values. A journey without measurement gets stages and actions and nothing else.
- Stage names are the customer's words.

## The mistake people make

Inventing the curve. It is the most persuasive kind of lie in this format.

## Model fields this type reads

Node: `sublabel`, `tone`, `value`

## Starter content

```ds
journey "Customer journey overview"
theme plate
describe "Stages, customer actions and measured sentiment"

awareness "Awareness" / "Finds us through a peer" =62
evaluate "Evaluate" / "Compares three options" =48
buy "Buy" / "Procurement review" * =34
onboard "Onboard" / "First team enabled" =66
grow "Grow" / "Second department joins" =78
```

## As Mermaid

> Sentiment rescaled from 0–100 back to Mermaid's 1–5 scores.

```
%% Customer journey overview
%% Sentiment rescaled from 0–100 back to Mermaid's 1–5 scores.
journey
  section Journey
  Awareness: 3: Customer
  Evaluate: 2: Customer
  Buy: 2: Customer
  Onboard: 3: Customer
  Grow: 4: Customer
```

## Build one

```bash
diagram-studio create journey -o journey.svg
```

Rendered examples: [`docs/gallery/journey-light.svg`](../../../docs/gallery/journey-light.svg) · [dark](../../../docs/gallery/journey-dark.svg)
