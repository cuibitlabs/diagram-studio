# Output specification

## Pick the destination first

| Destination | Size | Minimum label | Notes |
| --- | --- | --- | --- |
| Document, inline | fits the text column, ~720 px wide | 14 px | SVG; let it scale with the page |
| Document, full width | up to 1200 px | 14 px | SVG |
| Slide, 16:9 | 1600×900 | 16 px | fewer nodes; turn the canvas title on |
| Web page | fluid | 14 px | SVG with `max-width:100%` |
| Social | 1200×675 or 1080×1080 | 18 px | five nodes at most |
| README | 100 characters wide | — | ASCII (`.txt`) |
| Print | any | 14 px | PDF; motion is not rendered |

The canvas is not fixed. Layout produces the drawing, and the canvas is fitted to it plus margins, so a five-node diagram is not padded out to the size of a twenty-node one.

## Detail levels

| Level | Nodes | What it keeps |
| --- | --- | --- |
| `minimal` | ≤ 5 | the spine of the argument |
| `balanced` | ≤ 9 | the spine plus the elements a reader will ask about |
| `detailed` | ≤ 15 | split into overview plus detail instead, wherever possible |

Above nine nodes the reading order stops being obvious. The editor's review panel and `diagram-studio audit` both say so.

## Formats

| Format | When | Caveat |
| --- | --- | --- |
| **SVG** | the default for everything | — |
| **HTML** | a self-contained file to send someone | no network requests |
| **PNG** | a destination that cannot take SVG | 2× by default; `transparent` available |
| **PDF** | print and slide decks | a high-resolution raster inside a PDF wrapper — text is not selectable. When that matters, place the SVG in the destination application instead |
| **`.diagram.json`** | the editable project | round-trips exactly |
| **`.ds`** | the form to commit | round-trips exactly |
| **Mermaid** | back into a README | lossy for anything Mermaid cannot express; the writer says what was lost |
| **draw.io** | handing over to a draw.io user | uncompressed, so it diffs |
| **ASCII** | READMEs, commits, terminals | edge labels are listed underneath |

## Variants

**Export → Variants** writes three files at once: light, dark, and titled. Dark is not an inverted light theme; it is a separate audited palette.

## The output contract

Every SVG:

- stable `viewBox`, explicit `width`/`height`
- `role="img"` and `aria-labelledby` referring to a `<title>` and `<desc>` with ids prefixed per render
- markers, filters and icon symbols namespaced by the same prefix
- text as text
- no external references of any kind

Check it with `python scripts/run-verifiers.py`, which runs the geometry, import, accessibility, skin and documentation checks together.
