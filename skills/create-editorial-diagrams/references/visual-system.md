# Editorial visual system

## The direction

A drafting plate, not a magazine spread.

The default skin used to be warm cream paper, a high-contrast serif and a
terracotta accent. That combination had become the house style of generated
design — it arrives regardless of subject, and it is also what the nearest
comparable project ships, so it read as neither distinctive nor ours.

The default is now `plate`: cool vellum rather than cream, graphite with a green
cast rather than jet black, and the three inks a technical drawing actually
uses — raw sienna for the one thing to look at first, deep teal for the
secondary cue, ultramarine for anything leaving the system. The serif is kept
for the diagram title and nothing else.

The nine palettes are all still there; `editorial` remains available if the warm
direction is what a brand needs.

## Tokens

Roles, not colour names. `paper` is the page, `panel` is a surface, `ink` is body text, `accent` is the one thing you want read first.

| Token | Role |
| --- | --- |
| `paper` | canvas |
| `paper2` | a recessed surface: filled lanes, plot grounds |
| `panel` | node and plot surfaces |
| `ink` | primary text |
| `muted` | secondary text, lane and section labels |
| `soft` | a third weight below `muted`: sublabels, boundary labels |
| `accent` | the focal element, at most two per diagram |
| `accentTint` | the fill behind an accent-**bordered** box, where a solid accent would shout |
| `accent2` | a secondary cue, and the selection ring in the editor |
| `link` | calls that leave the system — an external arrow that reads differently without spending the accent |
| `line` | hairlines and borders |
| `lineStrong` | connectors and arrowheads |
| `onAccent` | text sitting on the accent |

Nine palettes ship, and **every one is audited**: `scripts/lint-a11y.mjs` checks twelve contrast pairs per palette at the sizes the type scale actually uses, and fails the build on any that misses.

### Series colours

For the chart types that genuinely compare more than one entity, `--series-0…2`
provide quieter companions to the accent. The accent stays reserved for the
focal series: a chart with six equally loud series has no focal point at all.

## Typography

One scale, on the 4 px grid, defined in `src/engine/typography.js`:

| Entry | Size | Family | Used for |
| --- | --- | --- | --- |
| `diagramTitle` | 32 | serif | the editorial title above a diagram |
| `diagramLede` | 16 | sans | the standfirst |
| `section` | 12 | mono, uppercase | lane, group and axis names |
| `nodeTitle` | 16 | sans 700 | node labels |
| `nodeTitleSmall` | 14 | sans 700 | dense structures |
| `nodeSub` | 12 | sans 500 | role, owner, technology |
| `meta` | 12 | mono | ports, IDs, field types |
| `edgeLabel` | 12 | mono 600 | connector labels |
| `axis` | 12 | mono, uppercase | ticks and captions |
| `value` | 14 | mono 700 | numbers on a mark |
| `annotation` | 14 | serif italic | margin notes |

The family is emitted as a custom property, not a literal stack, so a style variant can redefine what "sans" means for a subtree. Never hard-code a size in a renderer.

## Geometry

- Base unit 4 px. Every coordinate, size, gap and radius is a multiple of it — `scripts/verify-geometry.mjs` enforces this across all 31 types.
- Node size is **measured, not assumed**: the box is derived from its wrapped text, so a label cannot clip. Truncation is reported rather than silently applied.
- Card padding 16–24 px, standard gap 24–40 px, border 1–1.5 px, corner radius 0–10 px.
- Connectors are orthogonal elbows with an 8 px corner radius. Attach points on the same side are spread at least 12 px apart and ordered so connectors fan out without crossing at the border. A connector never passes through a node that is not its endpoint; when the direct routes are blocked, an A\* pass over a visibility lattice finds one that is not.
- A jog smaller than 8 px is collapsed into a straight run, so slightly different node heights do not produce a visible stair-step.
- Accent elements: no more than two, and no more than 20 percent of the composition.

## Emphasis

An accent node is a **tinted card behind an accent border**, with the text still
in ink. Enough to pull the eye, without turning the focal element into a button
— a solid block reads as a control, and it forces the label into reversed text
that is harder to keep legible across nine palettes.

`tone: "solid"` gives the filled block for the rare case where the focal element
really should read as a slab. `tone: "muted"` recedes.

## The plate

`settings.plate` adds the furniture: hairline rules above and below the drawing,
the type name and the canvas spec on the top rule, the census on the bottom, and
**module ticks at the real 4 px grid** the engine snaps every coordinate to.

It is the signature of the system and the one place it is loud. It is also not
decoration: a reader who wants to know whether a drawing was measured or
eyeballed can see the answer in the corner. Off by default — a diagram pasted
into a slide does not want a frame around it.

## Accessibility

- 4.5:1 for normal text, 3:1 for large text and essential graphical objects. The audit is in the product, not just in review: the editor shows failing pairs, and `diagram-studio audit` prints the table.
- Every SVG carries `role="img"` and an `aria-labelledby` pair whose ids are **prefixed per render**, so two diagrams on one page do not collide.
- Status is never carried by hue alone — shape, dash pattern and labels carry it too. The editor can simulate protanopia, deuteranopia, tritanopia and achromatopsia to prove it.
- Text stays as DOM text. No rasterised labels, no outlined glyphs, unless the destination demands it.
- Interactive nodes are focusable and named.

## Quality review

At final delivery size:

1. The focal point is immediately visible.
2. No label clips, collides, or sits under a connector.
3. Connectors touch the intended shapes and the arrowheads face correctly.
4. It still reads in greyscale.
5. Every decorative element earns its space.
6. Nothing in the picture is absent from the model.
