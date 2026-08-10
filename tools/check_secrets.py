from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IGNORE_DIRS = {".git", ".venv", "__pycache__", "staticfiles"}
IGNORE_FILES = {".env"}
PATTERNS = {
    "Google API key": re.compile(r"(?:AIza|AQ\.)[0-9A-Za-z._-]{20,}"),
    "OpenAI API key": re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
}
TEXT_SUFFIXES = {
    ".py", ".js", ".css", ".html", ".md", ".txt", ".json", ".toml",
    ".ps1", ".bat", ".yml", ".yaml", ".xml", ".ini", ".cfg", ".example",
}


def iter_files():
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in IGNORE_DIRS for part in path.parts):
            continue
        if path.name in IGNORE_FILES:
            continue
        if path.name == ".env.example" or path.suffix.lower() in TEXT_SUFFIXES:
            yield path


def tracked_env_files() -> list[str]:
    if not (ROOT / ".git").exists():
        return []
    try:
        result = subprocess.run(
            ["git", "ls-files"],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return []
    tracked = []
    for item in result.stdout.splitlines():
        name = Path(item).name
        if name == ".env" or (name.startswith(".env.") and name != ".env.example"):
            tracked.append(item)
    return tracked


def main() -> int:
    problems = []
    for path in iter_files():
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for label, pattern in PATTERNS.items():
            if pattern.search(content):
                problems.append(f"{label} encontrada em {path.relative_to(ROOT)}")

    for item in tracked_env_files():
        problems.append(f"arquivo de ambiente rastreado pelo Git: {item}")

    if problems:
        print("Foram encontrados itens que não devem ser publicados:")
        for problem in problems:
            print(f"- {problem}")
        return 1

    print("Verificação de segredos concluída: nenhum segredo aparente nos arquivos publicáveis.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
