# Tanatasa REST API reference

**Tanatasa is a Singapore-based skincare store with an MCP server, CLI, and API for AI agents and developers.**

The Tanatasa Agent Shopping API is a JSON REST API for searching Tanatasa's skincare and beauty catalog, managing carts and creating buyer checkout links. It exposes the same thirteen operations as the [Tanatasa MCP server](mcp.md) and the [Tanatasa CLI](cli.md).

Other pages: [README](../README.md) · [MCP server](mcp.md) · [CLI](cli.md) · [FAQ](faq.md) · [Examples](../examples/) · Store: [tanatasa.sg](https://tanatasa.sg)

## Base URL and specification

| | |
| --- | --- |
| Base URL | `https://tanatasa.sg/agent/v1` |
| OpenAPI 3.1 | [`https://tanatasa.sg/agent/v1/openapi.json`](https://tanatasa.sg/agent/v1/openapi.json) (title "Tanatasa Agent Shopping API", version 1.0.0) |
| Tool manifest | [`https://tanatasa.sg/agent/v1/tools`](https://tanatasa.sg/agent/v1/tools): name, method, path and JSON Schema for every operation |
| Discovery | [`https://tanatasa.sg/agent/v1`](https://tanatasa.sg/agent/v1): links to every agent surface |
| Format | JSON in and out. All money is **integer SGD cents**. |

The OpenAPI document is generated from the same schemas the server validates against, so it is always current. Use it to generate a typed client.


## Use the same cart on the website and with an agent

Cart responses include a private `cart_url` on the normal /cart page; checkout_url opens the normal /checkout page. The website and MCP/API/CLI use the same versioned cart. Browser edits require a fresh get_cart and quote, then a new checkout revision. Payment preparation freezes cart edits until resolved or expired.

To start on the website, choose **Continue with an agent** on /cart and privately share its cart_id and guest_token. Use them with get_cart, not create_cart or checkout_session. This access lasts 24 hours and is limited to that cart and its new checkout/purchase status. The buyer can choose **Save details and return to agent** on checkout; read get_checkout again for the current details_version before requesting approval for payment.

Guest shopping needs no account login. A guest token is private shopping-session access, not account authentication. Never put tokens in URLs, public messages or logs. The CLI does not persist guest tokens automatically; retain them securely. The buyer can re-share the same cart from its cart_url if agent session access was lost.

After buyer approval of current details and total, prepare_payment creates a hosted Stripe payment_url without charging. The buyer, or a capable agent with explicit purchase authorization, completes that hosted page. There is no direct-charge API. Only webhook-backed get_order status confirms payment.

## Endpoints

| Method | Path | Operation | Body / query |
| --- | --- | --- | --- |
| GET | `/products` | `search_products` | Query: `q`, `brand`, `category`, `purpose`, `skin_type`, `ingredient`, `min_price`, `max_price`, `in_stock`, `page`, `limit` |
| GET | `/products/{product}` | `get_product` | `product` = product ID, product slug, variant slug or SKU |
| POST | `/carts` | `create_cart` | `{}` |
| GET | `/carts/{cart_id}` | `get_cart` | |
| PUT | `/carts/{cart_id}/items/{variant_id}` | `set_cart_item` | `{"version", "quantity"}` |
| PUT | `/carts/{cart_id}/coupon` | `set_cart_coupon` | `{"version", "coupon_code"}` (string or `null`) |
| GET | `/carts/{cart_id}/quote` | `quote_cart` | |
| POST | `/carts/{cart_id}/checkout` | `create_checkout` | `{"version", "expected_total", "idempotency_key"}` |
| GET | `/checkouts/{checkout_id}` | `get_checkout` | |
| PUT | `/checkouts/{checkout_id}/details` | `set_checkout_details` | `{details_version, details}` |
| POST | `/checkouts/{checkout_id}/payment` | `prepare_payment` | `{details_version, expected_total, idempotency_key, buyer_confirmed:true}` |
| POST | `/checkout-session` | `checkout_session` | `{"checkout_session": {"items": [...]}, "idempotency_key"}` |
| GET | `/orders/{order_id}` | `get_order` | |

Parameter limits and response fields are the same as the MCP tools. See the [tool reference](mcp.md#tool-reference). REST differences:

- Path identifiers come from the URL. If the body repeats one with a different value, the request is rejected (`422 invalid_input`).
- Query values are strings. `in_stock` must be exactly `true` or `false`. `page`, `limit`, `min_price` and `max_price` must be integers.
- Request bodies must be JSON objects (`400 invalid_json` otherwise). Unknown fields are rejected.

## Authentication

There are three ways to call the API. Guest is the default.

| Mode | How | Use for |
| --- | --- | --- |
| Anonymous | No headers | `GET /products` and `GET /products/{product}` |
| Guest session | `X-Tanatasa-Guest-Token: <guest_token>` | Carts, checkout and order status, with no account |
| Bearer (optional) | `Authorization: Bearer <token>` | An OAuth access token from Tanatasa account linking, or a provisioned integration credential |

How guest sessions work:

1. `POST /carts` with no auth returns a `guest_token` (64 hex characters) along with the cart.
2. Send it in the `X-Tanatasa-Guest-Token` header on every later cart, checkout and order call.
3. **Never put it in a URL.** A `guest_token` query parameter is rejected with `422`.
4. Keep it private. Anyone holding it can act on that session's carts and orders.

Bearer details:

- OAuth scopes are `catalog:read`, `cart:write` and `orders:read`. A token without the scope an endpoint needs gets `403 insufficient_scope`.
- An invalid bearer token gets `401` with a `WWW-Authenticate` header. It never falls back to guest access.
- Trusted server-to-server integrations can ask for a credential through [tanatasa.sg/contact](https://tanatasa.sg/contact). Never ship one in a public client.

**User-Agent:** send a descriptive `User-Agent`, such as `my-agent/1.0 (+https://example.com)`, to identify your integration. Python's default `Python-urllib` User-Agent also works on the documented agent API, MCP and documentation endpoints (verified 23 October 2026). Storefront browser challenges remain active separately; API authentication and rate limits still apply.

**Browser calls:** the API sends no CORS headers for other origins. Call it from a server, script or agent runtime, not from front-end JavaScript on another site.

## Guest shopping flow

```bash
API=https://tanatasa.sg/agent/v1

# 1. Search
curl "$API/products?q=cerave%20cleanser&in_stock=true&max_price=3000&limit=5"

# 2. Create a cart, then keep cart_id and guest_token
curl -X POST "$API/carts" -H 'Content-Type: application/json' -d '{}'
# {"cart_id":"38d60b03-…","version":1,"lines":[],"coupon_code":null,"checkout_id":null,"guest_token":"<64 hex>"}

# 3. Set a quantity (absolute; 0 removes)
curl -X PUT "$API/carts/$CART_ID/items/469" \
  -H "X-Tanatasa-Guest-Token: $GUEST_TOKEN" -H 'Content-Type: application/json' \
  -d '{"version":1,"quantity":2}'
# {"cart_id":"38d60b03-…","version":2,"lines":[{"variant_id":469,"quantity":2}],"coupon_code":null,"checkout_id":null}

# 4. Quote, then keep version and total
curl "$API/carts/$CART_ID/quote" -H "X-Tanatasa-Guest-Token: $GUEST_TOKEN"
# {…,"subtotal":4188,"discount":0,"shipping":0,"total":4188,"stock_reserved":false,…}

# 5. Create the buyer checkout link (no payment happens here)
curl -X POST "$API/carts/$CART_ID/checkout" \
  -H "X-Tanatasa-Guest-Token: $GUEST_TOKEN" -H 'Content-Type: application/json' \
  -d '{"version":2,"expected_total":4188,"idempotency_key":"purchase-20261023-1"}'
# {"checkout_id":"…","order_id":"…","checkout_url":"https://tanatasa.sg/checkout#…",
#  "handoff_options":[…],"expires_at":"…","total":4188,"payment_status":"awaiting_customer",…}

# 6. Check status later
curl "$API/orders/$ORDER_ID" -H "X-Tanatasa-Guest-Token: $GUEST_TOKEN"
```

Give the buyer the complete `checkout_url`, including everything after `#`. On tanatasa.sg the buyer reviews the items, enters contact and Singapore delivery details, checks the total and pays through Stripe. The link expires one hour after creation.

A runnable version is in [`examples/rest/guest-cart.sh`](../examples/rest/guest-cart.sh).

## Errors

Every error has the same shape:

```json
{"error": {"code": "cart_changed", "message": "Cart changed. Read the cart and retry with its current version."}}
```

Schema validation errors add `error.details` (a list of issues).

| HTTP | `error.code` values |
| --- | --- |
| 400 | `invalid_json`, `guest_session_required` |
| 401 | `unauthorized` (invalid bearer token) |
| 403 | `insufficient_scope` |
| 404 | `product_not_found`, `variant_not_found`, `cart_not_found`, `order_not_found` |
| 409 | `cart_changed`, `cart_locked`, `insufficient_stock`, `invalid_price`, `total_changed`, `idempotency_conflict`, `checkout_expired` |
| 413 | `body_too_large` (over 32 KiB) |
| 422 | `invalid_input`, `invalid_coupon`, `cart_limit`, `empty_cart` |
| 429 | `rate_limit_exceeded`; wait for the number of seconds in `Retry-After` |
| 503 | `service_unavailable`, `not_configured`; retry, and for checkout reuse the same `idempotency_key` |

What each code means and how to recover: [MCP error table](mcp.md#errors).

## Rate limits and caching

- About **180 requests per minute** per bearer identity, or per client IP address for anonymous and guest calls. When you exceed it you get `429` with a `Retry-After` header.
- Request bodies up to **32 KiB**.
- All operation responses, including search, are sent with `Cache-Control: no-store`. Prices and stock change, so re-quote before checkout instead of caching.

## Idempotency and concurrency

- **Cart versions:** every successful edit increments `version`. Edits that send an old version fail with `409 cart_changed`. They never silently overwrite.
- **Checkout keys:** `POST /carts/{cart_id}/checkout` with the same `idempotency_key` and identical body returns the same checkout. Sending the same key with a different body returns `409 idempotency_conflict`.
- **`/checkout-session` keys:** the same key with the same items returns the same checkout. With no key, each call creates a new purchase.
- **Cart lifetime:** unlocked carts expire 30 days after their last edit.

## Related

- [MCP server and tool reference](mcp.md)
- [CLI](cli.md)
- [FAQ](faq.md)
- [REST examples](../examples/rest/)
- OAuth metadata: <https://tanatasa.sg/.well-known/oauth-authorization-server>
