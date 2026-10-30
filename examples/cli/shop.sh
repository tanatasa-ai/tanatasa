#!/usr/bin/env sh
# Four-call purchase with CLI 1.1.0 and jq. npm may be at 1.0.2 until release.
# Default: basket and quote only. CHECKOUT=1 and private DETAILS_FILE enable checkout.
# Set BUYER_CONFIRMED=1 only after approval of exact details and total.
# Never enable shell tracing or log tokens/payment links.
set -eu
QUERY="${1:-rice}"
variant_id=$(tanatasa search "$QUERY" --in-stock true --limit 1 | jq -r '.products[0].variant_id // empty')
[ -n "$variant_id" ] || { echo "No in-stock result for: $QUERY" >&2; exit 1; }
# 1. Create the basket in one call.
cart=$(tanatasa cart create --json "$(jq -nc --argjson id "$variant_id" '{items:[{variant_id:$id,quantity:1}]}')")
cart_id=$(echo "$cart" | jq -r .cart_id)
TANATASA_GUEST_TOKEN=$(echo "$cart" | jq -r .guest_token)
export TANATASA_GUEST_TOKEN
# 2. Quote with current version and delivered total.
quote=$(tanatasa cart quote "$cart_id")
echo "$quote" | jq '{version,total,lines:[.lines[]|{name,unit_price,quantity}]}'
if [ "${CHECKOUT:-0}" = "1" ]; then
  : "${DETAILS_FILE:?Set DETAILS_FILE to private buyer-supplied contact/delivery JSON}"
  # 3. Create checkout with details; retry the identical input and key.
  input=$(jq -nc --argjson q "$quote" --slurpfile d "$DETAILS_FILE" --arg key "example-$cart_id" '{version:$q.version,expected_total:$q.total,idempotency_key:$key,details:$d[0]}')
  checkout=$(tanatasa checkout "$cart_id" --json "$input")
  echo "$checkout" | jq '{checkout_id,order_id,details_version,total,expires_at}'
  # 4. Only after buyer confirmation of saved details and total.
  if [ "${BUYER_CONFIRMED:-0}" = "1" ]; then
    checkout_id=$(echo "$checkout" | jq -r .checkout_id)
    payment=$(jq -nc --argjson c "$checkout" --arg key "example-payment-$cart_id" '{details_version:$c.details_version,expected_total:$c.total,idempotency_key:$key,buyer_confirmed:true}')
    tanatasa checkout payment "$checkout_id" --json "$payment" | jq '{order_id,payment_url}'
    # URL is private. Complete hosted payment separately with authorization.
    # Then tanatasa order <order-id> checks webhook-confirmed payment.
    # Show referral.message exactly as written when paid.
  fi
fi
