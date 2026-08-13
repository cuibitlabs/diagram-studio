# Brand onboarding

Getting a diagram to look like it belongs to an organisation is a mapping problem, not a colour-picking one.

## What happens

1. **Collect.** Every concrete colour in the source is parsed — hex, `rgb()`, `hsl()` and `oklch()` — and counted.
2. **Trust the tokens.** Custom properties are the site's own design system, so `--brand-primary`, `--surface-card` and `--text-strong` are mapped to `accent`, `panel` and `ink` by name before anything else is considered.
3. **Classify the rest.** Remaining colours are scored by saturation, lightness and frequency. An accent is colourful and mid-toned; a surface is pale and flat; ink is dark. Document order is irrelevant — the old behaviour of taking the first two hex values it found produced a "brand" from whatever appeared earliest in the stylesheet.
4. **Derive.** `muted`, `line` and `lineStrong` are mixed from ink and paper so they sit in the same family. `onAccent` is whichever of white or ink reads better on the accent.
5. **Handle dark brands.** A dark page gets a panel one step lighter, not a light card on a dark page.
6. **Repair.** Every failing contrast pair is fixed by moving lightness while preserving hue, searching in both directions. Backgrounds are never moved — the page colour is the value people recognise.
7. **Report.** Every adjustment is returned, and shown.

```text
17 colours sampled · type: Söhne · 2 adjusted for contrast
  adjusted muted: #a8a8a8 → #757575 (4.61:1)
  adjusted onAccent: #ffffff → #1a1512 (5.12:1)
```

## Doing it

**In the studio** — Brand tab. Paste a URL, or drop an HTML or CSS file. A blocked site falls back to a palette derived deterministically from the domain, and says so rather than pretending it read the site.

**On the CLI**

```bash
diagram-studio brand site.css -o theme.json
diagram-studio create architecture --theme cobalt -o out.svg
```

**Through MCP** — the `extract_brand` tool returns the theme and the report.

## Checking it

Run the vision check in the Brand tab. A diagram that stops working under deuteranopia is relying on hue: give the roles their shapes, dash the external elements, and label what matters.

Then `diagram-studio audit project.diagram.json`, which prints every contrast pair with its ratio and target.

## When a brand cannot be honoured

Some brands are built on colour combinations that cannot carry 12 px text. The repair will get as close as the hue allows and report what it could not resolve. Say so plainly rather than shipping a diagram that half the audience cannot read — the honest options are a larger label size, a different role for the brand colour, or using it as `accent2` where the contrast requirement is 3:1 rather than 4.5:1.
