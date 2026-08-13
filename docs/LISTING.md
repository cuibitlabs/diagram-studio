# Repository listing

The values GitHub uses for search and for the card that appears when the repo is
shared. Kept here so they are versioned rather than living only in a settings
panel nobody can diff.

Paste them at **github.com/cuibitlabs/diagram-studio** → the **About** panel
(the gear icon at the top right of the repo page).

## Description

> Diagrams as code with a real layout engine. 43 types from a text file, a Mermaid or draw.io import, or an agent over MCP. Measured text, orthogonal routing, audited contrast. Studio, CLI and MCP server, zero dependencies.

219 characters. GitHub allows 350, but the About panel renders it as one
unbroken block in a narrow column, so a description near the ceiling reads as a
wall rather than a sentence. The first ~150 characters are what survives into a
search result, which is why the claim and the type count sit at the front.

Naming individual types here — C4, Wardley, Sankey, Gantt — was tempting and
wrong. A list of nouns in prose reads as keyword stuffing, and topics are the
field GitHub actually matches on for those terms. They are covered below
instead, which is the same search reach without the sidebar cost.

## Topics

GitHub allows twenty. These are chosen for what people actually type into the
search box, not for what the project calls itself internally.

```
diagrams
diagrams-as-code
diagram-generator
architecture-diagram
c4-model
flowchart
sequence-diagram
wardley-map
sankey-diagram
svg
mermaid
drawio
excalidraw
mcp
mcp-server
model-context-protocol
accessibility
wcag
graph-layout
documentation
```

## Website

Leave blank until GitHub Pages is enabled. Once it is:
`https://cuibitlabs.github.io/diagram-studio/`

Pages is wired up in `.github/workflows/pages.yml` and publishes the studio with
the type gallery alongside it. Enable at **Settings → Pages → Source: GitHub
Actions**.

## Social preview

**Settings → General → Social preview**, 1280×640 PNG. This is the image that
appears when the repo is linked on Slack, X or LinkedIn, and a repo without one
shows a grey placeholder.

There is no rasteriser in this toolchain, so no PNG is generated. To make one:
open `docs/gallery/architecture-light.svg` in a browser at 1280×640 and screenshot
it, or open any page from `skills/create-editorial-diagrams/assets/` and capture
the figure.

## Release

`v0.1.0` is tagged. `.github/workflows/release.yml` runs the full gate — 218
tests, the build and six verifiers — before publishing notes and a package
containing the built studio, the type gallery and the example library. A tag
never ships without that passing.
