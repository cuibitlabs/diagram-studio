# Third-party notices

## diagram-design

This project was inspired by concepts in `cathrynlavery/diagram-design`, an MIT-licensed project by Cathryn Lavery. Diagram Studio does not reuse that project's name, screenshots, identity, or bundled source assets. The reference repository's MIT grant permits use, modification, and distribution with its copyright and permission notice retained for any copied substantial portions.

Source: https://github.com/cathrynlavery/diagram-design

Licence: MIT

## Product marks — simple-icons

`src/render/brand-icons.js` contains 71 product marks vendored from
[simple-icons](https://github.com/simple-icons/simple-icons), released under
**CC0 1.0 Universal** (public domain dedication). No attribution is required;
this notice records provenance.

Regenerate with `node scripts/build-brand-icons.mjs`. The build never reaches
the network — the generated module is committed.

### Trademarks

The marks themselves are trademarks of their respective owners. They are
included for **nominative use**: identifying the product a diagram node
represents. Their inclusion implies no affiliation with, sponsorship by, or
endorsement from those owners.

### Marks deliberately not included

Some marks were removed from simple-icons at the trademark owner's request —
among them Amazon Web Services, Microsoft Azure, Slack, Tableau, Power BI,
OpenAI, Twilio, SendGrid, Heroku, dbt and SonarQube.

They are **not sourced from anywhere else**. A mark whose owner has
specifically objected to redistribution is not a gap worth closing, and any
other source would be redistributing it against that objection.

`UNAVAILABLE_MARKS` in `src/render/brand-icons.js` maps each one to the concept
icon to use instead. Name the product in the node's label — which the diagram
should be doing regardless, because a reader who does not recognise a logo still
has to be told what the box is.

## Concept icons

The 56 icons in `src/render/icons.js` are original geometry drawn for this
project and carry no third-party rights.

## Fonts

No web fonts are requested. The studio and every export use the same stacks:
whichever of Inter, Instrument Serif or Geist Mono is installed locally, falling
back to the system UI, serif and monospace faces. Nothing is bundled and nothing
is fetched, so a diagram renders identically offline and in an air-gapped
environment.
