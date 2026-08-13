# Motion

Motion is opt-in, carries no meaning on its own, and is switched off entirely for anyone who has asked for reduced motion. A diagram that only works when it moves is a diagram that fails in a PDF.

## The contract

1. **Static is the default.** `settings.motion` is unset unless the author asks.
2. **The static frame is complete.** Every element is present and readable with animation disabled; motion only changes the order in which attention arrives.
3. **Reading order, not document order.** Steps come from the graph rank, so a reveal follows the path a reader would take.
4. **Reduced motion is honoured** in the stylesheet, not by a runtime check, so it holds in an exported file with no JavaScript.
5. **No motion in print output.** PDF and PNG exports render the finished state.

## Modes

| Mode | What it does | Use it for |
| --- | --- | --- |
| _(unset)_ | Nothing moves. | Everything, unless there is a reason. |
| `reveal` | Elements fade and rise in, staggered by rank. | A diagram embedded in a page that is being talked through. |
| `loop` | The connector dash travels along the path. | A cycle or a pipeline where continuous flow is the subject. |

```ds
architecture "Checkout platform"
motion reveal
```

Or in a project: `"settings": { "motion": "reveal" }`.

## Presentation mode

The studio's presentation mode (F5) is a different mechanism and a better one for a live talk: it steps the reveal under your control rather than on a timer, so a question does not leave you waiting for an animation. It uses the same rank order, and it also respects reduced motion.

## What not to animate

- **Layout.** Nodes never slide into position; a moving layout reads as a system doing something.
- **Emphasis.** A pulsing accent is noise. If something matters, it is already the accent.
- **Charts.** Bars growing from zero misstate the data during the animation.
- **Anything on a loop the reader cannot stop**, apart from the deliberate `loop` mode on a cycle.

## Verifying

`scripts/lint-skin.mjs` fails the build on shadows, glows, blurs and gradients, and the motion rules live in one place in `src/render/skin.js` so the reduced-motion block cannot be forgotten for a new animation.
