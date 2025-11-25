# Kinic Python Wrapper

Python bindings around the Kinic CLI core for working with “memory” canisters from Python code. The wrapper exposes the same create/list/insert/search flows as the Rust CLI.

Looking for the CLI docs? See `docs/cli.md`.

Made with ❤️ by [ICME Labs](https://blog.icme.io/).

<img width="983" height="394" alt="icme_labs" src="https://github.com/user-attachments/assets/ffc334ed-c301-4ce6-8ca3-a565328904fe" />

## Prerequisites
- Python 3.9+
- `dfx 0.28+` with the `arm64` build on Apple Silicon if you are using macOS
- Create or select a dfx identity: `dfx identity new <name>` or `dfx identity use <name>`

If you need the local launcher/ledger/II canisters, run `./scripts/setup.sh`  after `dfx start --clean --background` from the repo root before using the wrapper.

## Quickstart (PyPI install)
Install the published wheel from PyPI (macOS builds available):


```bash
pip install kinic-py

# with uv
uv pip install kinic-py
```

> Note: Published wheels are currently macOS-only. On other platforms, `pip` will fall back to building from source, which requires a Rust toolchain and a working `pip install -e .` setup.

## Quickstart

Make sure the principal you’re using has enough KINIC (at least 1) to pay for deployment. Check your principal and balance:

```bash
dfx --identity <name> identity get-principal
dfx canister --ic call 73mez-iiaaa-aaaaq-aaasq-cai icrc1_balance_of '(record {owner = principal "<your principal>"; subaccount = null; }, )'
# Example: (100000000 : nat) == 1 KINIC
```

Sample code to deploy a new memory and insert text:

```python
from kinic_py import KinicMemories

km = KinicMemories("<name>")  # dfx identity name; use ic=True for mainnet, e.g. KinicMemories("<name>", ic=True)
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

## Build from source
- Requires Rust toolchain (for the PyO3 extension).
- Editable install: `pip install -e .` (or `uv pip install -e .`).
- Wheel packaging steps: see `docs/python-wheel.md` for build, smoke-test, and upload commands.

## Building and publishing the wheel

See `docs/python-wheel.md` for packaging steps (build, smoke-test, and upload to PyPI).
