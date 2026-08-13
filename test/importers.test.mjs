import test from "node:test";
import assert from "node:assert/strict";
import { extractBrandFromHTML, parseMermaid } from "../src/importers.js";

test("imports Mermaid flowcharts", () => { const diagram = parseMermaid("flowchart LR\n A[Idea] --> B[Prototype]\n B --> C[Launch]"); assert.equal(diagram.nodes.length, 3); assert.equal(diagram.edges.length, 2); assert.equal(diagram.nodes[1].label, "Prototype"); });
test("imports Mermaid sequences", () => { const diagram = parseMermaid("sequenceDiagram\n participant U as User\n participant A as API\n U->>A: Request\n A->>U: Response"); assert.equal(diagram.type, "sequence"); assert.equal(diagram.edges.length, 2); });
test("extracts brand colors and fonts", () => { const theme = extractBrandFromHTML("<style>body{color:#112233;font-family:'Acme',sans-serif}a{color:#ee5533}</style>"); assert.equal(theme.accent, "#112233"); assert.equal(theme.accent2, "#ee5533"); assert.equal(theme.font, "Acme"); });
