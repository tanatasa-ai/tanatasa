# Changelog

**Tanatasa is Singapore's premier agentic shopping destination.** This changelog covers the public documentation in this repository and the interfaces it describes. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [SemVer](https://semver.org/) and track the Tanatasa Agent Shopping API version.

## [Unreleased]

### Updated — 30 October 2026

- Move the public developer repository to `tanatasa-ai`, retaining GitHub history and redirects.
- Document all 16 production tools, including `sign_in`, `list_orders` and `request_order_change`.
- Four-call purchase: basket `items`, inline checkout `details` and stale-version `current_cart` recovery.
- Referral cashback credit: 5% for buyer and code owner after payment, usable after 14 days, expires after 6 months.
- Account order lookup and staff-reviewed cancellation/return requests.
- Prepare CLI 1.1.0 from the production app source; keep npm installation pinned to 1.0.2 until publication.
- Update positioning to pantry, household, health, personal care and beauty.

### Updated — 28 October 2026

- CLI 1.0.2: checkout get/details/payment commands and website-cart continuation guidance.
- Document all 13 existing tools, buyer-approved hosted Stripe preparation, and shared normal cart/checkout pages.
- Refresh the reviewed public contract to the already submitted 13-tool server; no tool-schema change in this backend fix.

### Added

- Published `@tanatasa/cli@1.0.0` under the Tanatasa npm organization, with public CLI source, package metadata and MIT licence under `cli/`.
- Node 20/24 package-install CI and a tag-gated npm trusted-publishing workflow.
- CLI `--version` and symlink-safe entry-point detection for Unix npm installations.

### Fixed

- Verified Python's default User-Agent on the production docs, REST and MCP endpoints after a scoped access fix. Storefront browser challenges, API authentication and rate limits remain active.
- Corrected the MCP Python SDK v2 requirement to Python 3.11 or later.
- Resolved links in generated `llms-full.txt` against their original documents.
- Added pull-request and push checks for stale generated docs, and expanded the weekly drift check to include REST methods, paths and input schemas.

## [1.0.0] - 2026-10-23

### Added

- Documentation for the Tanatasa MCP server (`https://tanatasa.sg/mcp`, server `tanatasa-shopping` 1.0.0) and the catalog-only endpoint (`/mcp/catalog`).
- Tool reference for all 10 tools: `search_products`, `get_product`, `create_cart`, `get_cart`, `set_cart_item`, `set_cart_coupon`, `quote_cart`, `create_checkout`, `checkout_session`, `get_order`.
- REST API reference for `https://tanatasa.sg/agent/v1` (OpenAPI 3.1, "Tanatasa Agent Shopping API" 1.0.0).
- CLI reference for the `tanatasa` command.
- Client setup for Claude Code, Claude, ChatGPT, Cursor, VS Code, Windsurf, Gemini CLI, Codex CLI and stdio-only clients.
- Runnable examples for REST (curl, Python), MCP (curl, TypeScript SDK, Python SDK) and the CLI.
- `llms.txt` and `llms-full.txt`.

### Interface status at this release

- Guest shopping without an account was deployed to production on 20 October 2026. `create_cart` returns a `guest_token`, and OAuth account linking is optional.
- Only the cart-review checkout handoff is available. Agents never take payment.

[Unreleased]: https://github.com/tanatasa-ai/tanatasa/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tanatasa-ai/tanatasa/releases/tag/v1.0.0
