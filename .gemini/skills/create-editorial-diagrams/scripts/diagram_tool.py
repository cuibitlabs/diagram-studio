#!/usr/bin/env python3
"""Deterministic helpers for editorial diagram projects."""

from __future__ import annotations

import argparse
import base64
import html
import json
import re
import sys
import urllib.parse
import zlib
from pathlib import Path
from xml.etree import ElementTree as ET

MAX_BYTES = 2 * 1024 * 1024
MAX_NODES = 200
MAX_EDGES = 400


def read_text(path: Path) -> str:
    if path.stat().st_size > MAX_BYTES:
        raise ValueError("input exceeds the 2 MiB safety limit")
    text = path.read_text(encoding="utf-8")
    if len(text.splitlines()) > 20000:
        raise ValueError("input exceeds the 20,000 line safety limit")
    return text


def node(identifier: str, label: str, index: int) -> dict:
    return {
        "id": identifier,
        "label": label.strip() or identifier,
        "sublabel": "Imported source",
        "x": 120 + (index % 4) * 260,
        "y": 150 + (index // 4) * 160,
        "w": 196,
        "h": 88,
        "value": 40 + (index * 13) % 55,
        "tone": "accent" if index == 1 else "default",
    }


def project(kind: str, title: str, nodes: list[dict], edges: list[dict]) -> dict:
    return {
        "version": 1,
        "type": kind,
        "title": title,
        "description": "Imported and normalized as an editable editorial diagram.",
        "width": 1200,
        "height": 760,
        "theme": {"paper": "#f3f0e9", "panel": "#fffdf8", "ink": "#1d211f", "muted": "#6e746f", "accent": "#e85d3f", "accent2": "#174f46", "line": "#b9b5ac"},
        "nodes": nodes[:MAX_NODES],
        "edges": edges[:MAX_EDGES],
        "settings": {"grid": True, "density": "balanced", "corner": 8},
    }


def clean_label(value: str) -> str:
    value = re.sub(r"<br\s*/?>", " · ", value or "", flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    return html.unescape(re.sub(r"\s+", " ", value)).strip().strip("\"'`")


def parse_mermaid(text: str) -> dict:
    text = re.sub(r"^```mermaid\s*|```\s*$", "", text.strip(), flags=re.I)
    first = text.splitlines()[0].lower() if text else ""
    kind = "sequence" if first.startswith("sequence") else "er" if first.startswith("erdiagram") else "state" if first.startswith("state") else "gantt" if first.startswith("gantt") else "flowchart"
    labels: dict[str, str] = {}
    links: list[tuple[str, str, str]] = []

    def remember(key: str, label: str | None = None) -> None:
        if key and key not in labels:
            labels[key] = clean_label(label or key)

    for raw in text.splitlines()[1:]:
        line = raw.strip()
        if not line or re.match(r"^(direction|title|classDef|style|linkStyle|dateFormat|axisFormat|section)\b", line, re.I):
            continue
        participant = re.match(r"^(?:participant|actor)\s+([\w.-]+)(?:\s+as\s+(.+))?$", line, re.I)
        if participant:
            remember(participant.group(1), participant.group(2))
            continue
        sequence = re.match(r"^([\w.-]+)\s*[-=.]+>>?\+?\s*([\w.-]+)\s*:\s*(.+)$", line)
        if sequence:
            remember(sequence.group(1)); remember(sequence.group(2)); links.append((sequence.group(1), sequence.group(2), clean_label(sequence.group(3))))
            continue
        arrow = re.match(r"^(.+?)\s*(-->|==>|-.->|---|--[^-]+-->)\s*(.+)$", line)
        if arrow:
            token = re.compile(r"([A-Za-z0-9_.-]+)(?:\s*[\[({]{1,2}[\"']?([^\])}\"']+)[\"']?[\])}]{1,2})?")
            left = token.search(arrow.group(1)); right = token.search(arrow.group(3))
            if left and right:
                remember(left.group(1), left.group(2)); remember(right.group(1), right.group(2)); links.append((left.group(1), right.group(1), clean_label(re.sub(r"[-=.>]", "", arrow.group(2)))))

    if not labels:
        raise ValueError("no supported Mermaid nodes found")
    id_map = {key: f"node-{index + 1}" for index, key in enumerate(labels)}
    nodes = [node(id_map[key], label, index) for index, (key, label) in enumerate(labels.items())]
    edges = [{"id": f"edge-{index + 1}", "source": id_map[source], "target": id_map[target], "label": label, "dashed": False} for index, (source, target, label) in enumerate(links) if source in id_map and target in id_map]
    return project(kind, "Imported Mermaid diagram", nodes, edges)


def decompress_drawio(payload: str) -> str:
    decoded = base64.b64decode(payload)
    inflated = zlib.decompress(decoded, -15).decode("utf-8")
    return urllib.parse.unquote(inflated)


def parse_drawio(text: str) -> dict:
    if re.search(r"<!DOCTYPE|<!ENTITY", text, re.I):
        raise ValueError("XML document types and entities are not allowed")
    root = ET.fromstring(text)
    model = root if root.tag.endswith("mxGraphModel") else root.find(".//mxGraphModel")
    if model is None:
        diagram = root.find(".//diagram")
        if diagram is None or not (diagram.text or "").strip():
            raise ValueError("no draw.io model found")
        model = ET.fromstring(decompress_drawio((diagram.text or "").strip()))
    nodes, raw_edges, id_map = [], [], {}
    for cell in model.iter("mxCell"):
        source_id = cell.attrib.get("id", "")
        if cell.attrib.get("vertex") == "1":
            geometry = next((child for child in cell if child.tag.endswith("mxGeometry")), None)
            item = node(f"node-{len(nodes) + 1}", clean_label(cell.attrib.get("value", "Untitled node")), len(nodes))
            if geometry is not None:
                for key in ("x", "y", "width", "height"):
                    if key in geometry.attrib:
                        item[{"width": "w", "height": "h"}.get(key, key)] = float(geometry.attrib[key])
            nodes.append(item); id_map[source_id] = item["id"]
        elif cell.attrib.get("edge") == "1":
            raw_edges.append(cell.attrib)
    edges = [{"id": f"edge-{index + 1}", "source": id_map.get(item.get("source")), "target": id_map.get(item.get("target")), "label": clean_label(item.get("value", "")), "dashed": False} for index, item in enumerate(raw_edges)]
    edges = [edge for edge in edges if edge["source"] and edge["target"]]
    if not nodes:
        raise ValueError("no draw.io vertices found")
    return project("architecture", "Imported draw.io diagram", nodes, edges)


def validate(data: dict) -> list[str]:
    errors = []
    for key in ("version", "type", "title", "width", "height", "theme", "nodes", "edges", "settings"):
        if key not in data:
            errors.append(f"missing required key: {key}")
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    if not isinstance(nodes, list) or not isinstance(edges, list):
        return errors + ["nodes and edges must be arrays"]
    if len(nodes) > MAX_NODES or len(edges) > MAX_EDGES:
        errors.append("project exceeds node or edge safety limits")
    ids = [item.get("id") for item in nodes]
    if len(ids) != len(set(ids)):
        errors.append("node IDs must be unique")
    known = set(ids)
    for edge in edges:
        if edge.get("source") not in known or edge.get("target") not in known:
            errors.append(f"edge {edge.get('id', '<unknown>')} has a missing endpoint")
    return errors


def brand(text: str) -> dict:
    colors = list(dict.fromkeys(value.lower() for value in re.findall(r"#[0-9a-fA-F]{6}\b", text)))
    useful = [value for value in colors if value not in ("#ffffff", "#000000")]
    font_match = re.search(r"font-family\s*:\s*([^;}]+)", text, re.I)
    return {"paper": "#ffffff" if "#ffffff" in colors else "#f3f0e9", "panel": "#ffffff", "ink": "#000000" if "#000000" in colors else "#1d211f", "muted": "#6e746f", "accent": useful[0] if useful else "#e85d3f", "accent2": useful[1] if len(useful) > 1 else "#174f46", "line": "#b9b5ac", "font": clean_label((font_match.group(1).split(",")[0] if font_match else "Inter"))}


def svg_markup(data: dict) -> str:
    theme = data["theme"]
    node_by_id = {item["id"]: item for item in data["nodes"]}
    edge_parts = []
    for edge in data["edges"]:
        source, target = node_by_id.get(edge["source"]), node_by_id.get(edge["target"])
        if not source or not target:
            continue
        x1, y1 = source["x"] + source["w"], source["y"] + source["h"] / 2
        x2, y2 = target["x"], target["y"] + target["h"] / 2
        edge_parts.append(f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{theme["ink"]}" fill="none" marker-end="url(#arrow)"/>')
    node_parts = []
    for item in data["nodes"]:
        fill = theme["accent"] if item.get("tone") == "accent" else theme["panel"]
        color = "#ffffff" if item.get("tone") == "accent" else theme["ink"]
        node_parts.append(f'<g transform="translate({item["x"]} {item["y"]})"><rect width="{item["w"]}" height="{item["h"]}" rx="8" fill="{fill}" stroke="{theme["line"]}"/><text x="20" y="42" fill="{color}" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="700">{html.escape(str(item["label"]))}</text><text x="20" y="66" fill="{color}" opacity=".7" font-family="monospace" font-size="10">{html.escape(str(item.get("sublabel", "")))}</text></g>')
    title = html.escape(str(data["title"]))
    description = html.escape(str(data.get("description", "")))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {data["width"]} {data["height"]}" width="{data["width"]}" height="{data["height"]}" role="img" aria-labelledby="diagram-title diagram-desc"><title id="diagram-title">{title}</title><desc id="diagram-desc">{description}</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="{theme["ink"]}"/></marker></defs><rect width="100%" height="100%" fill="{theme["paper"]}"/>{"".join(edge_parts)}{"".join(node_parts)}</svg>'


def render_html(data: dict) -> str:
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>{html.escape(str(data["title"]))}</title><style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:{data["theme"]["paper"]}}}svg{{max-width:100%;height:auto}}</style></head><body>{svg_markup(data)}</body></html>'


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("mermaid", "drawio", "brand", "render", "export"):
        command = sub.add_parser(name); command.add_argument("input", type=Path); command.add_argument("output", type=Path)
    command = sub.add_parser("validate"); command.add_argument("input", type=Path)
    args = parser.parse_args()
    try:
        if args.command == "mermaid": write_json(args.output, parse_mermaid(read_text(args.input)))
        elif args.command == "drawio": write_json(args.output, parse_drawio(read_text(args.input)))
        elif args.command == "brand": write_json(args.output, brand(read_text(args.input)))
        else:
            data = json.loads(read_text(args.input)); errors = validate(data)
            if errors: raise ValueError("; ".join(errors))
            if args.command == "validate": print(f"valid: {len(data['nodes'])} nodes, {len(data['edges'])} edges")
            elif args.command == "render": args.output.write_text(render_html(data), encoding="utf-8")
            elif args.command == "export":
                try: import cairosvg
                except ImportError as error: raise ValueError("PNG/PDF export requires CairoSVG; use the browser studio or install cairosvg") from error
                svg = svg_markup(data).encode("utf-8")
                if args.output.suffix.lower() == ".png": cairosvg.svg2png(bytestring=svg, write_to=str(args.output))
                elif args.output.suffix.lower() == ".pdf": cairosvg.svg2pdf(bytestring=svg, write_to=str(args.output))
                elif args.output.suffix.lower() == ".svg": args.output.write_bytes(svg)
                else: raise ValueError("export extension must be .svg, .png, or .pdf")
    except (OSError, ValueError, ET.ParseError, json.JSONDecodeError) as error:
        print(f"error: {error}", file=sys.stderr); return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
