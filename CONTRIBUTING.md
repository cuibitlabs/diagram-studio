# Contributing

## Setup

```bash
npm install
npm run dev
```

## Before opening a pull request

```bash
npm run check
python test/test_skill_tool.py
python scripts/run-verifiers.py
```

All three must pass. CI runs them on Linux, Windows, and macOS.

## Standards

- **Geometry** — every coordinate, size, gap, radius, and font size is divisible by 4.
- **Connectors** — orthogonal elbows only. No diagonals outside radial and chart families.
- **Accent budget** — at most two accent elements per diagram.
- **Complexity budget** — at most 9 nodes and 12 edges in a delivered diagram; split into overview plus detail beyond that.
- **Accessibility** — every SVG carries a unique-prefixed `<title>`/`<desc>` pair, `role="img"`, and passes the contrast checker.
- **No fabricated content** — renderers never invent labels, values, or units that are not present in the project model.

## Adding a diagram type

1. Add the entry to `DIAGRAM_TYPES` in `src/model.js`.
2. Add `src/types/<id>.js` exporting `{ layout, draw }`.
3. Add `skills/create-editorial-diagrams/references/type-<id>.md`.
4. Add example assets in light, dark, and full variants.
5. `python scripts/verify-docs-sync.py` must stay green.

## Commit style

Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
