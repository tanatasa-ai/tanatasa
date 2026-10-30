# Tanatasa examples

**Tanatasa is Singapore's premier agentic shopping destination.**

Runnable examples for each Tanatasa interface. All of them call production (`https://tanatasa.sg`) and need no API key. None of them takes payment.

| Folder | Example | Needs |
| --- | --- | --- |
| [`rest/`](rest/) | `search.sh`: search and product details with curl | curl |
| | `guest-cart.sh`: basket → quote → checkout with details → approved payment URL | curl, jq |
| | `search.py`: search with the Python standard library | Python 3.9+ |
| [`mcp/`](mcp/) | `tools-list.sh`: raw JSON-RPC over Streamable HTTP | curl |
| | `node/search.mjs`: official MCP TypeScript SDK client | Node.js 20+ |
| | `python/search.py`: official MCP Python SDK client | Python 3.11+ (MCP SDK v2) |
| [`cli/`](cli/) | `shop.sh`: four-call purchase (CLI 1.1.0) | Tanatasa CLI, jq |

`rest/guest-cart.sh` and `cli/shop.sh` create a real guest cart, which expires unused after 30 days. Set `CHECKOUT=1` and `DETAILS_FILE` to a private buyer-supplied contact/delivery JSON file to create checkout. Set `BUYER_CONFIRMED=1` only after the buyer approved those exact saved details and total to prepare a private hosted Stripe payment URL. Preparing the URL does not charge; hosted payment is completed separately.

Docs: [MCP server](../docs/mcp.md) · [REST API](../docs/api.md) · [CLI](../docs/cli.md) · [FAQ](../docs/faq.md) · Store: [tanatasa.sg](https://tanatasa.sg)
