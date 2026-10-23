# Tanatasa CLI

**Tanatasa is a Singapore-based skincare store with an MCP server, CLI, and API for AI agents and developers.**

The Tanatasa CLI (`tanatasa`) runs Tanatasa's shopping operations from a terminal or shell script. It is a thin, dependency-free client for the [Tanatasa REST API](api.md). Every command prints one JSON document, so it suits scripts, `jq` and agents that can run shell commands but have no MCP.

Other pages: [README](../README.md) · [MCP server](mcp.md) · [REST API](api.md) · [FAQ](faq.md) · [Examples](../examples/) · Store: [tanatasa.sg](https://tanatasa.sg)

## Install

Requires **Node.js 20 or later**. The CLI uses no npm dependencies.

> **TODO(cli-distribution):** the CLI is not published yet. Pick one option
> and replace this block:
>
> - npm: `npm install -g <package-name>` or `npx <package-name> --help`
> - or a single file in this repo: `node cli/tanatasa.mjs --help`

Check the install:

```bash
tanatasa --help
```

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `TANATASA_API_URL` | `https://tanatasa.sg` | API origin. Must be `https://`, or `http://` on `localhost`, `127.0.0.1` or `[::1]`, with no path, query or credentials. |
| `TANATASA_GUEST_TOKEN` | none | The `guest_token` from `tanatasa cart create`. Sent as the `X-Tanatasa-Guest-Token` header. |
| `TANATASA_AGENT_TOKEN` | none | Optional bearer token (OAuth access token or provisioned integration credential). |

`--url <origin>` overrides `TANATASA_API_URL` for one command. Use it only for a server you trust.

## Commands

| Command | Operation | Notes |
| --- | --- | --- |
| `tanatasa tools` | List operations | Prints the live tool manifest |
| `tanatasa search "<query>" [filters]` | `search_products` | Filters below |
| `tanatasa product <id-or-slug-or-sku>` | `get_product` | |
| `tanatasa cart create` | `create_cart` | Prints `cart_id`, `version`, `guest_token` |
| `tanatasa cart get <cart-id>` | `get_cart` | |
| `tanatasa cart set <cart-id> <variant-id> <quantity> --version <n>` | `set_cart_item` | Absolute quantity; `0` removes |
| `tanatasa cart coupon <cart-id> <code-or-null> --version <n>` | `set_cart_coupon` | Pass `null` to remove |
| `tanatasa cart quote <cart-id>` | `quote_cart` | |
| `tanatasa checkout <cart-id> --file checkout.json` | `create_checkout` | Also accepts `--json` or `--stdin` |
| `tanatasa order <order-id>` | `get_order` | |
| `tanatasa call <tool-name> --json '{...}'` | any | Raw call; also `--file <path>` or `--stdin` |

Search filters: `--brand`, `--category`, `--purpose`, `--skin-type`, `--ingredient`, `--min-price`, `--max-price`, `--in-stock true|false`, `--page`, `--limit`. Prices are SGD cents.

## How to shop Tanatasa from the command line

```bash
# Find in-stock CeraVe cleansers under S$30
tanatasa search "cerave cleanser" --in-stock true --max-price 3000

# Filter by skin type, or by ingredient
tanatasa search "cleanser" --skin-type sensitive
tanatasa search "moisturiser" --ingredient ceramide

# Product details (ingredients, usage, variants)
tanatasa product cerave-foaming-cleanser-236ml

# Start a guest session and keep the token for later commands
tanatasa cart create
export TANATASA_GUEST_TOKEN=<guest_token from the output>

# Add 2 units of variant 469 (cart version 1 → 2)
tanatasa cart set <cart-id> 469 2 --version 1

# Quote, then note version and total
tanatasa cart quote <cart-id>

# Create the buyer checkout link
echo '{"version":2,"expected_total":4188,"idempotency_key":"purchase-20261023-1"}' > checkout.json
tanatasa checkout <cart-id> --file checkout.json

# Check status later
tanatasa order <order-id>
```

A script version that uses `jq` is in [`examples/cli/shop.sh`](../examples/cli/shop.sh).

## Behaviour

- **Output:** on success, a single JSON document on stdout. On failure, a JSON error on stderr (`{"error":{"code","message"}}`, plus `status` for HTTP errors) and exit code `1`.
- **Money:** integer SGD cents, as everywhere in the API.
- **Safety:** the CLI refuses HTTP redirects. It never retries checkout automatically and never opens a browser. To retry `checkout`, send the same file with the same `idempotency_key`.
- **Input limits:** `--json`, `--file` and `--stdin` input must be a JSON object of at most 32 KiB.
- **Timeouts:** each request times out after 60 seconds.
- **Guest token in `call`:** if a `call` payload includes `guest_token`, the CLI moves it into the `X-Tanatasa-Guest-Token` header so that it never appears in a URL.

## Related

- [REST API](api.md): what the CLI calls underneath
- [MCP server](mcp.md): for MCP-capable assistants
- [FAQ](faq.md)
