#!/usr/bin/env sh
# Tanatasa MCP server: raw JSON-RPC over Streamable HTTP with curl.
# The server is stateless, so single requests work without an initialize handshake.
set -eu
MCP="${TANATASA_MCP_URL:-https://tanatasa.sg/mcp}"
rpc() {
  curl -fsS "$MCP" -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' -d "$1"
  echo
}

echo "# tools/list"
rpc '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

echo "# tools/call search_products"
rpc '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_products","arguments":{"q":"sunscreen","in_stock":true,"limit":3}}}'
