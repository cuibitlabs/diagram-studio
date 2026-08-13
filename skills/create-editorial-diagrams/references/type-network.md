# Network topology

> Devices, zones and the links between them

- **Family:** `layered`
- **Type id:** `network`
- **Starter size:** 1600×480 px, 5 nodes, 4 connections
- **Default direction:** LR

## Use it for

Zones, devices and the links that cross a trust boundary.

## Do not use it for

Application logic. Nothing here says what the software does.

## Composition rules

- Zones are groups. Anything outside the trust boundary is dashed as well as grouped.
- Ports and protocols belong on the edges, in monospace.

## The mistake people make

Colouring zones and relying on that alone. A printed copy loses it.

## Model fields this type reads

Node: `dashed`, `icon`, `role`, `sublabel`, `tone`, `zone`

Diagram: `groups`

## Starter content

```ds
network "Network topology overview"
theme editorial
describe "Devices, zones and the links between them"

group "Perimeter" {
  internet: external "Internet" #globe
  edge "Edge" / "Load balancer" #balancer
}
group "Private network" {
  application-tier "Application tier" * #server
  private-subnet "Private subnet" / "No inbound route" #firewall
  database: store "Database" #database
}

internet -> edge "443"
edge -> application-tier
application-tier -> private-subnet
private-subnet -> database "5432"
```

## As Mermaid

```
%% Network topology overview
flowchart LR
  subgraph Perimeter
    N1["Internet"]
    N2["Edge · Load balancer"]
  end
  subgraph Private network
    N3["Application tier"]
    N4["Private subnet · No inbound route"]
    N5[("Database")]
  end
  N1 -->|443| N2
  N2 --> N3
  N3 --> N4
  N4 -->|5432| N5
```

## Build one

```bash
diagram-studio create network -o network.svg
```

Rendered examples: [`docs/gallery/network-light.svg`](../../../docs/gallery/network-light.svg) · [dark](../../../docs/gallery/network-dark.svg)
