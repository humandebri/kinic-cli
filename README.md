# Kinic Python Wrapper

Python bindings around the Kinic CLI core for working with “memory” canisters from Python code. The wrapper exposes the same create/list/insert/search flows as the Rust CLI.

Looking for the CLI docs? See `docs/cli.md`.

Made with ❤️ by [ICME Labs](https://blog.icme.io/).

<img width="983" height="394" alt="icme_labs" src="https://github.com/user-attachments/assets/ffc334ed-c301-4ce6-8ca3-a565328904fe" />

## Prerequisites
- Python 3.9+
- Rust toolchain (Cargo builds the PyO3 extension)
- `dfx 0.28+` with the `arm64` build on Apple Silicon if you are using macOS.
- make a dfx identity by `dfx identity new <name>`
- A running replica for local work (`dfx start --clean --background`) or `--ic`/`ic=True` to talk to mainnet

If you need the local launcher/ledger/II canisters, run `./scripts/setup.sh` from the repo root before using the wrapper.

## Installation
Install from the repo root so the Rust extension builds with the `python-bindings` feature:

```bash
# using uv
uv pip install -e .

# or vanilla pip
pip install -e .
```

## Quickstart
```python
from kinic_py import KinicMemories

km = KinicMemories("default")  # dfx identity name; ic=True for mainnet
memory_id = km.create("Python demo", "Created via kinic_py")

km.insert_markdown(memory_id, "notes", "# Hello Kinic!\n\nInserted from Python.")

for score, payload in km.search(memory_id, "Hello"):
    print(f"{score:.4f} -> {payload}")  # payload is the JSON stored in insert
```

## API
- `KinicMemories(identity: str, ic: bool = False)`: stateful helper mirroring CLI behavior.
- `create(name: str, description: str) -> str`: deploy a new memory canister; returns the canister principal.
- `list() -> List[str]`: list memory canisters tied to the identity.
- `insert_markdown(memory_id: str, tag: str, text: str) -> int`: embed and store markdown text; returns the number of chunks inserted.
- `insert_markdown_file(memory_id: str, tag: str, path: str) -> int`: embed and store markdown loaded from disk.
- `search(memory_id: str, query: str) -> List[Tuple[float, str]]`: search a memory and return `(score, payload)` tuples sorted by score.

The same functions exist at the module level (`create_memory`, `list_memories`, `insert_markdown`, `insert_markdown_file`, `search_memories`) if you prefer stateless calls. Set `ic=True` on any call to target mainnet.

## Example script
An end-to-end sample lives at `python/examples/memories_demo.py`. Run it against an existing canister:

```bash
uv run python python/examples/memories_demo.py --identity default --memory-id <canister-id>
```

Omit `--memory-id` to deploy a new memory. Add `--ic` to talk to mainnet. The script prints search results and any inserted chunk count.

## Building and publishing the wheel

See `docs/python-wheel.md` for packaging steps (build, smoke-test, and upload to PyPI).
