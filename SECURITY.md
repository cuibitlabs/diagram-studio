# Security policy

## Reporting

Report suspected vulnerabilities privately through the repository's security advisory form. Do not open a public issue for an unpatched vulnerability.

Expect an acknowledgement within seven days.

## Threat model

Diagram Studio parses untrusted input. The following limits are enforced and must not be relaxed:

| Surface | Control |
| --- | --- |
| File size | 2 MiB per import |
| Line count | 20,000 lines per import |
| Node count | 200 per project |
| Edge count | 400 per project |
| draw.io XML | `<!DOCTYPE>` and `<!ENTITY>` rejected; no external entity resolution |
| draw.io compressed payload | inflate bounded by the size limits above |
| Imported labels | HTML stripped and escaped before rendering |
| Brand extraction | network fetch is same-origin/CORS only; failure falls back to a deterministic local palette |
| Exports | generated client-side; no diagram content leaves the browser |

The browser studio stores projects in `localStorage` only. There is no server component and no telemetry.
