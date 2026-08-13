# Diagram type selection

Choose by the relationship the reader must understand.

| Type | Use for | Avoid when |
| --- | --- | --- |
| Architecture | Components and connections | Time order is primary |
| Flowchart | Decisions and branching logic | Ownership is primary |
| Sequence | Messages over time | Physical topology is primary |
| State machine | Valid states and transitions | Steps do not depend on state |
| ER / data model | Entities, fields, cardinality | Showing runtime message order |
| Timeline | Events on one time axis | Tasks overlap materially |
| Swimlane | Ownership across a workflow | There is only one actor |
| Quadrant / matrix | Positioning on two axes | Values need exact comparison |
| Nested systems | Containment and boundaries | Parent-child lines are clearer |
| Tree | Hierarchy and taxonomy | Cross-links dominate |
| Org chart | Reporting and ownership | Informal collaboration |
| Venn | Two or three set overlaps | Four or more sets |
| Layer stack | Ordered abstractions | Dependencies are non-layered |
| Pyramid / funnel | Rank, maturity, or drop-off | Categories are peer values |
| Radar | Multi-axis profiles | Exact values matter most |
| Loop / flywheel | Reinforcing cycles | A clear start and finish exists |
| Bar chart | Exact categorical comparison | Continuous time trend |
| Line chart | Trend over ordered intervals | Unordered categories |
| Gantt | Tasks, duration, dependencies | Only milestones matter |
| Scatter plot | Distribution and correlation | There are few discrete values |
| Process | Linear or lightly branching work | State transitions dominate |
| Medallion | Bronze, silver, gold data tiers | Storage is not tiered |
| Data flow | Sources, transforms, destinations | Infrastructure placement dominates |
| Mind map | Radial ideas from a center | Strict hierarchy or sequence |
| Network topology | Zones, devices, links | Business process is primary |
| Deployment | Environments, releases, runtime placement | Code structure only |
| Roadmap | Now, next, later or horizons | Exact dates and dependencies |
| Customer journey | Stages, actions, channels, sentiment | Internal system logic |

## Selection heuristics

- Prefer a table for exact mappings and a short list for independent items.
- Prefer a chart when numeric magnitude is the primary message.
- Prefer a diagram when topology, branching, sequence, hierarchy, containment, or feedback is the primary message.
- Split a diagram when it needs more than 24 nodes or when two reading orders compete.
- Use an overview plus detail views instead of reducing all labels below the target size.
