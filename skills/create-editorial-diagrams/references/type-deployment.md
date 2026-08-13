# Deployment

> Runtime environments and the path a release takes through them

- **Family:** `layered`
- **Type id:** `deployment`
- **Starter size:** 640×928 px, 5 nodes, 5 connections
- **Default direction:** TB

## Use it for

The path a release takes and the gates it passes.

## Do not use it for

Runtime traffic. This is about promotion, not requests.

## Composition rules

- Top to bottom, with environments as groups so the promotion boundary is visible.
- Failure paths are dashed and point back at the stage that has to be redone.

## The mistake people make

Omitting the failure path, which is the part people actually ask about.

## Model fields this type reads

Node: `icon`, `sublabel`, `tone`

Diagram: `groups`

## Starter content

```ds
deployment "Deployment overview"
theme plate
describe "Runtime environments and the path a release takes through them"

commit "Commit" / "Trunk" #branch
build "Build" / "Artefact produced" #package
automated-tests "Automated tests" #check
staging "Staging" / "Production-like" #container
production "Production" * #deploy

group "Continuous integration" {
  commit build automated-tests
}

group "Continuous delivery" {
  staging production
}

commit -> build
build -> automated-tests
automated-tests -> staging "promote"
staging -> production "release"
automated-tests ~> commit "fail"
```

## As Mermaid

```
%% Deployment overview
flowchart TB
  subgraph Continuous integration
    N1["Commit · Trunk"]
    N2["Build · Artefact produced"]
    N3["Automated tests"]
  end
  subgraph Continuous delivery
    N4["Staging · Production-like"]
    N5["Production"]
  end
  N1 --> N2
  N2 --> N3
  N3 -->|promote| N4
  N4 -->|release| N5
  N3 -.->|fail| N1
```

## Build one

```bash
diagram-studio create deployment -o deployment.svg
```

Rendered examples: [`docs/gallery/deployment-light.svg`](../../../docs/gallery/deployment-light.svg) · [dark](../../../docs/gallery/deployment-dark.svg)
