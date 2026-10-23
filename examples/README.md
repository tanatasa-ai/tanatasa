# Tanatasa examples

**Tanatasa is a Singapore-based skincare store with an MCP server, CLI, and API for AI agents and developers.**

Runnable examples for each Tanatasa interface. All of them call production (`https://tanatasa.sg`) and need no API key. None of them takes payment.

| Folder | Example | Needs |
| --- | --- | --- |
| [`rest/`](rest/) | `search.sh`: search and product details with curl | curl |
| | `guest-cart.sh`: guest cart → item → quote, with optional checkout link | curl, jq |
| | `search.py`: search with the Python standard library | Python 3.9+ |
| [`mcp/`](mcp/) | `tools-list.sh`: raw JSON-RPC over Streamable HTTP | curl |
| | `node/search.mjs`: official MCP TypeScript SDK client | Node.js 20+ |
| | `python/search.py`: official MCP Python SDK client | Python 3.10+ |
| [`cli/`](cli/) | `shop.sh`: CLI cart flow | Tanatasa CLI, jq |

`rest/guest-cart.sh` and `cli/shop.sh` create a real guest cart, which expires unused after 30 days. They create a checkout link only if you set `CHECKOUT=1`. Even then, nothing is charged unless a buyer opens the link and pays.

Docs: [MCP server](../docs/mcp.md) · [REST API](../docs/api.md) · [CLI](../docs/cli.md) · [FAQ](../docs/faq.md) · Store: [tanatasa.sg](https://tanatasa.sg)
