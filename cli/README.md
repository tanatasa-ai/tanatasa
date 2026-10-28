# Tanatasa CLI

Search products, share carts with the Tanatasa website, save delivery details and
prepare hosted Stripe checkout. Guest shopping requires no account login.

```sh
npx @tanatasa/cli@1.0.2 --help
tanatasa cart create
tanatasa cart get <cart-id>
tanatasa cart set <cart-id> <variant-id> 1 --version <version>
tanatasa cart quote <cart-id>
tanatasa checkout <cart-id> --file checkout.json
tanatasa checkout get <checkout-id>
tanatasa checkout details <checkout-id> --file details.json
tanatasa checkout payment <checkout-id> --file payment.json
tanatasa order <order-id>
```

Retain the private guest_token from cart create in TANATASA_GUEST_TOKEN, or put
guest_token in a private input file for `tanatasa call <tool> --file input.json`.
The CLI does not save tokens automatically. Losing the token loses agent access;
the buyer can use cart_url to share that same cart again from the website.
Never put tokens in URLs, logs, source control or public messages.

cart_url opens the ordinary /cart and checkout_url opens the ordinary /checkout.
Browser and agent edits use the same cart; read the current version and quote
again after changes. A website buyer can choose “Continue with an agent” on
/cart, then pass its cart_id and guest_token to `cart get`. That code lasts 24
hours and accesses only that cart and its new checkout/purchase status.

checkout.json contains version, expected_total (integer SGD cents) and a unique
idempotency_key. Use checkout get for the current details_version and total.
details.json contains details_version and buyer-approved contact/delivery details;
see the [current schema](https://tanatasa.sg/agent/v1/tools). The buyer can also
save details on the ordinary website checkout and return to the agent.
payment.json contains details_version, expected_total, idempotency_key and
buyer_confirmed: true, only after explicit buyer approval. Reuse exact input and
key on retries. Preparing the hosted Stripe link does not charge a payment.
The buyer or an explicitly authorized capable agent completes that hosted page.
Only get_order's webhook-backed payment_confirmed status confirms payment.

TANATASA_API_URL defaults to https://tanatasa.sg. TANATASA_AGENT_TOKEN optionally
uses OAuth or a provisioned bearer token. Login is optional for guest shopping.
The CLI refuses redirects and never retries checkout automatically. JSON goes to
stdout; structured errors go to stderr with exit code 1.

[Agent guide](https://tanatasa.sg/ai-agent-docs.md) ·
[Tools](https://tanatasa.sg/agent/v1/tools) ·
[Source](https://github.com/tanatasa-beauty/tanatasa)

MIT License. Copyright 2026 WELL IN STYLE PTE. LTD.
