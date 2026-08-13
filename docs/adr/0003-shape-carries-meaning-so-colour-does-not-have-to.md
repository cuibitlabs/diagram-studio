# 3. Shape carries meaning, so colour does not have to

**Status:** accepted

## Context

WCAG 1.4.1 says colour must not be the only means of conveying information. In practice most diagram tools satisfy this by adding a legend, which moves the problem rather than solving it: the reader still has to hold a colour-to-meaning mapping in their head while scanning.

The system also has to survive a photocopy, a projector with a bad gamma curve, and a reader with deuteranopia — which is roughly one in twelve men.

## Decision

Every semantic role has a shape, and the accent is reserved for emphasis rather than for classification.

- Store → cylinder. Decision → diamond. External → dashed stadium. Gateway → hexagon. Input/output → parallelogram. Event → circle. Legacy/optional → dashed box.
- The accent means "this is what the diagram is about", and there are at most two per diagram. It never means "this is a database".
- Dash pattern distinguishes a different *kind* of relationship (a fallback, a return, a boundary crossing), not a different *category* of thing.

The editor can simulate protanopia, deuteranopia, tritanopia and achromatopsia, so the claim can be checked rather than asserted.

## Consequences

- Renderers size nodes with shape padding, because a diamond needs far more box than a rectangle for the same label.
- Adding a role means adding a shape, not a colour.
- Legends are rarely needed, which removes a whole class of legend-diagram drift.
