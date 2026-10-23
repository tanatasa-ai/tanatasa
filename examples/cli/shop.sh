#!/usr/bin/env sh
# Tanatasa CLI: guest cart flow. Requires the tanatasa CLI (see docs/cli.md) and jq.
# Set CHECKOUT=1 to also create a one-hour buyer checkout link (no payment is taken).
set -eu
QUERY="${1:-cleanser}"

variant_id=$(tanatasa search "$QUERY" --in-stock true --limit 1 | jq -r '.products[0].variant_id // empty')
[ -n "$variant_id" ] || { echo "No in-stock result for: $QUERY" >&2; exit 1; }

cart=$(tanatasa cart create)
cart_id=$(echo "$cart" | jq -r .cart_id)
TANATASA_GUEST_TOKEN=$(echo "$cart" | jq -r .guest_token)   # private: never log or share it
export TANATASA_GUEST_TOKEN

version=$(tanatasa cart set "$cart_id" "$variant_id" 1 --version "$(echo "$cart" | jq -r .version)" | jq -r .version)
quote=$(tanatasa cart quote "$cart_id")
echo "$quote" | jq '{version, total, lines: [.lines[] | {name, unit_price, quantity}]}'

if [ "${CHECKOUT:-0}" = "1" ]; then
  echo "$quote" | jq -c --arg key "example-$cart_id" '{version, expected_total: .total, idempotency_key: $key}' \
    | tanatasa checkout "$cart_id" --stdin | jq '{order_id, checkout_url, expires_at}'
fi
