from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlsplit

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
REFERENCE_PATTERN = re.compile(r'(?:src|href)=["\']([^"\']+)', re.IGNORECASE)
STATIC_SUFFIXES = {
    ".css", ".js", ".json", ".png", ".jpg", ".jpeg", ".gif", ".webp",
    ".svg", ".ico", ".txt", ".woff", ".woff2", ".ttf", ".map",
}


def main() -> int:
    failures: list[str] = []
    checked = 0

    for template in sorted(TEMPLATES_DIR.rglob("*.html")):
        content = template.read_text(encoding="utf-8")
        for raw_reference in REFERENCE_PATTERN.findall(content):
            if "{%" in raw_reference or "{{" in raw_reference:
                continue
            if raw_reference.startswith(
                ("http://", "https://", "mailto:", "tel:", "javascript:", "#")
            ):
                continue

            parsed = urlsplit(raw_reference)
            reference = parsed.path.lstrip("/")
            if not reference:
                continue

            suffix = Path(reference).suffix.lower()
            if suffix == ".html":
                checked += 1
                target = TEMPLATES_DIR / Path(reference).name
            elif suffix in STATIC_SUFFIXES:
                checked += 1
                target = STATIC_DIR / reference
            else:
                # Rotas do Django, como /area-restrita/ e /funcionarios/.
                continue

            if not target.is_file():
                relative_template = template.relative_to(TEMPLATES_DIR)
                failures.append(f"{relative_template}: {raw_reference}")

    if failures:
        print("Foram encontradas referências locais ausentes:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print(f"Referências confirmadas: {checked} arquivos locais válidos.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
