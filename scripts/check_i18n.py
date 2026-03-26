#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

HTML_REQUIREMENTS = [
    ("index.html", "es"),
    ("en/index.html", "en"),
    ("pt/index.html", "pt"),
    ("IMO_Convenios_Codigos.html", "es"),
    ("en/IMO_Convenios_Codigos.html", "en"),
    ("pt/IMO_Convenios_Codigos.html", "pt"),
    ("Costa_Concordia_Desastre.html", "es"),
    ("en/Costa_Concordia_Desastre.html", "en"),
    ("pt/Costa_Concordia_Desastre.html", "pt"),
    ("casos/costa-concordia/index.html", "es"),
    ("en/casos/costa-concordia/index.html", "en"),
    ("pt/casos/costa-concordia/index.html", "pt"),
]

JSON_REQUIREMENTS = [
    "casos/costa-concordia/scenario.json",
    "en/casos/costa-concordia/scenario.json",
    "pt/casos/costa-concordia/scenario.json",
]


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    sys.exit(1)


for rel_path, expected_lang in HTML_REQUIREMENTS:
    path = ROOT / rel_path
    if not path.exists():
        fail(f"missing required localized page: {rel_path}")

    html = path.read_text(encoding="utf-8")

    lang_match = re.search(r"<html[^>]+lang=\"([^\"]+)\"", html, re.IGNORECASE)
    if not lang_match:
        fail(f"missing html lang attribute in {rel_path}")
    if lang_match.group(1) != expected_lang:
        fail(f"unexpected html lang in {rel_path}: expected {expected_lang}, got {lang_match.group(1)}")

    if "lang-switch" not in html:
        fail(f"missing language switcher in {rel_path}")

for rel_path in JSON_REQUIREMENTS:
    path = ROOT / rel_path
    if not path.exists():
        fail(f"missing localized scenario file: {rel_path}")
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if "checkpoints" not in data or not isinstance(data["checkpoints"], list) or not data["checkpoints"]:
        fail(f"invalid scenario structure in {rel_path}")

print("I18N_GUARD_OK")
