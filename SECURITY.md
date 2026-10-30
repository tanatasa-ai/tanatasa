# Security policy

**Tanatasa is Singapore's premier agentic shopping destination.**

## Scope

In scope:

- The Tanatasa MCP server (`https://tanatasa.sg/mcp`, `https://tanatasa.sg/mcp/catalog`)
- The REST API (`https://tanatasa.sg/agent/v1`)
- The OAuth endpoints (`https://tanatasa.sg/oauth/*`, `https://tanatasa.sg/.well-known/oauth-*`)
- The agent checkout handoff (`https://tanatasa.sg/checkout/agent`)
- The `tanatasa` CLI
- The examples in this repository

Examples of issues we want to hear about:

- access to another guest session's or customer's carts or orders
- `guest_token`, OAuth token or checkout-link leakage
- price, stock or total manipulation
- OAuth flaws

## Reporting a vulnerability

Report it privately. Do not open a public issue.

1. **Preferred:** use GitHub's private vulnerability reporting. Open the **Security** tab of this repository, then click **Report a vulnerability**.
2. **Alternative:** email `hello@tanatasa.com` with the subject `SECURITY`. <!-- TODO(security-contact): replace with a dedicated security@ address if one is created. -->

Include the affected URL or tool, the steps to reproduce, and the impact. Please don't include real customer data. Use guest sessions you created yourself.

We aim to acknowledge reports within 3 working days. <!-- TODO(security-sla): confirm this target. -->

## Testing rules

- Test only with guest sessions and carts you created.
- Do not complete real payments, and do not use real card numbers.
- Stay within the published rate limits (about 180 requests per minute). Do not run denial-of-service or load tests.
- Do not access, change or keep other people's data. If you reach any, stop and report it.

## Not vulnerabilities

- Public product, price and stock information returned without authentication. It is public by design.
- Getting a `guest_token` without an account. Guest sessions are intentional and isolated from each other.
- Missing CORS headers on the REST API. Cross-origin browser access is intentionally unsupported.
