# Semantic patterns

Some diagrams are decided by behaviour rather than by shape. Read this before choosing a type when one of these patterns is the point of the picture — it often changes the answer.

A pattern never adds a new diagram type. It tells you which existing type to use and what the drawing has to make visible.

## Fan-in

Many producers, one consumer. The claim is usually about load, coupling or a single point of failure.

- **Type:** architecture or data flow.
- **Draw:** the consumer once, centred on its own rank, with the producers spread on the rank before it. The router spaces the attach points so the fan is legible rather than a bundle.
- **Make visible:** how many producers there are. If the count is the point, say it in a sublabel rather than drawing forty boxes.
- **Trap:** drawing the fan and then adding a second fan-out on the same diagram. Split them.

## Fan-out

One producer, many consumers. Usually about blast radius or contract stability.

- **Type:** architecture, or a tree when the consumers are owned by the producer.
- **Make visible:** whether the consumers are equivalent. If one is different — the only synchronous consumer, say — give it the accent and label the edge.

## Governance boundary

Something must be approved, signed or reviewed before it proceeds.

- **Type:** flowchart if the decision has outcomes, swimlane if the point is who decides.
- **Draw:** the gate as a decision, with both outcomes labelled. A gate with only the happy path drawn is not a governance diagram.
- **Make visible:** who holds the gate, in the lane or the sublabel.

## Trust boundary

A request crosses from a zone with one set of assumptions into another.

- **Type:** network, or architecture with groups.
- **Draw:** the boundary as a group, and everything outside it dashed. Never rely on colour alone: a printed copy loses it.
- **Make visible:** what crosses, on the edge — port, protocol, credential.

## Feedback loop

An output changes a later input.

- **Type:** loop when the cycle *is* the subject; otherwise a dashed edge back into the flow.
- **Draw:** the returning edge dashed, so it reads as a different kind of relationship from the forward path.
- **Trap:** drawing a wheel because it looks strategic. If there is a last step, it is a process.

## Ownership hand-off

Work changes hands and the hand-off is where things go wrong.

- **Type:** swimlane.
- **Draw:** lanes from the model's `lane` field, never inferred from position. The hand-offs are the interesting moments — make sure they are visible and labelled.

## Tiering by guarantee

Data or components are separated by what they promise, not by what built them.

- **Type:** medallion for data quality tiers, layers for abstraction.
- **Draw:** the promotion rule on the arrow. It is the point of the pattern.

## Redundancy

Two paths exist so that one can fail.

- **Type:** architecture or network.
- **Draw:** both paths, with the standby dashed and labelled as such. A redundancy diagram that draws only the active path is describing a single point of failure.

## Time-boxed commitment

Work is grouped by when it is promised, not when it is scheduled.

- **Type:** roadmap.
- **Trap:** dates you do not have. Horizons are named commitments.

## Measurement

The claim rests on numbers.

- **Type:** bar, line, scatter or radar — see their references for the honesty rules.
- **Rule:** if the source has no number, the diagram shows no number. A missing value is a gap and a note, never a zero.
