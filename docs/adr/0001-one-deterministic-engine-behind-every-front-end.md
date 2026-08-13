# 1. One deterministic engine behind every front end

**Status:** accepted

## Context

A diagram system that agents and people share has two obvious failure modes. Either the agent writes SVG by hand, in which case none of the layout, contrast or routing rules apply to it; or the CLI has its own simplified renderer, in which case a diagram generated on the command line does not match the one the studio draws from the same project, and every hand-off is a re-render with different results.

The previous version had both problems: the browser had one renderer, the Python CLI had a much simpler second one, and they disagreed about geometry.

## Decision

There is exactly one layout and drawing engine, in `src/`, and it is DOM-free. The browser studio, the CLI, the MCP server and the tests all call `buildSVG` with a project. Text is measured from a fixed advance-width table rather than from a loaded font, so measurement cannot vary with what the browser has finished downloading.

A test asserts that the CLI's output is byte-identical to the studio's for the same project, modulo generated ids.

## Consequences

- No canvas `measureText`, no `getBBox`, no layout that depends on a live DOM.
- Metrics are approximate against any real font. They are consistent, which matters more: a label that fits in one front end fits in all of them.
- A second renderer for a new target (ASCII, PowerPoint) must consume the engine's layout rather than reimplementing it.
- Python is no longer used for rendering; the CLI is Node, sharing the engine.
