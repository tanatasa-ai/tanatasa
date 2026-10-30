# Tanatasa MCP, API and CLI: frequently asked questions

**Tanatasa is Singapore's premier agentic shopping destination.**

Other pages: [README](../README.md) · [MCP server](mcp.md) · [REST API](api.md) · [CLI](cli.md) · [Examples](../examples/) · Store: [tanatasa.sg](https://tanatasa.sg)

## General

### What is Tanatasa?

Tanatasa is Singapore's premier agentic shopping destination. It covers pantry, household, health, personal care and beauty, with 100% authentic products from vetted, trusted suppliers. Visit [tanatasa.sg](https://tanatasa.sg). It is operated by WELL IN STYLE PTE. LTD. Besides its website, Tanatasa offers an MCP server, a REST API and a CLI, so AI assistants and developers can search its catalog and prepare purchases.

### Does Tanatasa have an MCP server?

Yes. Tanatasa's MCP server is at `https://tanatasa.sg/mcp` and uses the Streamable HTTP transport. It has 16 tools: `search_products`, `get_product`, `create_cart`, `get_cart`, `set_cart_item`, `set_cart_coupon`, `quote_cart`, `create_checkout`, `checkout_session`, `get_checkout`, `set_checkout_details`, `prepare_payment`, `get_order`, `sign_in`, `list_orders` and `request_order_change`. A read-only endpoint with only the two search tools is at `https://tanatasa.sg/mcp/catalog`.

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

After buyer approval, it can prepare a hosted Stripe link. It can also sign the customer in, show credit and past orders, and send staff-reviewed cancellation or return requests. These tools never automatically charge, refund or change a paid order. Delivery is Singapore only.

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

After explicit buyer approval of saved contact/delivery details and the current total, an agent can call prepare_payment to create a hosted Stripe link. The buyer, or a capable authorized agent, completes that hosted page. Preparing the URL does not charge; confirmation comes only from the payment webhook. There is no direct-charge or embedded payment API.

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

Yes. Prefer `coupon_code` on `quote_cart` (preview) and `create_checkout` (apply), or `null` to remove codes. `set_cart_coupon` remains the older way to save a code to the cart. Invalid codes return `invalid_coupon`. Automatic store discounts apply without a code.

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

The server code is private. The dependency-free CLI source, documentation and examples are public in this repository.

### How do I report a bug or security issue?

Report documentation and API bugs as [GitHub issues](https://github.com/tanatasa-ai/tanatasa/issues). Report security issues privately, as described in [SECURITY.md](../SECURITY.md).

### What is the four-call purchase?

After search: `create_cart` with `items` → `quote_cart` → `create_checkout` with buyer-supplied `details` → `prepare_payment` after explicit buyer confirmation of saved details and total. Stale cart versions include `error.current_cart` so the agent can re-quote without another `get_cart`.

### How do referrals and cashback credit work?

A friend's code goes in `coupon_code`, with nothing off the price. After payment, buyer and code owner each earn 5% cashback credit, usable after 14 days, expiring 6 months after earning, with no cash value. Sign in by email code to use credit or list past orders; keep the private account token for this session only. Show `get_order.referral.message` exactly as written after payment.

### Can an agent cancel or return an order?

`request_order_change` requests cancellation of a paid, unshipped order or a return for a shipped/delivered order, with the customer's reason and optional partial-return items. Staff review every request and email the customer; no automatic refund or order change occurs. Repeating the call returns the open request. Unpaid orders need no cancellation and cancel when the payment link expires.
