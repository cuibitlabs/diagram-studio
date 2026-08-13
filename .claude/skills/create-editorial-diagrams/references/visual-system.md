# Editorial visual system

## Tokens

Use semantic tokens: `paper`, `panel`, `ink`, `muted`, `accent`, `accent2`, and `line`. Default light palette:

```css
--paper: #f3f0e9;
--panel: #fffdf8;
--ink: #1d211f;
--muted: #6e746f;
--accent: #e85d3f;
--accent-2: #174f46;
--line: #b9b5ac;
```

Default dark palette:

```css
--paper: #111512;
--panel: #191e1a;
--ink: #f1efe7;
--muted: #9ba69e;
--accent: #ff7557;
--accent-2: #64d8b0;
--line: #424b44;
```

## Typography

- Editorial title: a readable serif, optional italic.
- Node label: a neutral sans serif, 600 to 750 weight.
- Metadata: a restrained monospace at a smaller size.
- Use sentence case. Keep node labels under seven words when possible.

## Geometry

- Base unit: 4 px.
- Card padding: 16 to 24 px.
- Standard gap: 24 to 40 px.
- Border: 1 to 1.5 px.
- Corner radius: 0 to 10 px.
- Connector arrowheads: compact and proportional to the line.
- Accent elements: no more than 20 percent of the composition.

## Accessibility

- Maintain 4.5:1 contrast for normal text and 3:1 for large text and essential graphical objects.
- Provide a meaningful SVG title and description.
- Do not encode status only through hue. Add labels, shapes, line styles, or patterns.
- Preserve DOM text in interactive or web-delivered SVG.
- Give interactive nodes keyboard focus and an accessible label.

## Quality review

Check at the final delivery size:

1. The focal point is immediately visible.
2. Labels do not clip, collide, or sit under connectors.
3. Connectors touch the intended shapes and arrowheads face correctly.
4. The visual remains understandable in grayscale.
5. Every decorative element earns its space.
