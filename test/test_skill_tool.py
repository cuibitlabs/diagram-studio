#!/usr/bin/env python3
import base64
import json
import subprocess
import tempfile
import urllib.parse
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / "skills/create-editorial-diagrams/scripts/diagram_tool.py"


def run(*args):
    return subprocess.run(["python3", str(TOOL), *map(str, args)], capture_output=True, text=True)


with tempfile.TemporaryDirectory() as directory:
    temp = Path(directory)
    mermaid_json = temp / "mermaid.diagram.json"
    drawio_json = temp / "drawio.diagram.json"
    html_file = temp / "diagram.html"

    result = run("mermaid", ROOT / "examples/sample-flowchart.mmd", mermaid_json)
    assert result.returncode == 0, result.stderr
    mermaid = json.loads(mermaid_json.read_text())
    assert len(mermaid["nodes"]) == 5 and len(mermaid["edges"]) == 4

    result = run("drawio", ROOT / "examples/sample-architecture.drawio", drawio_json)
    assert result.returncode == 0, result.stderr
    drawio = json.loads(drawio_json.read_text())
    assert len(drawio["nodes"]) == 3 and len(drawio["edges"]) == 2

    result = run("validate", drawio_json)
    assert result.returncode == 0 and "valid:" in result.stdout

    result = run("render", drawio_json, html_file)
    assert result.returncode == 0 and 'role="img"' in html_file.read_text()

    plain = (ROOT / "examples/sample-architecture.drawio").read_text()
    compressor = zlib.compressobj(level=9, wbits=-15)
    payload = base64.b64encode(compressor.compress(urllib.parse.quote(plain).encode()) + compressor.flush()).decode()
    compressed_file = temp / "compressed.drawio"
    compressed_file.write_text(f'<mxfile><diagram>{payload}</diagram></mxfile>')
    compressed_json = temp / "compressed.diagram.json"
    result = run("drawio", compressed_file, compressed_json)
    assert result.returncode == 0, result.stderr
    assert len(json.loads(compressed_json.read_text())["nodes"]) == 3

print("skill tool tests passed")
