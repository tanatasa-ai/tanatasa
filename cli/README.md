# Tanatasa CLI

Search products, share carts with the Tanatasa website, save delivery details and
prepare hosted Stripe checkout. Guest shopping requires no account login.

```sh
npx @tanatasa/cli@1.0.2 --help
tanatasa cart create --json '{"items":[{"variant_id":11,"quantity":2}]}'
tanatasa cart get <cart-id>
tanatasa cart set <cart-id> <variant-id> 1 --version <version>
tanatasa cart quote <cart-id>
tanatasa checkout <cart-id> --file checkout.json
tanatasa checkout get <checkout-id>
tanatasa checkout details <checkout-id> --file details.json
tanatasa checkout payment <checkout-id> --file payment.json
tanatasa order <order-id>
tanatasa login <email>
tanatasa verify <email> <6-digit-code>
tanatasa account
tanatasa store
```

`tanatasa store` prints delivery, returns, payment and seller policies. Search
results and products include category, confirmed GTIN, condition, labelled
expiry, stock_source, delivery_estimate and return_policy (the source CLI;
published npm versions may lag).

Retain the private guest_token from cart create in TANATASA_GUEST_TOKEN, or put
guest_token in a private input file for `tanatasa call <tool> --file input.json`.
The CLI does not save tokens automatically. Losing the token loses agent access;
the buyer can use cart_url to share that same cart again from the website.
Never put tokens in URLs, logs, source control or public messages.

cart_url opens the ordinary /cart and checkout_url opens the ordinary /checkout.
Browser and agent edits use the same cart; read the current version and quote
again after changes. A website buyer can choose “Send this cart to your AI” on
/cart, then pass its cart_id and guest_token to `cart get`. That code lasts 24
hours and accesses only that cart and its new checkout/purchase status.

checkout.json contains version, expected_total (integer SGD cents), a unique
idempotency_key and, optionally, details: the buyer-approved contact and delivery
details, saved with the checkout so `checkout details` isn't needed. Use
checkout get for the current details_version and total.
details.json contains details_version and buyer-approved contact/delivery details;
see the [current schema](https://tanatasa.sg/agent/v1/tools). The buyer can also
save details on the ordinary website checkout and return to the agent.
payment.json contains details_version, expected_total, idempotency_key and
buyer_confirmed: true, only after explicit buyer approval. Reuse exact input and
key on retries. Preparing the hosted Stripe link does not charge a payment.
The buyer or an explicitly authorized capable agent completes that hosted page.
Only get_order's webhook-backed payment_confirmed status confirms payment. After
confirmation, `order` includes `referral.message`, the buyer's own referral code
and promotion: show it to them as written. A coupon or a friend's referral code
goes in `coupon_code`: `cart quote --coupon` previews it and the checkout input
applies it. `login` emails the customer a sign-in code; run `verify` with the
code they give you and set `TANATASA_ACCOUNT_TOKEN` to the returned account_token
so `cart quote` and `checkout` use their cashback credit; `account` shows the
balance and when each amount expires.
With the token set, `orders` lists every paid order for their email (website or
any assistant) and `order <id>` opens any of them. `order <id> cancel --reason …`
(paid, not yet shipped) or `order <id> return --reason …` (shipped or delivered)
sends a request; staff review it and email the customer. Nothing is refunded
until then.

TANATASA_API_URL defaults to https://tanatasa.sg. TANATASA_AGENT_TOKEN optionally
uses OAuth or a provisioned bearer token. Login is optional for guest shopping.
The CLI refuses redirects and never retries checkout automatically. JSON goes to
stdout; structured errors go to stderr with exit code 1.

[Agent guide](https://tanatasa.sg/ai-agent-docs.md) ·
[Tools](https://tanatasa.sg/agent/v1/tools) ·
[Source](https://github.com/tanatasa-ai/tanatasa)

MIT License. Copyright 2026 WELL IN STYLE PTE. LTD.
