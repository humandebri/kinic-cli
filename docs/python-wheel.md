# Building and Publishing the kinic_py Wheel

Steps to produce a distributable wheel for PyPI.

## Prerequisites
- Python 3.9+ with `pip`
- Rust toolchain (for the PyO3 extension)
- Matching versions: `pyproject.toml` `project.version` should match `python/kinic_py/__init__.py::__version__`
- Optional helpers: `build` and `twine`

Install the helpers if you don’t have them:

```bash
pip install build twine
# or with uv
uv pip install build twine
```

## Build the wheel
From the repo root:

```bash
python -m build --wheel
```

With uv:

```bash
uv run python -m build --wheel
```

Artifacts land in `dist/` (a `.whl` and a `.tar.gz` sdist).

## Smoke test the wheel locally
```bash
pip install dist/kinic_py-<version>-*.whl
python - <<'PY'
import kinic_py
print(kinic_py.__version__)
PY
```

With uv:

```bash
uv run python -m pip install dist/kinic_py-<version>-*.whl
uv run python - <<'PY'
import kinic_py
print(kinic_py.__version__)
PY
```

## Validate metadata
```bash
twine check dist/*
```

With uv:

```bash
uv run twine check dist/*
```

## Publish to PyPI
```bash
twine upload dist/*.whl dist/*.tar.gz
```

With uv:

```bash
uv run twine upload dist/*.whl dist/*.tar.gz
```

Requires credentials (via `~/.pypirc` or environment variables). For test uploads, swap in `--repository testpypi`.
