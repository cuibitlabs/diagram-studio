# Repository listing

The values GitHub uses for search and for the card that appears when the repo is
shared. Kept here so they are versioned rather than living only in a settings
panel nobody can diff.

Paste them at **github.com/cuibitlabs/diagram-studio** → the **About** panel
(the gear icon at the top right of the repo page).

## Description

> Diagrams as code with a real layout engine. 43 types — architecture, C4, sequence, flowchart, ER, Wardley, Sankey, Gantt — from a text file, a Mermaid or draw.io import, or an AI agent over MCP. Measured text, orthogonal routing, audited WCAG contrast, 11 export formats. Browser studio, CLI and MCP server. Zero runtime dependencies.

The first ~150 characters are what appears in search results, so the type count
and the phrase people search for both sit at the front.

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

`v2.0.0` is tagged. `.github/workflows/release.yml` runs the full gate — 218
tests, the build and six verifiers — before publishing notes and a package
containing the built studio, the type gallery and the example library. A tag
never ships without that passing.
