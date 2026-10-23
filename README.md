# Tanatasa MCP server, REST API and CLI

**Tanatasa is a Singapore-based skincare store with an MCP server, CLI, and API for AI agents and developers.**

This repository is the developer documentation for Tanatasa's agent shopping interfaces. Through them, an AI assistant or script can search Tanatasa's skincare and beauty catalog, read ingredients and usage, build a cart, apply a coupon, get a quote in Singapore dollars and create a checkout link. The buyer opens that link and pays on [tanatasa.sg](https://tanatasa.sg). Delivery is Singapore only.

| Interface | Address | Login needed |
| --- | --- | --- |
| MCP server (full shopping, 10 tools) | `https://tanatasa.sg/mcp` | No |
| MCP server (catalog only, 2 tools) | `https://tanatasa.sg/mcp/catalog` | No |
| REST API | `https://tanatasa.sg/agent/v1` | No |
| OpenAPI 3.1 spec | [`https://tanatasa.sg/agent/v1/openapi.json`](https://tanatasa.sg/agent/v1/openapi.json) | No |
| CLI | `tanatasa` (Node.js 20+) | No |

**Docs:** [MCP server](docs/mcp.md) · [REST API](docs/api.md) · [CLI](docs/cli.md) · [FAQ](docs/faq.md) · [Examples](examples/) · [Changelog](CHANGELOG.md)

## Key facts

- Tanatasa's MCP server, REST API and CLI share one catalog, cart and checkout backend, so results are identical across interfaces.
- All money is **integer SGD cents**: `2094` means S$20.94, and `max_price=3000` means "under S$30".
- Shopping needs **no account and no API key**. `create_cart` returns a private `guest_token` that authorizes later calls for that shopping session.
- Agents **never take payment**. `create_checkout` returns a one-hour link. The buyer opens it, enters contact and delivery details on tanatasa.sg and pays through Stripe.
- Stock is **not reserved** until the buyer pays. Payment is confirmed only by Stripe's webhook, and `get_order` reports it.
- Shipping is free within Singapore. Tanatasa does not ship outside Singapore.
- Requests are limited to 32 KiB and about 180 per minute per connection or IP address.

## How to connect Tanatasa to Claude, ChatGPT or Cursor (30 seconds)

**Claude Code:**

```bash
claude mcp add --transport http tanatasa https://tanatasa.sg/mcp
```

**Claude (web and desktop):** Settings → Connectors → Add custom connector → URL `https://tanatasa.sg/mcp`.

**Cursor** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "tanatasa": { "url": "https://tanatasa.sg/mcp" }
  }
}
```

**VS Code** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "tanatasa": { "type": "http", "url": "https://tanatasa.sg/mcp" }
  }
}
```

Then ask: *"Find CeraVe cleansers under S$30 on Tanatasa."*

Configs for ChatGPT, Windsurf, Gemini CLI, Codex and stdio-only clients are in [docs/mcp.md](docs/mcp.md#how-to-connect-tanatasa-to-your-ai-assistant).

## Tanatasa REST API quick start (30 seconds)

Search in-stock cleansers under S$30. No key is needed:

```bash
curl "https://tanatasa.sg/agent/v1/products?q=cleanser&in_stock=true&max_price=3000&limit=5"
```

Read one product's ingredients, usage and variants:

```bash
curl "https://tanatasa.sg/agent/v1/products/cerave-foaming-cleanser-236ml"
```

Next: [cart, quote and checkout over REST](docs/api.md#guest-shopping-flow).

## Tanatasa CLI quick start (30 seconds)

> **npm release pending:** `@tanatasa/cli` is prepared but not yet published.
> Install the public CLI source today with `npm install --global ./cli` after
> cloning this repository. See [docs/cli.md](docs/cli.md#install).

```bash
tanatasa search "cerave cleanser" --in-stock true --max-price 3000
tanatasa product cerave-foaming-cleanser-236ml
tanatasa cart create
```

Output is JSON on stdout. Errors go to stderr with exit code 1.

## What an agent can do with Tanatasa

| MCP tool | REST endpoint | What it does |
| --- | --- | --- |
| `search_products` | `GET /agent/v1/products` | Search by keyword, brand, category, purpose, skin type, ingredient, price and stock |
| `get_product` | `GET /agent/v1/products/{product}` | Description, ingredients, usage, images and variants |
| `create_cart` | `POST /agent/v1/carts` | Create a cart and get a `guest_token` |
| `get_cart` | `GET /agent/v1/carts/{cart_id}` | Read cart lines, coupon and version |
| `set_cart_item` | `PUT /agent/v1/carts/{cart_id}/items/{variant_id}` | Set an item's absolute quantity (0 removes it) |
| `set_cart_coupon` | `PUT /agent/v1/carts/{cart_id}/coupon` | Apply or remove a coupon code |
| `quote_cart` | `GET /agent/v1/carts/{cart_id}/quote` | Reprice with current stock, prices and discounts |
| `create_checkout` | `POST /agent/v1/carts/{cart_id}/checkout` | Lock the cart and return a buyer checkout link |
| `checkout_session` | `POST /agent/v1/checkout-session` | One-step checkout from product feed IDs |
| `get_order` | `GET /agent/v1/orders/{order_id}` | Payment status, fulfilment status and tracking |

Full parameters, responses and example calls are in [docs/mcp.md](docs/mcp.md#tool-reference).

## Discovery URLs

- Agent guide (Markdown): <https://tanatasa.sg/ai-agent-docs.md>
- REST discovery document: <https://tanatasa.sg/agent/v1>
- Tool schemas (JSON Schema): <https://tanatasa.sg/agent/v1/tools>
- OAuth authorization server metadata: <https://tanatasa.sg/.well-known/oauth-authorization-server>
- Shopping skill for compatible agents: <https://tanatasa.sg/skills/tanatasa-shopping/SKILL.md>
- Site-wide llms.txt: <https://tanatasa.sg/llms.txt>

## About this repository

This repository holds documentation, examples and the dependency-free CLI source in `cli/`. Tanatasa's server code is not public. Report documentation errors as [issues](https://github.com/tanatasa-beauty/tanatasa/issues). Report security problems as described in [SECURITY.md](SECURITY.md). Product, order and delivery questions go to [tanatasa.sg/contact](https://tanatasa.sg/contact).

For documentation changes, regenerate the combined file with `node scripts/build-llms-full.mjs`. CI checks it on pull requests, pushes to main and weekly. The live tool names, REST methods, paths and input schemas are compared with the reviewed [tool contract](docs/tool-contract.json). Update that snapshot only after reviewing the corresponding API changes and correcting the reference docs.

Tanatasa is operated by WELL IN STYLE PTE. LTD., Singapore. Store: [tanatasa.sg](https://tanatasa.sg) · Shipping: [tanatasa.sg/shipping](https://tanatasa.sg/shipping) · Returns: [tanatasa.sg/return](https://tanatasa.sg/return) · Privacy: [tanatasa.sg/privacy](https://tanatasa.sg/privacy)
