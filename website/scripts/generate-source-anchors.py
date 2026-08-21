#!/usr/bin/env python3
"""Generate fixed-commit GitHub anchors from stable Python symbol refs."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    script = Path(__file__).resolve()
    default_repo = script.parents[2]
    default_refs = script.parents[1] / "data/source-refs/slime-06ffdbe2.refs.json"
    default_out = script.parents[1] / "data/source-refs/slime-06ffdbe2.anchors.generated.json"
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=default_repo)
    parser.add_argument("--refs", type=Path, default=default_refs)
    parser.add_argument("--out", type=Path, default=default_out)
    parser.add_argument("--check", action="store_true")
    return parser.parse_args()


def git_show(repo_root: Path, commit: str, path: str) -> str:
    process = subprocess.run(
        ["git", "-C", str(repo_root), "show", f"{commit}:{path}"],
        check=False,
        capture_output=True,
        text=True,
    )
    if process.returncode:
        raise RuntimeError(process.stderr.strip() or f"cannot read {commit}:{path}")
    return process.stdout


def matches_for_symbol(tree: ast.AST, symbol: str) -> list[ast.AST]:
    parts = symbol.split(".")
    if len(parts) == 1:
        return [
            node
            for node in ast.walk(tree)
            if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == parts[0]
        ]

    parent_name, child_name = parts[-2:]
    matches: list[ast.AST] = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef) or node.name != parent_name:
            continue
        for child in node.body:
            if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and child.name == child_name:
                matches.append(child)
    return matches


def _indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def _block_end(lines: list[str], start_index: int, start_indent: int, limit: int) -> int:
    last_content = start_index
    header_finished = lines[start_index].rstrip().endswith(":")
    for index in range(start_index + 1, limit):
        stripped = lines[index].strip()
        if not stripped or stripped.startswith("#"):
            continue
        if not header_finished:
            last_content = index
            header_finished = lines[index].rstrip().endswith(":")
            continue
        if _indent(lines[index]) <= start_indent:
            break
        last_content = index
    return last_content + 1


def text_spans_for_symbol(source: str, symbol: str) -> list[tuple[int, int]]:
    """Small Python symbol locator used when the host AST is older than the source.

    The checked-in baseline uses ``match`` syntax, while macOS may still expose
    Python 3.9 as ``python3``. This fallback only recognizes class/function
    declarations and indentation; it does not attempt to parse function bodies.
    """

    lines = source.splitlines()
    parts = symbol.split(".")

    def declarations(name: str, start: int, limit: int, required_indent: int | None) -> list[tuple[int, int, int]]:
        pattern = re.compile(rf"^(?:async\s+def|def|class)\s+{re.escape(name)}\b")
        found: list[tuple[int, int, int]] = []
        for index in range(start, limit):
            stripped = lines[index].lstrip(" ")
            indent = _indent(lines[index])
            if required_indent is not None and indent != required_indent:
                continue
            if pattern.match(stripped):
                found.append((index + 1, _block_end(lines, index, indent, limit), indent))
        return found

    if len(parts) == 1:
        return [(start, end) for start, end, _ in declarations(parts[0], 0, len(lines), 0)]

    parent_matches = declarations(parts[-2], 0, len(lines), 0)
    matches: list[tuple[int, int]] = []
    for parent_start, parent_end, parent_indent in parent_matches:
        children = declarations(parts[-1], parent_start, parent_end, parent_indent + 4)
        matches.extend((start, end) for start, end, _ in children)
    return matches


def guided_excerpt_for_ref(
    ref: dict[str, Any], source_lines: list[str], symbol_start: int, symbol_end: int
) -> dict[str, Any] | None:
    """Resolve an optional 8–20 line teaching excerpt by stable text markers.

    Line numbers are deliberately not authored in the refs file. Markers are
    searched only inside the resolved symbol, so an upstream insertion can move
    the excerpt without silently changing its identity or hash.
    """

    spec = ref.get("guided_excerpt")
    if spec is None:
        return None
    if not isinstance(spec, dict):
        raise ValueError(f"{ref['id']}: guided_excerpt must be an object")
    start_marker = spec.get("start_contains")
    end_marker = spec.get("end_contains")
    if not isinstance(start_marker, str) or not isinstance(end_marker, str):
        raise ValueError(f"{ref['id']}: guided excerpt markers must be strings")

    symbol_lines = source_lines[symbol_start - 1 : symbol_end]
    start_matches = [index for index, line in enumerate(symbol_lines) if start_marker in line]
    end_matches = [index for index, line in enumerate(symbol_lines) if end_marker in line]
    if len(start_matches) != 1 or len(end_matches) != 1:
        raise ValueError(
            f"{ref['id']}: expected unique guided excerpt markers, "
            f"found start={len(start_matches)}, end={len(end_matches)}"
        )
    relative_start, relative_end = start_matches[0], end_matches[0]
    end_offset = spec.get("end_offset", 0)
    if not isinstance(end_offset, int) or end_offset < 0:
        raise ValueError(f"{ref['id']}: guided excerpt end_offset must be a non-negative integer")
    relative_end += end_offset
    if relative_end >= len(symbol_lines):
        raise ValueError(f"{ref['id']}: guided excerpt end_offset leaves the resolved symbol")
    if relative_end < relative_start:
        raise ValueError(f"{ref['id']}: guided excerpt end precedes start")
    excerpt_lines = symbol_lines[relative_start : relative_end + 1]
    if not 8 <= len(excerpt_lines) <= 20:
        raise ValueError(f"{ref['id']}: guided excerpt must contain 8–20 lines, got {len(excerpt_lines)}")
    code = "\n".join(excerpt_lines)
    return {
        "start_line": symbol_start + relative_start,
        "end_line": symbol_start + relative_end,
        "snippet_sha256": hashlib.sha256(code.encode()).hexdigest(),
        "code": code,
    }


def generate(repo_root: Path, refs_path: Path) -> dict[str, Any]:
    refs_payload = json.loads(refs_path.read_text())
    if isinstance(refs_payload, dict):
        refs = refs_payload.get("source_refs", refs_payload.get("refs", refs_payload))
        baseline = refs_payload.get("baseline", {}).get("commit")
    else:
        refs = refs_payload
        baseline = None
    if not isinstance(refs, list):
        raise ValueError("source refs must be a list or an object with source_refs")

    generated: list[dict[str, Any]] = []
    for ref in sorted(refs, key=lambda value: value["id"]):
        commit = ref.get("commit", baseline)
        if not commit:
            raise ValueError(f"{ref['id']}: missing commit and top-level baseline.commit")
        source = git_show(repo_root, commit, ref["path"])
        try:
            tree = ast.parse(source, filename=ref["path"])
        except SyntaxError:
            spans = text_spans_for_symbol(source, ref["symbol"])
            if len(spans) != 1:
                raise ValueError(f"{ref['id']}: expected one {ref['symbol']!r}, found {len(spans)}") from None
            start, end = spans[0]
        else:
            matches = matches_for_symbol(tree, ref["symbol"])
            if len(matches) != 1:
                raise ValueError(f"{ref['id']}: expected one {ref['symbol']!r}, found {len(matches)}")
            node = matches[0]
            start = node.lineno
            end = node.end_lineno or start
        source_lines = source.splitlines()
        snippet = "\n".join(source_lines[start - 1 : end])
        anchor = {
            "id": ref["id"],
            "commit": commit,
            "path": ref["path"],
            "symbol": ref["symbol"],
            "start_line": start,
            "end_line": end,
            "snippet_sha256": hashlib.sha256(snippet.encode()).hexdigest(),
            "url": (f"https://github.com/THUDM/slime/blob/{commit}/{ref['path']}" f"#L{start}-L{end}"),
        }
        guided_excerpt = guided_excerpt_for_ref(ref, source_lines, start, end)
        if guided_excerpt is not None:
            anchor["guided_excerpt"] = guided_excerpt
        generated.append(anchor)

    baseline = baseline or (refs[0].get("commit") if refs else None)
    if any(ref.get("commit", baseline) != baseline for ref in refs):
        raise ValueError("all M1 source refs must use the same commit")
    return {"schema_version": 1, "baseline_commit": baseline, "anchors": generated}


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    if not (repo_root / ".git").exists():
        raise SystemExit(f"not a slime repository root: {repo_root}")
    payload = generate(repo_root, args.refs.resolve())
    serialized = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if args.check:
        if not args.out.exists() or args.out.read_text() != serialized:
            raise SystemExit("generated source anchors are stale; run without --check")
        print(f"source anchors current: {len(payload['anchors'])}")
        return 0
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(serialized)
    print(f"wrote {len(payload['anchors'])} source anchors to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
