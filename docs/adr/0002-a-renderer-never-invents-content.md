# 2. A renderer never invents content

**Status:** accepted

## Context

The previous renderer printed `SHARED MEMORY` in the centre of every loop diagram, `HIGH VALUE` and `HIGH EFFORT` on every quadrant regardless of what the axes measured, invented a duration for every Gantt task, positioned scatter points with `(index * 151) % 760`, and shipped `Double-click to edit` into exported files as a node's sublabel.

None of that came from the model. All of it looked like data.

A diagram is persuasive in a way prose is not: a reader assumes a bar has a length because something was measured. Fabricated content in a diagram is worse than fabricated content in a sentence, because it is harder to notice and harder to challenge.

## Decision

A renderer draws what the model contains and nothing else.

Specifically:

- A chart category with no value renders a gap and is counted in a note. It is never zero.
- A funnel is proportional only when every level has a value; otherwise the steps are evenly sized and the diagram does not imply measurement.
- A journey draws its sentiment line only when every stage has a measured value.
- A Gantt task without a start and a duration is listed as unscheduled.
- A loop's hub is drawn only when `diagram.hub` exists, with its text.
- Axis names come from `diagram.axes`.
- Scatter points require both coordinates; points missing one are named under the plot.

## Consequences

- Some starter content looks emptier than it used to. That is the correct appearance for a diagram with no data in it.
- Renderers need more model fields, which is why the `.ds` language and the type references list what each type reads.
- A regression test renames every node and asserts that none of the old fabricated strings can appear.
