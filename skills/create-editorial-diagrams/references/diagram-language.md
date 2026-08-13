# The `.ds` diagram language

A project is JSON, which is fine for machines and miserable in a pull request. `.ds` is the same model in a form a person can write and a reviewer can read a diff of. Parsing and serialising are exact inverses for everything the grammar covers, so the text and the canvas stay in step.

```ds
architecture "Checkout platform"
theme cobalt
direction LR
describe "How an order reaches the ledger"

group "Perimeter" {
  customer: actor "Customer" #user
  web "Web app" / "Browser client" #browser
}
gateway "API gateway" *
orders "Orders service"
store: store "Order store"

customer -> web
web -> gateway "TLS"
gateway -> orders
orders ~> store "read/write"
```

## Header statements

| Statement | Effect |
| --- | --- |
| `<type> "Title"` | required, and must be first |
| `theme <id>` | one of the shipped palettes |
| `direction LR\|TB\|RL\|BT` | flow direction where the type supports one |
| `describe "…"` | the accessible description |
| `style editorial\|sketchy\|terminal` | style variant |
| `motion reveal\|step\|loop` | opt-in animation |
| `preset fit\|doc-inline\|doc-wide\|slide-16x9\|…` | pin the canvas to a destination |
| `audience executive\|mixed\|engineer` | how much technical detail is drawn |
| `unit "…"` | the unit for a chart's values |
| `axis x "Label" "Low" "High"` | axis names for quadrant, matrix and scatter |
| `hub "Label" ["Sublabel"]` | the centre of a loop |

## Nodes

```
key "Label"                      simplest form
key "Label" / "Sublabel"         with a second line
key: store "Label"               with a semantic role
key "Label" *                    the accent (two per diagram)
key "Label" #database            an icon
key "Label" =42                  a value, for charts
```

Roles: `actor`, `service`, `store`, `external`, `decision`, `input`, `output`, `gateway`, `security`, `terminal`, `state`, `event`, `note`, `document`, `legacy`, `optional`, `step`, `focal`.

## Connections

```
a -> b                 a connection
a -> b "label"         with a label
a ~> b                 dashed: a different kind of relationship
a => b                 accented: the path being argued about
a <-> b                both directions
```

Referencing a key that has not been declared creates a node with that key as its label, so a quick sketch does not need every node written out first.

## Groups

```
group "Perimeter" {
  edge "Edge"
  waf "WAF"
}
```

Groups do not nest. A node can belong to one group.

## Comments

`//` to end of line, unless it is inside quotes.

## Errors

Every parse error names the line:

```
line 7: unknown role "wizard"
line 2: unknown theme "neon"
line 14: unclosed group
```

## Working with it

```bash
diagram-studio convert diagram.ds diagram.svg     # draw it
diagram-studio convert project.json diagram.ds    # get the source back
diagram-studio audit diagram.ds                   # contrast and composition
```

In the studio, a `.ds` file can be opened, and the paste dialog detects the language from the text. **Export → Diagram language** writes the source back out, which is the form to commit.
