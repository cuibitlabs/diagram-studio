# Import and export

## Mermaid

Accept `.mmd`, `.mermaid`, and fenced Mermaid blocks in Markdown. Support common flowchart, sequence, state, ER, Gantt, journey, and timeline forms. Parse source as text. Do not execute directives, JavaScript, click targets, or external URLs.

```bash
python3 scripts/diagram_tool.py mermaid input.mmd output.diagram.json
```

## draw.io

Accept plain `mxGraphModel` XML and `.drawio` containers. The script also handles the common base64, raw-DEFLATE, URI-encoded diagram payload. Do not follow hyperlinks or load external resources from cells.

```bash
python3 scripts/diagram_tool.py drawio input.drawio output.diagram.json
```

Keep cell labels, geometry, source and target IDs, and useful edge labels. Normalize HTML labels to readable text. Ignore unsupported styling rather than executing or translating it unsafely.

## Brand source

Extract frequent colors and the first meaningful font family from local HTML or CSS:

```bash
python3 scripts/diagram_tool.py brand site.css brand.json
```

Treat this as a starting palette. Run contrast checks before use.

## Rendering

Render a project to a self-contained HTML/SVG file:

```bash
python3 scripts/diagram_tool.py render project.diagram.json diagram.html
```

For PNG or PDF, prefer the browser studio export because it preserves the exact SVG composition. If CairoSVG is installed, `diagram_tool.py export` can convert the rendered SVG.

## Security limits

- Cap imports at 2 MiB, 200 nodes, 400 edges, and 20,000 source lines.
- Reject XML with document type declarations or entity declarations.
- Never execute Mermaid click directives or draw.io links.
- Escape all imported labels before inserting them into HTML or SVG.
