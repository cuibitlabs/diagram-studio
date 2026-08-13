# Tutorial

Seven short exercises. Each one produces a file you can open, and each teaches a
decision rather than a flag. Start to finish is about twenty minutes.

```bash
git clone <this repo>
cd diagram-studio
npm install
```

Node 18 or newer. There are no other dependencies.

---

## 1. Your first diagram, and why the type matters

```bash
npx diagram-studio types
```

Forty-three of them. The list is not a menu of styles — each entry names a
*communication job*, and picking the wrong one is the most expensive mistake in
this tool, because no amount of styling recovers from it.

```bash
npx diagram-studio create architecture -o first.svg
```

Open `first.svg`. Six boxes, orthogonal connectors, one accent.

Now make the same content answer a different question:

```bash
npx diagram-studio create sequence -o timing.svg
```

Architecture says *what talks to what*. Sequence says *in what order*. If a
reader is going to ask "and then what happens?", the arrows in an architecture
diagram will not answer them, no matter how neat they are.

**Rule of thumb.** Say the question out loud. "Which services does checkout
touch?" → architecture. "What happens when a payment fails?" → sequence or
flowchart. "Who is waiting on whom?" → swimlane.

Every type has a reference page that states when it is *wrong*:
[`skills/create-editorial-diagrams/references/`](skills/create-editorial-diagrams/references/).

---

## 2. Write a diagram as text

JSON is fine for machines and miserable in a pull request. The `.ds` language is
the same model in a form a reviewer can read a diff of.

Create `checkout.ds`:

```ds
architecture "Checkout platform"
describe "How an order reaches the ledger"

customer: actor "Customer" #user
web "Web app" / "Server rendered" #react
gateway: gateway "API gateway" *
orders "Orders" #go
ledger: store "Ledger" / "Append only" #postgresql
payments: external "Payment provider" #stripe

group "Public" {
  customer web
}

customer -> web
web -> gateway "TLS"
gateway -> orders
orders -> ledger "append"
orders ~> payments "authorise"
```

```bash
npx diagram-studio convert checkout.ds checkout.svg
```

Reading the source:

- `customer: actor` — the part before the colon is a key you reference in
  connections; after it is a **semantic role**. Roles pick the shape, so a store
  is a cylinder and an external system is a dashed stadium. That is what makes
  the diagram survive being photocopied.
- `*` marks the focal element. **Two per diagram, maximum.** Emphasis stops
  working when everything is emphasised.
- `#postgresql` is an icon. Icons are decoration — every node still carries its
  label, because a reader who does not recognise a logo still needs to be told
  what the box is.
- `~>` is a dashed connection: a *different kind* of relationship, not a
  less important one.
- Groups are declared separately from nodes so the file keeps model order.

Go the other way whenever you like:

```bash
npx diagram-studio convert checkout.svg.diagram.json checkout.ds   # after saving a project
```

---

## 3. Import what already exists

You almost certainly have Mermaid in a README and a `.drawio` someone made in
2021. Neither needs retyping.

```bash
npx diagram-studio import examples/sample-lifecycle.mmd -o lifecycle.svg
```

Note what it prints:

```
Source: mermaid · stateDiagram-v2 · 5 source nodes → 5 drawn
Collapsed: [*] pseudo-states became entry and terminal markers
```

That is the **fidelity ledger**, and it is the point. An import is an editorial
redraw, not a photocopy. Pass the ledger on — a redraw presented as a faithful
copy is how a reader ends up believing your diagram still shows every service
the original did.

draw.io works the same way, including the compressed files draw.io writes by
default:

```bash
npx diagram-studio import examples/sample-architecture.drawio -o platform.svg
```

Source coordinates are kept, because that file carried deliberate geometry. When
you want the engine's layout instead, open it in the studio and press
**Re-layout**, or drop `settings.preserveLayout`.

---

## 4. Cut it down, honestly

Imported diagrams are usually too big. There is a command for that, and it shows
its working.

```bash
npx diagram-studio simplify platform.drawio --level balanced -o simple.svg
```

```
Detail: balanced · 14 nodes → 9 · 18 connections → 12
Merged 2 duplicate nodes by label
Folded 3 parallel connections into one labelled edge
Dropped 1 unconnected element: Legacy note
```

Three levels:

| Level | Does |
| --- | --- |
| `light` | merges duplicate labels, folds parallel connections |
| `balanced` | also removes repeats and unconnected decoration |
| `aggressive` | also collapses pass-through nodes into the connection |

A node with a role, sublabel, icon or accent is **never** collapsed — those are
signals that it carries meaning. And every action lands in the project's
`provenance`, so the ledger is still there in six weeks.

---

## 5. Make it look like it belongs to you

```bash
npx diagram-studio brand https-example-styles.css -o theme.json
```

Or in the studio: **Brand** tab, paste a URL or drop a CSS file.

What happens is not colour-picking:

1. Custom properties are trusted first — `--brand-primary` is your design
   system telling you what the accent is.
2. Everything else is classified by saturation, lightness and frequency. A
   near-black body colour is `ink`, not an accent, whatever order it appears in.
3. Failing contrast is repaired by moving lightness while keeping hue.
   **Backgrounds are never moved** — the page colour is the one people
   recognise.
4. Every adjustment is reported.

```
17 colours sampled · type: Söhne · 2 adjusted for contrast
  adjusted muted: #a8a8a8 → #757575 (4.61:1)
```

Then check it survives:

```bash
npx diagram-studio audit checkout.diagram.json
```

Twelve contrast pairs, the composition budget, and the import ledger in one
pass. In the studio, the **Vision check** simulates four colour-vision types —
a diagram that stops working there is relying on hue, and the fix is shape and
dash pattern, not a different palette.

---

## 6. Deliver it to wherever it is going

The canvas follows the content by default. That is right for a document and
wrong for a deck, where every diagram wants the same stage.

```bash
npx diagram-studio create architecture --preset slide-16x9 --audience executive -o slide.svg
```

Two dials, both worth understanding:

**`--preset`** pins the canvas and centres the drawing. It shrinks to fit and
**never enlarges** — a four-node picture blown up to fill a slide looks like it
is hiding something.

**`--audience`** changes wording density, not size. `executive` removes
sublabels, icons and protocol labels; `engineer` keeps every port and
identifier. It runs *before* sizing, so the boxes shrink with the text instead
of leaving a hole where the detail was. Shrinking a detailed diagram is not the
same as redrawing it for a different reader.

Then pick a format:

```bash
npx diagram-studio convert checkout.ds deck.pptx    # real editable shapes
npx diagram-studio convert checkout.ds board.excalidraw
npx diagram-studio convert checkout.ds readme.txt   # box drawing, for a README
npx diagram-studio convert checkout.ds figma.svg --flat
npx diagram-studio convert checkout.ds Diagram.jsx  # React component
```

`--flat` matters: Figma and Illustrator do not apply a `<style>` block on
import, so every class-driven fill silently turns black. The flat SVG resolves
the styles into attributes and names each layer after its node.

A whole folder at once:

```bash
npx diagram-studio batch ./docs/diagrams --out ./docs/img --theme cobalt --variants
```

---

## 7. Hand it to an agent

Register the MCP server once and any MCP-speaking client gets typed tools plus
the composition budget as server instructions:

```bash
claude mcp add diagram-studio -- node ./bin/mcp-server.mjs
```

`.mcp.json`, `.vscode/mcp.json` and `.cursor/mcp.json` ship with the repo, so
opening it is enough for Claude Code, VS Code Copilot agent mode and Cursor.
Everything else is in [`adapters/MCP.md`](adapters/MCP.md) — the config key name
differs between clients, and that is usually why a working server looks broken.

Then ask for work in plain words:

> Import `platform.drawio`, simplify it to balanced detail, match it to our
> website's palette, and export a 16:9 slide and a README-friendly ASCII version.

The agent gets `list_diagram_types`, `create_diagram`, `import_diagram`,
`render_diagram`, `audit_diagram` and `extract_brand`. Tool failures come back
as content it can correct, not as a dead session.

---

## The rules worth remembering

1. **Pick the type by the question**, not by habit. Every reference page says
   when its form is wrong.
2. **Nine nodes, twelve connections, two accents.** Past that, split into an
   overview plus a detail diagram. The review panel and `audit` will tell you.
3. **Nothing is invented.** A missing chart value is a gap and a note, never a
   zero. If your source has no number, the diagram will not show one — and if a
   diagram *does* show one, it came from your model.
4. **An import is a redraw.** Pass on the ledger.
5. **Shape carries meaning**, so the diagram works in greyscale and for a reader
   who cannot separate your accent from your ink.

## Where to go next

- [`SKILL.md`](skills/create-editorial-diagrams/SKILL.md) — the full workflow
- [`references/diagram-types.md`](skills/create-editorial-diagrams/references/diagram-types.md) — all 43, and how to choose
- [`references/semantic-patterns.md`](skills/create-editorial-diagrams/references/semantic-patterns.md) — behaviour that decides the type before shape does
- [`assets/index.html`](skills/create-editorial-diagrams/assets/index.html) — 215 example pages
- [`docs/adr/`](docs/adr/) — why the system works the way it does
