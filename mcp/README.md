# Kinic MCP (memory.search only)

Minimal MCP server that exposes a single tool, `memory.search`, and delegates to `kinic-cli` on mainnet.

## Install

```bash
cd mcp
npm install
npm run build
```

## Run

```bash
node dist/server.js
```

## MCP config (paste into your client)

```json
{
  "mcpServers": {
    "kinic": {
      "command": "node",
      "args": ["/Users/0xhude/Desktop/ICP/kinic-cli/mcp/dist/server.js"]
    }
  }
}
```

## Tool

- `memory.search`
  - Required args: `memory_id`, `query`, `identity_mode` ("dfx" | "ii" | "anonymous")
  - `identity` is required for `dfx` and `ii`, omitted for `anonymous`
  - The server calls `kinic-cli search-json` and expects JSON output.
