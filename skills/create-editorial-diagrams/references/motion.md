# Motion

Motion is opt-in, carries no meaning on its own, and is switched off entirely for anyone who has asked for reduced motion. A diagram that only works when it moves is a diagram that fails in a PDF.

## The contract

1. **Static is the default.** `settings.motion` is unset unless the author asks.
2. **The static frame is complete.** Every element is present and readable with animation disabled; motion only changes the order in which attention arrives.
3. **Reading order, not document order.** Steps come from the graph rank, so a reveal follows the path a reader would take.
4. **Reduced motion is honoured** in the stylesheet, not by a runtime check, so it holds in an exported file with no JavaScript.
5. **No motion in print output.** PDF and PNG exports render the finished state.

## Modes

| Mode | What it does | Controls | Use it for |
| --- | --- | --- | --- |
| _(unset)_ | Nothing moves. | — | Everything, unless there is a reason. |
| `reveal` | Elements fade and rise in, staggered by rank. One run, no replay. | none, CSS only | A diagram embedded in a page that is being talked through. |
| `step` | Paused states the reader advances. | Play/Pause, ←/→, Show all, live step count | Teaching, comparing two traces, walking a room through a decision. |
| `loop` | The connector dash travels along the path. | none, CSS only | A cycle or a pipeline where continuous flow is the subject. |

Only `loop` repeats. `reveal` runs once and finishes complete; it never restarts on scroll.

## The `step` contract

`step` is the only mode that needs script, which is exactly where motion
contracts usually break — the diagram stops working when the script does not
run. So:

1. **The static frame is the source.** Every node, label and connector is in the markup and fully visible before any script runs. The rules that dim anything sit under `.motion-ready`, a class the controller adds *to itself*.
2. **No script, no problem.** JavaScript disabled, print, or a stable capture all give the finished diagram.
3. **`?motion=static` opts out** without editing the file — use it for screenshots.
4. **Reduced motion removes the transition, not the stepping.** The reader can still advance; nothing animates.
5. **The script never touches labels or values.** It toggles one class and updates a counter. No fetches, no markup injection.
6. **A live region announces the step**, so it is followable without sight.

The controls ship only when a diagram opts in, and only in the HTML export — an SVG has nowhere to put them.

```ds
architecture "Checkout platform"
motion step
```

```bash
diagram-studio create architecture --motion step -o walkthrough.html
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
