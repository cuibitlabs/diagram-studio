# Fishbone

> One effect and the categories of cause behind it

- **Family:** `fishbone`
- **Type id:** `fishbone`
- **Starter size:** 1296×608 px, 11 nodes, 0 connections

## Use it for

Grouping the causes of one effect so the argument is about categories, not a flat list.

## Do not use it for

A cause you already understand. If there is one cause, write the sentence.

## Composition rules

- One effect, four to six categories, and causes that sit under the right one.
- Categories are chosen for the domain — the manufacturing six are not compulsory.
- The bones are diagonal because they group; they are not routes.

## The mistake people make

Filling every category evenly. An empty category is a finding.

## Model fields this type reads

Node: `cause`, `fixedSize`, `tone`

## Starter content

```ds
fishbone "Fishbone overview"
theme plate
describe "One effect and the categories of cause behind it"

people "People"
process "Process"
tooling "Tooling"
data "Data"
two-people-know-the-depl "Two people know the deploy"
no-pairing-on-releases "No pairing on releases"
release-checklist-is-ver "Release checklist is verbal"
rollback-is-manual "Rollback is manual"
staging-drifts-from-prod "Staging drifts from production"
migrations-are-unversion "Migrations are unversioned"
releases-fail-on-fridays "Releases fail on Fridays" *
```

## As Mermaid

> Mermaid cannot express a fishbone. Exported as a flowchart of the same elements; values, axes and positions are not represented.

```
%% Fishbone overview
%% Mermaid cannot express a fishbone. Exported as a flowchart of the same elements; values, axes and positions are not represented.
flowchart LR
  N1["People"]
  N2["Process"]
  N3["Tooling"]
  N4["Data"]
  N5["Two people know the deploy"]
  N6["No pairing on releases"]
  N7["Release checklist is verbal"]
  N8["Rollback is manual"]
  N9["Staging drifts from production"]
  N10["Migrations are unversioned"]
  N11["Releases fail on Fridays"]
```

## Build one

```bash
diagram-studio create fishbone -o fishbone.svg
```

Rendered examples: [`docs/gallery/fishbone-light.svg`](../../../docs/gallery/fishbone-light.svg) · [dark](../../../docs/gallery/fishbone-dark.svg)
