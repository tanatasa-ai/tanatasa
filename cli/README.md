# Tanatasa CLI

Search Singapore skincare and beauty products, read ingredients, build guest
carts and create buyer checkout links. The buyer reviews the order and pays on
tanatasa.sg. All amounts and price filters are integer SGD cents.

Requires Node.js 20 or later. No npm dependencies or account login are required.

## Install

```sh
npm install --global @tanatasa/cli
tanatasa --version
tanatasa search "cerave cleanser" --in-stock true --max-price 3000
```

Or run without a global install:

```sh
npx @tanatasa/cli search "cerave cleanser" --in-stock true --max-price 3000
```

See the [release status and source installation instructions](https://github.com/tanatasa-beauty/tanatasa/blob/main/docs/cli.md)
if the initial npm release is still pending.

## Commands

```sh
tanatasa --help
tanatasa tools
tanatasa product cerave-foaming-cleanser-236ml
tanatasa cart create
```

Retain the private `guest_token` returned by `cart create`. Set
`TANATASA_GUEST_TOKEN` for subsequent cart, checkout and order-status calls.
Keep the token out of logs and URLs. Treat checkout links as private.

```sh
tanatasa cart set <cart-id> <variant-id> 1 --version 1
tanatasa cart quote <cart-id>
tanatasa checkout <cart-id> --file checkout.json
```

`checkout.json` contains `version`, `expected_total` in SGD cents, and a unique
`idempotency_key`. Reuse the exact input and key when retrying. Checkout creates
a buyer review link; it does not take payment. Stock is not reserved.

## Configuration

- `TANATASA_API_URL`: defaults to `https://tanatasa.sg`. Use HTTPS; HTTP is
  accepted only on localhost. Override per command with `--url`.
- `TANATASA_GUEST_TOKEN`: private shopping-session token.
- `TANATASA_AGENT_TOKEN`: optional provisioned integration credential or OAuth
  access token. OAuth sign-in and refresh are handled by the connecting host.

The CLI refuses redirects and does not retry checkout automatically. Successful
commands print JSON on stdout; `--help` and `--version` print text. Errors print
JSON on stderr and exit with status 1. Input JSON is limited to 32 KiB.

[Full CLI reference](https://github.com/tanatasa-beauty/tanatasa/blob/main/docs/cli.md)
· [REST API](https://github.com/tanatasa-beauty/tanatasa/blob/main/docs/api.md)
· [Report a vulnerability](https://github.com/tanatasa-beauty/tanatasa/blob/main/SECURITY.md)

MIT License. Copyright 2026 WELL IN STYLE PTE. LTD.
