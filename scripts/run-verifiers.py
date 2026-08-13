#!/usr/bin/env python3
"""Discover and run every repository verifier and linter.

Any executable script matching ``scripts/verify-*.py``, ``scripts/lint-*.py``,
or ``scripts/test-*.py`` is run with the repository root as the working
directory. A non-zero exit from any of them fails the whole run.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
PATTERNS = ("verify-*.py", "lint-*.py", "test-*.py")


def discover() -> list[Path]:
    found: list[Path] = []
    for pattern in PATTERNS:
        found.extend(sorted(SCRIPTS.glob(pattern)))
    return [path for path in found if path.name != Path(__file__).name]


def main() -> int:
    scripts = discover()
    if not scripts:
        print("no verifiers found")
        return 0

    failures: list[str] = []
    for script in scripts:
        print(f"--- {script.relative_to(ROOT).as_posix()}")
        result = subprocess.run([sys.executable, str(script)], cwd=ROOT)
        if result.returncode != 0:
            failures.append(script.name)

    print()
    if failures:
        print(f"FAIL: {len(failures)} of {len(scripts)} verifiers failed: {', '.join(failures)}")
        return 1
    print(f"OK: {len(scripts)} verifiers passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
