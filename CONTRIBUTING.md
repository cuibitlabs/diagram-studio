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

1. Add `src/types/<id>.js` exporting `{ id, label, description, family, sample, layout, draw }`.
2. Register it in `src/types/index.js`.
3. Add its entry to `src/types/guidance.js` — when the form is right, when it is
   wrong, its composition rules, and the mistake people make with it. The build
   fails without it, which is the intended pressure: a type nobody can explain
   when to use should not ship.
4. Run `npm run docs`. The reference page and the five example variants are
   generated; do not hand-edit either.
5. `python scripts/run-verifiers.py` must stay green.

## Commit style

Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
