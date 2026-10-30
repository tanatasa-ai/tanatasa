#!/usr/bin/env sh
# Four-call REST purchase after search. Requires curl and jq. Never enable shell tracing.
# Default: basket and quote only. CHECKOUT=1 and private DETAILS_FILE enable checkout.
# Set BUYER_CONFIRMED=1 only after approval of those exact details and total.
set -eu
API="${TANATASA_API_URL:-https://tanatasa.sg}/agent/v1"
QUERY="${1:-rice}"
variant_id=$(curl -fsS -G "$API/products" --data-urlencode "q=$QUERY" -d in_stock=true -d limit=1 | jq -r '.products[0].variant_id // empty')
[ -n "$variant_id" ] || { echo "No in-stock result for: $QUERY" >&2; exit 1; }
# 1. Start the whole basket in one call.
cart=$(curl -fsS -X POST "$API/carts" -H 'Content-Type: application/json' -d "$(jq -nc --argjson id "$variant_id" '{items:[{variant_id:$id,quantity:1}]}')")
cart_id=$(echo "$cart" | jq -r .cart_id)
token=$(echo "$cart" | jq -r .guest_token) # private: never log or share
# 2. Quote; this supplies the current version and delivered total.
quote=$(curl -fsS "$API/carts/$cart_id/quote" -H "X-Tanatasa-Guest-Token: $token")
echo "$quote" | jq '{version,total,lines:[.lines[]|{variant_id,name,unit_price,quantity}]}'
if [ "${CHECKOUT:-0}" = "1" ]; then
  : "${DETAILS_FILE:?Set DETAILS_FILE to private buyer-supplied contact/delivery JSON}"
  # 3. Save details with checkout, at details_version 1. See docs/mcp.md for shape.
  # Retry the identical input and key; never change details under the same key.
  input=$(jq -nc --argjson q "$quote" --slurpfile d "$DETAILS_FILE" --arg key "example-$cart_id" '{version:$q.version,expected_total:$q.total,idempotency_key:$key,details:$d[0]}')
  checkout=$(curl -fsS -X POST "$API/carts/$cart_id/checkout" -H "X-Tanatasa-Guest-Token: $token" -H 'Content-Type: application/json' -d "$input")
  echo "$checkout" | jq '{checkout_id,order_id,details_version,total,expires_at}'
  # 4. Only after confirmation of these saved details and total.
  if [ "${BUYER_CONFIRMED:-0}" = "1" ]; then
    checkout_id=$(echo "$checkout" | jq -r .checkout_id)
    payment=$(jq -nc --argjson c "$checkout" --arg key "example-payment-$cart_id" '{details_version:$c.details_version,expected_total:$c.total,idempotency_key:$key,buyer_confirmed:true}')
    curl -fsS -X POST "$API/checkouts/$checkout_id/payment" -H "X-Tanatasa-Guest-Token: $token" -H 'Content-Type: application/json' -d "$payment" | jq '{order_id,payment_url}'
    # payment_url is private, for the intended buyer. Preparing it does not charge.
    # Complete hosted Stripe payment separately with buyer authorization.
    # Poll GET /orders/{order_id}; only webhook-confirmed status means paid.
    # Show referral.message exactly as written after payment confirmation.
  fi
fi
