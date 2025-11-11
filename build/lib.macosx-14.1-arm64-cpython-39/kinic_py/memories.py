"""High-level helpers for managing Kinic memories via the Rust core."""

from __future__ import annotations

from typing import List, Sequence, Tuple

from . import _lib as native

ScoreResult = Sequence[Tuple[float, str]]


class KinicMemories:
    """Stateful helper that mirrors the Rust CLI behavior."""

    def __init__(self, identity: str, *, ic: bool = False) -> None:
        self.identity = identity
        self.ic = ic

    def create(self, name: str, description: str) -> str:
        """Deploy a new memory canister."""
        return create_memory(self.identity, name, description, ic=self.ic)

    def list(self) -> List[str]:
        """List deployed memories."""
        return list_memories(self.identity, ic=self.ic)

    def insert_text(self, memory_id: str, tag: str, text: str) -> int:
        """Insert markdown text directly."""
        return insert_text(self.identity, memory_id, tag, text, ic=self.ic)

    def insert_file(self, memory_id: str, tag: str, path: str) -> int:
        """Insert markdown loaded from disk."""
        return insert_file(self.identity, memory_id, tag, path, ic=self.ic)

    def search(self, memory_id: str, query: str) -> ScoreResult:
        """Search the specified memory canister."""
        return search_memories(self.identity, memory_id, query, ic=self.ic)


def create_memory(
    identity: str,
    name: str,
    description: str,
    *,
    ic: bool | None = None,
) -> str:
    return native.create_memory(identity, name, description, ic=ic)


def list_memories(identity: str, *, ic: bool | None = None) -> List[str]:
    return native.list_memories(identity, ic=ic)


def insert_text(
    identity: str,
    memory_id: str,
    tag: str,
    text: str,
    *,
    ic: bool | None = None,
) -> int:
    return native.insert_memory(identity, memory_id, tag, text=text, ic=ic)


def insert_file(
    identity: str,
    memory_id: str,
    tag: str,
    path: str,
    *,
    ic: bool | None = None,
) -> int:
    return native.insert_memory(identity, memory_id, tag, file_path=path, ic=ic)


def search_memories(
    identity: str,
    memory_id: str,
    query: str,
    *,
    ic: bool | None = None,
) -> ScoreResult:
    return native.search_memories(identity, memory_id, query, ic=ic)
