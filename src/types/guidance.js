/**
 * Editorial guidance per diagram type.
 *
 * This is the judgement the renderer cannot encode: when a form is the right
 * one, when it is the wrong one, and the mistake people actually make with it.
 * `scripts/build-type-docs.mjs` turns it into the reference docs, so guidance
 * and behaviour cannot drift apart the way hand-written docs do.
 */

export const GUIDANCE = {
  "c4-context": {
    use: "Agreeing what the system is and who it touches, before anyone argues about how it works.",
    avoid: "Any question about internals. A context diagram showing a database has stopped being one.",
    compose: [
      "One system with the accent. Everything else is a person or another system.",
      "Label every relationship with what it is for, in the reader's words, not the protocol.",
      "External systems are dashed, so the boundary reads without colour.",
    ],
    mistake: "Adding a second system you also own. If two systems matter equally, you have two context diagrams.",
  },
  "c4-container": {
    use: "Showing the separately deployable or storable parts of one system, and what each is built with.",
    avoid: "Classes, functions or modules — that is a level below this one, and usually better read as code.",
    compose: [
      "Every container names its technology in the sublabel. That is the whole difference from the context view.",
      "The system boundary is a group, so what is inside is data rather than a matter of position.",
      "Stores are cylinders; people stay stadiums.",
    ],
    mistake: "Drawing a container per service in a large estate. Above about eight, draw the boundary and split.",
  },
  "service-blueprint": {
    use: "Finding where a service breaks: what the customer does, what they see, and what has to happen out of sight.",
    avoid: "A journey where nothing behind the scenes is in question. Use a customer journey.",
    compose: [
      "The lanes are fixed by the format, so a diagram can be compared with another one.",
      "The line of visibility is drawn heavier than the other rules — it is the thing to point at.",
      "Every crossing of that line is a hand-off worth naming.",
    ],
    mistake: "Filling the backstage lanes with system names instead of the work being done.",
  },
  "value-stream": {
    use: "Showing that the delay is between the steps, not inside them.",
    avoid: "Work with no measured waiting time. Without it there is no ratio, and the format has no argument.",
    compose: [
      "Process time and wait time are both required for a step to count toward the ratio.",
      "The efficiency figure is computed from the model and shown with its working.",
      "A step missing either number is drawn and listed as unmeasured, never assumed to be zero.",
    ],
    mistake: "Optimising the low bars. The ladder exists to show that the high ones are the problem.",
  },
  kanban: {
    use: "Making work in progress and its limit visible at the same time.",
    avoid: "Planning. A board shows what is happening now, not what is intended.",
    compose: [
      "Columns are the real workflow states, including the waiting ones.",
      "A column without a limit is a list; state the limit and let an over-limit column be marked.",
      "Cards carry the blocker, not the assignee.",
    ],
    mistake: "A Done column that grows forever. Archive it, or the board stops being readable.",
  },
  wardley: {
    use: "Arguing about what to build, buy and outsource, by position rather than by opinion.",
    avoid: "Anything where evolution is not in question. A dependency graph is simpler and says more.",
    compose: [
      "Both coordinates are data. A component with no stated evolution is listed as unplaced, not guessed at.",
      "Movement is drawn only where the model claims it, because a movement arrow is a prediction.",
      "Dependencies point down the chain, from what the user sees to what it rests on.",
    ],
    mistake: "Treating position as fact. The value of the map is that it can be wrong in public.",
  },
  fishbone: {
    use: "Grouping the causes of one effect so the argument is about categories, not a flat list.",
    avoid: "A cause you already understand. If there is one cause, write the sentence.",
    compose: [
      "One effect, four to six categories, and causes that sit under the right one.",
      "Categories are chosen for the domain — the manufacturing six are not compulsory.",
      "The bones are diagonal because they group; they are not routes.",
    ],
    mistake: "Filling every category evenly. An empty category is a finding.",
  },
  sankey: {
    use: "Showing where a quantity actually goes.",
    avoid: "Flows you cannot measure. Thickness is a number, so an unmeasured flow cannot be drawn.",
    compose: [
      "A band's thickness is its value; a node's height is the greater of in and out.",
      "Where in and out disagree the imbalance is named rather than smoothed.",
      "Keep to three or four columns — ribbons cross badly beyond that.",
    ],
    mistake: "Using it for a process. A Sankey answers 'how much', never 'in what order'.",
  },
  treemap: {
    use: "Share of a whole across many items, where a pie would be unreadable.",
    avoid: "Comparing two treemaps. Area is hard to compare between charts; use bars.",
    compose: [
      "Squarified so tiles stay labelable — a sliver can be neither read nor compared.",
      "Items with no value are listed underneath, not given a token tile.",
      "Print the value and the share; area alone cannot be read precisely.",
    ],
    mistake: "More than about fifteen tiles. Aggregate the tail into a named remainder.",
  },
  heatmap: {
    use: "One measure across two categories, where the pattern matters more than any single figure.",
    avoid: "A single series. That is a bar chart, and easier to read.",
    compose: [
      "The number is printed in every cell; intensity is the second encoding, not the only one.",
      "The label colour is chosen by measured contrast against its own cell.",
      "An unmeasured cell is left empty and marked, never shaded as zero.",
    ],
    mistake: "A rainbow scale. One hue ramp keeps the order readable and survives colour-vision differences.",
  },
  waterfall: {
    use: "Explaining how a starting figure became an ending one.",
    avoid: "Categories that do not sum to the total. The format promises arithmetic.",
    compose: [
      "The closing bar is drawn from the running total, so a mismatch with the stated total is shown, not hidden.",
      "Increases and decreases are distinguished by direction and label, not by colour alone.",
      "Keep to about seven contributions; aggregate the rest.",
    ],
    mistake: "Reordering the contributions to make the story smoother. The order is part of the claim.",
  },
  "stacked-bar": {
    use: "Composition across categories, when the totals also matter.",
    avoid: "Comparing the middle bands. Only the bottom one shares a baseline.",
    compose: [
      "Series order is the model's and is never re-sorted; the legend names the comparable band.",
      "A missing series value leaves the band out and is counted, rather than padded with a zero.",
      "Four series at most, or the bands stop being distinguishable.",
    ],
    mistake: "Stacking percentages and totals in the same chart. Pick which question you are answering.",
  },
  architecture: {
    use: "Showing which systems exist and what talks to what.",
    avoid: "Explaining a sequence of events over time — use a sequence diagram; the arrows here mean 'depends on', not 'then'.",
    compose: [
      "Read left to right along the request path. The user or trigger is the leftmost element.",
      "Give the accent to the component the diagram is arguing about, not to the biggest box.",
      "Stores are cylinders and third parties are dashed stadiums, so the boundary survives greyscale.",
    ],
    mistake: "Drawing every service. An architecture diagram with twenty boxes is an inventory; pick the path being discussed.",
  },
  "high-level": {
    use: "One slide for an audience that does not run the system.",
    avoid: "Any conversation where someone will ask which queue it uses. Draw the architecture instead.",
    compose: [
      "Five blocks or fewer, no technology names, no protocol labels.",
      "Sublabels describe the job in the reader's language, not the implementation.",
    ],
    mistake: "Shrinking a detailed architecture instead of redrawing it. Detail removed by scaling is still detail the reader tries to parse.",
  },
  "current-state": {
    use: "Making an existing landscape and its constraints undeniable before proposing a change.",
    avoid: "Presenting the target state. Draw both, side by side, and label which is which.",
    compose: [
      "Legacy elements are dashed and recede; the constraint is written next to the element that causes it.",
      "Name the pain in the constraint text, not in the node label.",
    ],
    mistake: "Editorialising in the labels. Let the constraints do the arguing.",
  },
  flowchart: {
    use: "Decisions, branches, and what happens on each outcome.",
    avoid: "A linear sequence of steps with no branching — that is a process, and drawing it as a flowchart implies choices that do not exist.",
    compose: [
      "Top to bottom. Terminals are stadiums, decisions are diamonds.",
      "Every edge leaving a decision carries its condition. An unlabelled fork is the most common way a flowchart lies.",
      "Loops go back to the decision, not to the start, unless the whole thing really does restart.",
    ],
    mistake: "Nesting decisions more than three deep. Split into a second diagram at that point.",
  },
  process: {
    use: "An operational workflow where the order matters and nothing branches.",
    avoid: "Anything with a real decision in it. Use a flowchart.",
    compose: [
      "Step numbers come from the graph, so inserting a step renumbers the rest automatically.",
      "Sublabels say what 'done' means for that step.",
    ],
    mistake: "Using a process diagram to hide branching that exists in reality.",
  },
  state: {
    use: "The states a thing can be in and the events that move it between them.",
    avoid: "Describing who does the work. That is a swimlane.",
    compose: [
      "Every transition is labelled with its event, in the vocabulary of the domain.",
      "Declare the entry and terminal states rather than relying on inference — a lifecycle with a rejection path back to the first state has no state without an incoming transition.",
    ],
    mistake: "Mixing states with actions. 'Approved' is a state; 'Approve' is a transition.",
  },
  sequence: {
    use: "The order of messages between participants, especially where a round trip matters.",
    avoid: "Showing structure. Nothing here says what a participant is made of.",
    compose: [
      "Message order is the model's order and is never re-sorted; reordering would change the meaning.",
      "Returns are dashed with an open head, so a reader can see the round trips without counting arrows.",
      "Keep to six participants: the columns get too narrow to label beyond that.",
    ],
    mistake: "Drawing every retry and timeout. Show the happy path and note the exceptions.",
  },
  "data-flow": {
    use: "Where data comes from, what happens to it, and where it lands.",
    avoid: "Implying execution order. A data flow says 'feeds', not 'then'.",
    compose: [
      "Sources are parallelograms, transformations are boxes, stores are cylinders.",
      "Label the edges with what moves, not with how it moves.",
    ],
    mistake: "Labelling every arrow with the transport. Nobody is helped by five arrows all saying 'HTTP'.",
  },
  deployment: {
    use: "The path a release takes and the gates it passes.",
    avoid: "Runtime traffic. This is about promotion, not requests.",
    compose: [
      "Top to bottom, with environments as groups so the promotion boundary is visible.",
      "Failure paths are dashed and point back at the stage that has to be redone.",
    ],
    mistake: "Omitting the failure path, which is the part people actually ask about.",
  },
  network: {
    use: "Zones, devices and the links that cross a trust boundary.",
    avoid: "Application logic. Nothing here says what the software does.",
    compose: [
      "Zones are groups. Anything outside the trust boundary is dashed as well as grouped.",
      "Ports and protocols belong on the edges, in monospace.",
    ],
    mistake: "Colouring zones and relying on that alone. A printed copy loses it.",
  },
  er: {
    use: "Entities, their fields and how they relate.",
    avoid: "Showing behaviour or process. This is shape, not motion.",
    compose: [
      "Fields and types are the content; an entity drawn as an empty box answers nothing.",
      "Mark keys explicitly (PK, FK) rather than relying on position.",
      "Relationship labels read as a sentence: Customer places Order.",
    ],
    mistake: "Including every column. Show the keys and the fields the conversation is about.",
  },
  swimlane: {
    use: "A flow where ownership is the point: who does what, in what order.",
    avoid: "A flow with a single owner. The lanes add nothing.",
    compose: [
      "A node's lane is data, never a coordinate guess, so re-layout cannot reassign work to the wrong team.",
      "Hand-offs between lanes are the interesting moments; make sure they are visible and labelled.",
    ],
    mistake: "More than five lanes. At that point the diagram is an org chart with arrows.",
  },
  tree: {
    use: "A taxonomy: what contains what.",
    avoid: "Anything with a flow. Containment is not a direction of travel, which is why the connectors carry no arrowheads.",
    compose: ["Keep to three levels on one page.", "Siblings should be genuinely parallel in kind."],
    mistake: "Using a tree for a dependency graph, where a child can have two parents.",
  },
  "org-chart": {
    use: "Reporting lines and where accountability sits.",
    avoid: "Showing how work flows. Use a swimlane.",
    compose: ["Sublabels are the remit, not the job title.", "Vacancies are drawn dashed rather than omitted."],
    mistake: "Drawing the whole company. Draw the part the reader has a question about.",
  },
  nested: {
    use: "Hierarchy expressed by containment: 'is part of', not 'flows to'.",
    avoid: "More than four levels. The innermost box stops being readable.",
    compose: ["Label each ring on its own top edge.", "Give the accent to the layer under discussion."],
    mistake: "Using containment to imply a call direction it does not have.",
  },
  "mind-map": {
    use: "Opening a topic out — branches from one idea, before there is any structure.",
    avoid: "A finished argument. Once the relationships are known, a tree or an architecture is clearer.",
    compose: ["One central idea. Two levels of branches.", "Spokes are straight; radial layouts are exempt from the orthogonal rule."],
    mistake: "Presenting a mind map as a conclusion. It is a starting point.",
  },
  loop: {
    use: "A reinforcing cycle where each stage feeds the next.",
    avoid: "A process that ends. If there is a last step, it is a process.",
    compose: [
      "Four to six stages. The hub is optional and its text comes from the model — the renderer never invents a centre label.",
      "The reinforcement is the claim; make sure each stage genuinely feeds the next.",
    ],
    mistake: "Drawing a wheel because it looks strategic, when the stages are just a list.",
  },
  layers: {
    use: "Stacked abstractions where each layer only knows the one below.",
    avoid: "Systems that call across layers freely. The picture would be a lie.",
    compose: ["Equal bands unless the model weights them.", "Sublabels say what the layer is responsible for."],
    mistake: "Adding an arrow. If direction matters, it is an architecture diagram.",
  },
  medallion: {
    use: "Raw, cleaned and trusted data tiers, and the rule that promotes between them.",
    avoid: "Any pipeline that is not tiered by data quality.",
    compose: ["The promotion rule sits on the arrow: it is the point of the pattern.", "Say what each tier guarantees, not what tools built it."],
    mistake: "Naming the tools instead of the guarantees.",
  },
  pyramid: {
    use: "Priority, maturity, or drop-off between levels.",
    avoid: "Anything where the levels are not nested or ordered.",
    compose: [
      "Widths are proportional when every level has a value, and evenly stepped when they do not — a funnel drawn to invented proportions is a chart that lies.",
      "Five levels at most.",
    ],
    mistake: "Using a funnel for conversion without the numbers.",
  },
  timeline: {
    use: "Events in order along a single axis.",
    avoid: "Work in progress with durations. Use a Gantt.",
    compose: ["Cards alternate above and below so long labels never collide.", "The axis carries only the marks the model contains — no invented intervals."],
    mistake: "Even spacing for uneven time. If the gaps matter, say so in the marker text.",
  },
  roadmap: {
    use: "Initiatives grouped by commitment horizon.",
    avoid: "Dates you do not have. Horizons are named commitments, not a calendar.",
    compose: ["Three horizons. Cards are outcomes, not tasks.", "The count per column is shown, which makes an overloaded 'Now' obvious."],
    mistake: "Turning Later into a wish list nobody has agreed to.",
  },
  journey: {
    use: "Stages, what the customer does, and how it feels.",
    avoid: "Internal process. The journey is the customer's view.",
    compose: [
      "The sentiment line is drawn only when the model carries measured values. A journey without measurement gets stages and actions and nothing else.",
      "Stage names are the customer's words.",
    ],
    mistake: "Inventing the curve. It is the most persuasive kind of lie in this format.",
  },
  quadrant: {
    use: "Positioning items against two named axes.",
    avoid: "Two axes that are really the same thing. The plot becomes a diagonal.",
    compose: ["Axis names come from the model; the renderer never supplies its own.", "Positions are data (px, py), so a position means something."],
    mistake: "Placing items by feel and then arguing from the picture.",
  },
  matrix: {
    use: "Four named strategies, each with a recommendation.",
    avoid: "Plotting many items. That is a quadrant.",
    compose: ["The cell is the content; nothing floats inside it.", "Each cell carries the action, not just the label."],
    mistake: "Naming the cells cleverly instead of usefully.",
  },
  venn: {
    use: "Two or three sets and the value in the overlap.",
    avoid: "Four or more sets — unreadable. Use a matrix.",
    compose: ["Labels sit outside the circles.", "Intersection text comes from the model; an unlabelled centre stays empty."],
    mistake: "Filling the centre with a platitude.",
  },
  radar: {
    use: "Comparing several measures on one shared scale.",
    avoid: "Measures with different units. The shape would be meaningless.",
    compose: ["One scale, printed on the rings.", "Five to eight axes; fewer looks broken, more turns to mush."],
    mistake: "Reading area as a total. The area depends on the axis order.",
  },
  bar: {
    use: "Comparing a value across categories.",
    avoid: "Change over time with many points — use a line.",
    compose: [
      "The scale starts at zero and the maximum is a rounded value above the data, never one chosen to flatter a bar.",
      "Categories without a value are drawn as a gap and counted in a note, not as zero.",
    ],
    mistake: "Sorting by value when the categories have a natural order.",
  },
  line: {
    use: "A measured trend along an ordered axis.",
    avoid: "Unordered categories. The line implies continuity that is not there.",
    compose: ["Gaps break the line rather than being interpolated across.", "Label the last point rather than adding a legend for one series."],
    mistake: "Hiding a truncated axis. Start at zero or say plainly that you did not.",
  },
  scatter: {
    use: "Distribution and correlation across two measures.",
    avoid: "Fewer than eight points. A table is clearer.",
    compose: ["Both coordinates are data; nothing is positioned by index.", "Points missing a coordinate are listed under the plot, not placed somewhere plausible."],
    mistake: "Drawing a trend line the data does not support.",
  },
  gantt: {
    use: "Tasks against a declared time scale.",
    avoid: "Dependencies as the main point. Use a flow.",
    compose: [
      "Bars come from start and duration in the unit the model declares.",
      "Tasks missing either value are listed as unscheduled rather than given a plausible bar.",
    ],
    mistake: "Implying certainty. A Gantt reads as a promise; say which bars are estimates.",
  },
};

export const guidanceFor = (id) => GUIDANCE[id] ?? null;
