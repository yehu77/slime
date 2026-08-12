#!/usr/bin/env python3
"""Generate fixed-commit GitHub anchors from stable Python symbol refs."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
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
        tree = ast.parse(source, filename=ref["path"])
        matches = matches_for_symbol(tree, ref["symbol"])
        if len(matches) != 1:
            raise ValueError(f"{ref['id']}: expected one {ref['symbol']!r}, found {len(matches)}")
        node = matches[0]
        start = node.lineno
        end = node.end_lineno or start
        snippet = "\n".join(source.splitlines()[start - 1 : end])
        generated.append(
            {
                "id": ref["id"],
                "commit": commit,
                "path": ref["path"],
                "symbol": ref["symbol"],
                "start_line": start,
                "end_line": end,
                "snippet_sha256": hashlib.sha256(snippet.encode()).hexdigest(),
                "url": (f"https://github.com/THUDM/slime/blob/{commit}/{ref['path']}" f"#L{start}-L{end}"),
            }
        )

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
