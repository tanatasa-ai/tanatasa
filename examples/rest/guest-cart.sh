#!/usr/bin/env sh
# Tanatasa REST API: guest cart flow without an account.
# Creates a cart, adds the first in-stock search result, and quotes it.
# Set CHECKOUT=1 to also create a one-hour buyer checkout link (no payment is taken).
# Requires curl and jq.
set -eu
API="${TANATASA_API_URL:-https://tanatasa.sg}/agent/v1"
QUERY="${1:-cleanser}"

variant_id=$(curl -fsS -G "$API/products" --data-urlencode "q=$QUERY" \
  -d in_stock=true -d limit=1 | jq -r '.products[0].variant_id // empty')
[ -n "$variant_id" ] || { echo "No in-stock result for: $QUERY" >&2; exit 1; }

cart=$(curl -fsS -X POST "$API/carts" -H 'Content-Type: application/json' -d '{}')
cart_id=$(echo "$cart" | jq -r .cart_id)
token=$(echo "$cart" | jq -r .guest_token)   # private: never log or share it
version=$(echo "$cart" | jq -r .version)
echo "cart_id=$cart_id"

# Quantity is absolute; the response carries the new version.
version=$(curl -fsS -X PUT "$API/carts/$cart_id/items/$variant_id" \
  -H "X-Tanatasa-Guest-Token: $token" -H 'Content-Type: application/json' \
  -d "{\"version\":$version,\"quantity\":1}" | jq -r .version)

quote=$(curl -fsS "$API/carts/$cart_id/quote" -H "X-Tanatasa-Guest-Token: $token")
echo "$quote" | jq '{version, lines: [.lines[] | {variant_id, name, unit_price, quantity}], subtotal, discount, shipping, total}'

if [ "${CHECKOUT:-0}" = "1" ]; then
  total=$(echo "$quote" | jq -r .total)
  curl -fsS -X POST "$API/carts/$cart_id/checkout" \
    -H "X-Tanatasa-Guest-Token: $token" -H 'Content-Type: application/json' \
    -d "{\"version\":$version,\"expected_total\":$total,\"idempotency_key\":\"example-$cart_id\"}" \
    | jq '{order_id, checkout_url, expires_at, total, payment_status}'
fi
