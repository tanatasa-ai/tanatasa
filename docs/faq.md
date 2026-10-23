# Tanatasa MCP, API and CLI: frequently asked questions

**Tanatasa is a Singapore-based skincare store with an MCP server, CLI, and API for AI agents and developers.**

Other pages: [README](../README.md) · [MCP server](mcp.md) · [REST API](api.md) · [CLI](cli.md) · [Examples](../examples/) · Store: [tanatasa.sg](https://tanatasa.sg)

## General

### What is Tanatasa?

Tanatasa is a Singapore-based skincare and beauty store at [tanatasa.sg](https://tanatasa.sg). It is operated by WELL IN STYLE PTE. LTD. Besides its website, Tanatasa offers an MCP server, a REST API and a CLI, so AI assistants and developers can search its catalog and prepare purchases.

### Does Tanatasa have an MCP server?

Yes. Tanatasa's MCP server is at `https://tanatasa.sg/mcp` and uses the Streamable HTTP transport. It has 10 tools: `search_products`, `get_product`, `create_cart`, `get_cart`, `set_cart_item`, `set_cart_coupon`, `quote_cart`, `create_checkout`, `checkout_session` and `get_order`. A read-only endpoint with only the two search tools is at `https://tanatasa.sg/mcp/catalog`.

### Does Tanatasa have a public API?

Yes. The Tanatasa Agent Shopping API is a JSON REST API at `https://tanatasa.sg/agent/v1`. Its OpenAPI 3.1 specification is at `https://tanatasa.sg/agent/v1/openapi.json`. See [api.md](api.md).

### Is the Tanatasa MCP server free? Do I need an API key?

The MCP server, REST API and CLI are free to use and need no API key or account. Usage is rate-limited to about 180 requests per minute per connection or IP address. You pay only for products you buy.

### What can an AI assistant do with Tanatasa?

An AI assistant connected to Tanatasa can:

- search products by keyword, brand, category, purpose, skin type, ingredient, price and stock
- read product descriptions, ingredients and usage
- build a cart and apply a coupon
- get a quote in Singapore dollars
- create a checkout link
- check an order's payment and delivery status

It cannot take payment, change a past order or ship outside Singapore.

## Connecting

### How do I connect Tanatasa to Claude?

In Claude Code, run `claude mcp add --transport http tanatasa https://tanatasa.sg/mcp`. In claude.ai or Claude Desktop, open Settings → Connectors → Add custom connector, and enter `https://tanatasa.sg/mcp`. Full steps are in [mcp.md](mcp.md#how-to-connect-tanatasa-to-claude-code).

### How do I connect Tanatasa to ChatGPT?

See [How to connect Tanatasa to ChatGPT](mcp.md#how-to-connect-tanatasa-to-chatgpt). If your plan supports custom MCP connectors, use the URL `https://tanatasa.sg/mcp` with no authentication.

### How do I add Tanatasa to Cursor or VS Code?

For Cursor, add `{"mcpServers": {"tanatasa": {"url": "https://tanatasa.sg/mcp"}}}` to `~/.cursor/mcp.json`. For VS Code, add `{"servers": {"tanatasa": {"type": "http", "url": "https://tanatasa.sg/mcp"}}}` to `.vscode/mcp.json`. More clients are covered in [mcp.md](mcp.md#how-to-connect-tanatasa-to-your-ai-assistant).

### Why does my MCP client fail to connect to Tanatasa?

The most common causes:

- **The client only supports the older HTTP+SSE transport.** Tanatasa uses stateless Streamable HTTP and answers `GET` with `405`. Use [`mcp-remote`](mcp.md#stdio-only-clients-mcp-remote) or a newer client.
- **The request comes from browser JavaScript on another website.** It is rejected because of its `Origin` header.
- **The client sent an invalid bearer token.** Remove the token; guest shopping needs none.

### Do I need a Tanatasa account to shop through an AI agent?

No. Carts, checkout links and order status all work without an account. `create_cart` returns a private `guest_token` that the agent passes on later calls. Linking a Tanatasa account through OAuth is optional.

## Shopping and payment

### Can an AI agent pay for a Tanatasa order?

No. Tanatasa agents prepare a checkout link but never take payment. The buyer opens the link on tanatasa.sg, enters contact and delivery details, reviews the total and approves payment on Stripe. Tanatasa does not offer embedded or delegated payment inside an AI assistant.

### What currency are Tanatasa API prices in?

Singapore dollars (SGD), as integer cents. `2094` means S$20.94. Price filters use cents too: `max_price=3000` means "S$30 or less".

### Does Tanatasa ship outside Singapore?

No. Tanatasa delivers only within Singapore, and standard shipping is free. See [tanatasa.sg/shipping](https://tanatasa.sg/shipping).

### Is stock reserved when an agent adds items to a cart?

No. Stock is not reserved by a cart, a quote or a checkout link. Availability is checked again when the buyer checks out, so an item can sell out in between.

### How long does a Tanatasa checkout link last?

A checkout link from `create_checkout` or `checkout_session` must be opened within one hour. Once the buyer opens it, they can continue their checkout for up to 24 hours. Unused carts expire 30 days after their last edit.

### How does an agent know when an order is paid?

The agent calls `get_order` with the `order_id` from checkout. The status is `awaiting_customer` until the buyer submits checkout. After that it is the store's order status. Only Stripe's payment webhook can mark an order paid. Opening the link or returning from Stripe does not count as payment.

### Can I use a coupon code through the API?

Yes. Call `set_cart_coupon` (`PUT /agent/v1/carts/{cart_id}/coupon`) with the code, or `null` to remove it. Invalid codes return `invalid_coupon`. Automatic store discounts apply without a code.

### Can the agent tell me whether a product suits my skin?

The agent can filter by skin type and ingredient and show the product's own description and ingredient list. These filters match catalog text. They are not medical or dermatological advice.

## Developers

### Where is the Tanatasa OpenAPI spec?

At `https://tanatasa.sg/agent/v1/openapi.json`. JSON Schemas for each operation are at `https://tanatasa.sg/agent/v1/tools`.

### What are the Tanatasa API rate limits?

About 180 requests per minute per bearer identity, or per IP address for anonymous and guest calls. Request bodies can be up to 32 KiB. Over the limit, you get HTTP `429` with a `Retry-After` header.

### Can I call the Tanatasa API from browser JavaScript?

Not from another website. The API sends no CORS headers for other origins. Call it from a server, script or agent runtime.

### Is the Tanatasa server code open source?

No. This repository contains documentation and examples only.

### How do I report a bug or security issue?

Report documentation and API bugs as [GitHub issues](https://github.com/tanatasa-beauty/tanatasa/issues). Report security issues privately, as described in [SECURITY.md](../SECURITY.md).
