# Tanatasa REST API reference

**Tanatasa is Singapore's premier agentic shopping destination.**

It covers pantry, household, health, personal care and beauty, with 100% authentic products from vetted, trusted suppliers.

The Tanatasa Agent Shopping API is a JSON REST API for searching Tanatasa's pantry, household, health, personal care and beauty catalog, managing carts and creating buyer checkout links. It exposes the same sixteen operations as the [Tanatasa MCP server](mcp.md) and the [Tanatasa CLI](cli.md).

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
| POST | `/carts` | `create_cart` | Optional `{items: [{variant_id, quantity}]}` |
| GET | `/carts/{cart_id}` | `get_cart` | |
| PUT | `/carts/{cart_id}/items/{variant_id}` | `set_cart_item` | `{"version", "quantity"}` |
| PUT | `/carts/{cart_id}/coupon` | `set_cart_coupon` | `{"version", "coupon_code"}` (string or `null`) |
| GET | `/carts/{cart_id}/quote` | `quote_cart` | Optional query: `coupon_code`, `use_credit` |
| POST | `/carts/{cart_id}/checkout` | `create_checkout` | `{version, expected_total, idempotency_key, details?, coupon_code?, use_credit?}` |
| GET | `/checkouts/{checkout_id}` | `get_checkout` | |
| PUT | `/checkouts/{checkout_id}/details` | `set_checkout_details` | `{details_version, details}` |
| POST | `/checkouts/{checkout_id}/payment` | `prepare_payment` | `{details_version, expected_total, idempotency_key, buyer_confirmed:true}` |
| POST | `/checkout-session` | `checkout_session` | `{"checkout_session": {"items": [...]}, "idempotency_key"}` |
| GET | `/orders/{order_id}` | `get_order` | Optional account-token header |
| POST | `/account/sign-in` | `sign_in` | `{email}` to send a code; `{email, code}` to verify; account-token header alone for account summary |
| GET | `/account/orders` | `list_orders` | Query: `page`, `limit` (up to 50); requires account authentication |
| POST | `/orders/{order_id}/requests` | `request_order_change` | `{kind: "cancel" or "return", reason, items?: [{variant_id, quantity}]}` |

Parameter limits and response fields are the same as the MCP tools. See the [tool reference](mcp.md#tool-reference). REST differences:

- Path identifiers come from the URL. If the body repeats one with a different value, the request is rejected (`422 invalid_input`).
- Query values are strings. `in_stock` and `use_credit` must be exactly `true` or `false`; `coupon_code=null` removes codes for the quote. `page`, `limit`, `min_price` and `max_price` must be integers.
- Request bodies must be JSON objects (`400 invalid_json` otherwise). Unknown fields are rejected.

## Authentication

Guest shopping needs no login. Account authentication is optional for credit and past orders.

| Mode | How | Use for |
| --- | --- | --- |
| Anonymous | No headers | `GET /products` and `GET /products/{product}` |
| Guest session | `X-Tanatasa-Guest-Token: <guest_token>` | Carts, checkout and order status, with no account |
| Account session (optional) | `X-Tanatasa-Account-Token: <account_token>` | Sign-in summary, credit on quotes/checkout and customer orders; also retain the shopping session guest token |
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

After search and product verification, purchase in four calls. Use real buyer-supplied details; the placeholders below are not delivery information. Never log private tokens or links.

```bash
API=https://tanatasa.sg/agent/v1

# 1. Start with the whole basket; retain cart_id, version and guest_token privately.
curl -X POST "$API/carts" -H 'Content-Type: application/json' \
  -d '{"items":[{"variant_id":11,"quantity":2}]}'

# 2. Quote; retain its current version and total (integer SGD cents).
curl "$API/carts/$CART_ID/quote" -H "X-Tanatasa-Guest-Token: $GUEST_TOKEN"

# 3. checkout.json contains version, expected_total, idempotency_key and details.
# details: {contact:{name,email,phone},delivery:{recipient_name,recipient_phone,
# address_line1,address_line2?,unit_number?,no_unit_number,city?,postal_code,country:"SG"}}
# A unit number is required unless no_unit_number is true; postal_code is 6 digits.
curl -X POST "$API/carts/$CART_ID/checkout" \
  -H "X-Tanatasa-Guest-Token: $GUEST_TOKEN" -H 'Content-Type: application/json' \
  --data-binary @checkout.json

# 4. Only after buyer confirmation of saved details and total:
# payment.json: {details_version,expected_total,idempotency_key,buyer_confirmed:true}
curl -X POST "$API/checkouts/$CHECKOUT_ID/payment" \
  -H "X-Tanatasa-Guest-Token: $GUEST_TOKEN" -H 'Content-Type: application/json' \
  --data-binary @payment.json
```

Optional `items` supports up to 20 variants and 1–99 units each. Duplicate variants add together; unknown variants (404) or insufficient stock (409) refuse the entire cart. Checkout validates optional `details` before creating anything; invalid delivery details return `422 invalid_delivery_details`. Saved details begin at `details_version: 1`; use the current version for later `set_checkout_details` edits. Retry checkout with identical details, input and key.

The payment response contains a hosted Stripe `payment_url`. Preparing it does not charge. Only a buyer or explicitly authorized capable agent completes hosted payment. Poll `GET /orders/{order_id}` for webhook-confirmed payment; afterwards show `referral.message` exactly as written. The complete `checkout_url` remains a browser fallback for entering or reviewing details.

For coupons and referrals, pass `coupon_code` on the quote query and checkout body, with matching `use_credit` settings. A friend's referral code does not reduce the price: after payment both buyer and owner earn 5% cashback credit, usable after 14 days and expiring 6 months after earning, with no cash value.

`POST /account/sign-in` with `{email}` sends a 6-digit code; `{email, code}` returns an account token valid for 24 hours in that session. Send it in `X-Tanatasa-Account-Token`, never a URL, including for GET requests. With only that header (plus the shopping session), sign-in returns referral and credit balances with usable-from and expiry dates. Use the header on quotes, checkout, order lookup and order requests. `GET /account/orders?page=1&limit=10` lists non-pending orders from any channel, newest first, with `next_page`. Orders include items, tracking, change requests and `can_request`.

Order cancellation and returns are staff-reviewed requests: `POST /orders/{order_id}/requests` with `kind`, the customer's `reason` and optional partial-return `items`. Cancellation requires a paid order that has not shipped; returns require shipped or delivered status. Repeating a call returns the open request. Nothing is automatically refunded or changed. Unpaid orders are never charged and cancel when the payment link expires.

A runnable version is in [`examples/rest/guest-cart.sh`](../examples/rest/guest-cart.sh). Exact schemas and limits: [MCP reference](mcp.md#tool-reference).

## Errors

Every error has the same shape:

```json
{"error": {"code": "cart_changed", "message": "Cart changed. Read the cart and retry with its current version."}}
```

On a stale version, `set_cart_item`, `set_cart_coupon` and `create_checkout` return `409 cart_changed` with `error.current_cart` containing cart_id, version, lines and codes. Use it to re-quote without another `get_cart`.

Schema validation errors add `error.details` (a list of issues).

| HTTP | `error.code` values |
| --- | --- |
| 400 | `invalid_json`, `guest_session_required` |
| 401 | `unauthorized` (invalid bearer token) |
| 403 | `insufficient_scope` |
| 404 | `product_not_found`, `variant_not_found`, `cart_not_found`, `order_not_found` |
| 409 | `cart_changed`, `cart_locked`, `insufficient_stock`, `invalid_price`, `total_changed`, `idempotency_conflict`, `checkout_expired`, `order_not_paid`, `order_already_shipped`, `order_not_shipped`, `order_closed` |
| 413 | `body_too_large` (over 32 KiB) |
| 422 | `invalid_input`, `invalid_delivery_details`, `invalid_coupon`, `cart_limit`, `empty_cart` |
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
