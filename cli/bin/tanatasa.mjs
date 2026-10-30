#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const HELP = `Tanatasa agent shopping CLI — JSON output, money in SGD cents.

Set TANATASA_API_URL (default https://tanatasa.sg). Account login is optional.
Run cart create; retain its guest_token in TANATASA_GUEST_TOKEN for later calls.
TANATASA_AGENT_TOKEN optionally uses a trusted token or OAuth access token.
TANATASA_ACCOUNT_TOKEN carries a signed-in customer's account_token (from verify),
so quotes and checkout can use their cashback credit.

  tanatasa tools
  tanatasa store
  tanatasa --version
  tanatasa search "cerave cleanser" --in-stock true --max-price 3000
  tanatasa search "gift for dad under $40"
  tanatasa search "cleanser" --purpose sensitive-skin --skin-type sensitive --ingredient ceramides
  tanatasa product <product-id-or-slug-or-sku>
  tanatasa cart create [--json '{"items":[{"variant_id":11,"quantity":2}]}']
  tanatasa cart get <cart-id>
  tanatasa cart set <cart-id> <variant-id> <quantity> --version <version>
  tanatasa cart coupon <cart-id> <code-or-null> --version <version>
  tanatasa cart quote <cart-id> --coupon <code-or-null> --use-credit false
  tanatasa checkout <cart-id> --file checkout.json
  tanatasa checkout get <checkout-id>
  tanatasa checkout details <checkout-id> --file details.json
  tanatasa checkout payment <checkout-id> --file payment.json
  tanatasa order <order-id>
  tanatasa order <order-id> cancel --reason "<why>"
  tanatasa order <order-id> return --reason "<why>"
  tanatasa orders --page <page>
  tanatasa login <email>
  tanatasa verify <email> <6-digit-code>
  tanatasa account
  tanatasa call <tool-name> --json '{...}'
  tanatasa call <tool-name> --file input.json
  tanatasa call <tool-name> --stdin

Search matches words at their start, with synonyms; a phrase such as "under $40"
sets max_price when --max-price is absent (see interpreted_query in the result).
Products include category, gtin (confirmed only), condition, expiry (labelled only),
stock_source, tanatasa_pick, delivery_estimate and return_policy; quotes include
delivery_estimate and return_policy. store prints delivery, returns, payment and
seller policies from /agent/v1/store.
Checkout input: version, expected_total, idempotency_key, optional coupon_code
and optional details (buyer contact and delivery, same shape as checkout details).
Keep the same key and exact input on retries. Save buyer-supplied contact/delivery
details with checkout details, then confirm the current total and details_version.
checkout payment requires buyer_confirmed=true and returns a hosted Stripe URL;
it does not charge a payment. The buyer or an explicitly authorized capable agent
completes hosted payment. Check order for webhook-confirmed status. The full
checkout_url also supports browser review and entry of delivery details.
After payment, order includes referral.message: the buyer's own referral code and
promotion. Show it to them exactly as written. A coupon or a friend's referral
code (cashback for both after payment, nothing off the price) goes in coupon_code:
cart quote --coupon previews it, and checkout input applies it. cart coupon still
saves one to the cart.
login emails the customer a sign-in code; ask them for it and run verify, then set
TANATASA_ACCOUNT_TOKEN. account shows their credit balance and each expiry date.
Credit applies only when the checkout email is theirs; --use-credit false quotes
without it.
After login, orders lists every paid order for their email (website or any
assistant), and order <id> opens any of them. order <id> cancel (paid, not yet
shipped) or return (shipped or delivered) sends a request with --reason; staff
review it and email the customer. Nothing is refunded until then.
Quantity is absolute; zero removes. Use the latest cart version after every edit.
cart_url and checkout_url open the normal storefront pages with this same cart.
To resume a website cart, choose "Send this cart to your AI" on /cart and use its
private cart_id and guest_token with cart get. Browser edits require a fresh quote.
The CLI does not persist guest tokens: retain them securely between invocations.
API errors go to stderr with exit code 1. Use --url only for a trusted server.
`;
const flags = new Set(['url', 'json', 'file', 'stdin', 'version', 'brand', 'category', 'purpose', 'skin-type', 'ingredient', 'min-price', 'max-price', 'page', 'limit', 'in-stock', 'use-credit', 'coupon', 'reason']);
export function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) { positional.push(argv[i]); continue; }
    const key = argv[i].slice(2);
    if (!flags.has(key)) throw new Error(`Unknown option: --${key}`);
    if (key in options) throw new Error(`Repeated option: --${key}`);
    if (key === 'stdin') options[key] = true;
    else { const value = argv[++i]; if (value == null || value.startsWith('--')) throw new Error(`Missing value for --${key}`); options[key] = value; }
  }
  return { positional, options };
}
function integer(value, name) {
  if (value == null || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error(`${name} must be an integer`);
  return Number(value);
}
async function inputJson(options, stdin) {
  const sources = ['json', 'file', 'stdin'].filter((k) => k in options);
  if (sources.length !== 1) throw new Error('Use exactly one of --json, --file or --stdin');
  let raw = options.json;
  if (options.file) raw = await readFile(options.file, 'utf8');
  if (options.stdin) {
    raw = '';
    for await (const chunk of stdin) { raw += chunk; if (Buffer.byteLength(raw) > 32768) throw new Error('Input exceeds 32 KiB'); }
  }
  if (Buffer.byteLength(raw) > 32768) throw new Error('Input exceeds 32 KiB');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Input must be a JSON object');
  return parsed;
}
export async function run(argv, { env = process.env, fetchImpl = fetch, stdin = process.stdin } = {}) {
  if (argv.length === 1 && argv[0] === '--version') {
    const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    return { help: `${version}\n` };
  }
  if (!argv.length || argv.includes('--help') || argv[0] === 'help') return { help: HELP };
  const { positional: p, options: o } = parseArgs(argv);
  const base = new URL(o.url ?? env.TANATASA_API_URL ?? 'https://tanatasa.sg');
  if (base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('API URL must be an origin without credentials, path or query');
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))) throw new Error('Use HTTPS, or HTTP on localhost');
  const request = async (path, method = 'GET', body) => {
    const headers = { Accept: 'application/json', 'User-Agent': 'tanatasa-cli' };
    if (env.TANATASA_AGENT_TOKEN) headers.Authorization = `Bearer ${env.TANATASA_AGENT_TOKEN}`;
    if (env.TANATASA_GUEST_TOKEN) headers['X-Tanatasa-Guest-Token'] = env.TANATASA_GUEST_TOKEN;
    if (env.TANATASA_ACCOUNT_TOKEN) headers['X-Tanatasa-Account-Token'] = env.TANATASA_ACCOUNT_TOKEN;
    if (body != null) headers['Content-Type'] = 'application/json';
    const response = await fetchImpl(new URL(path, base), { method, headers, ...(body != null ? { body: JSON.stringify(body) } : {}), redirect: 'error', signal: AbortSignal.timeout(60000) });
    const result = await response.json();
    if (!response.ok) { const error = new Error(result.error?.message ?? `HTTP ${response.status}`); error.result = { ...result, status: response.status }; throw error; }
    return result;
  };
  if (p[0] === 'store' && p.length === 1) return request('/agent/v1/store');
  const manifest = await request('/agent/v1/tools');
  if (p[0] === 'tools' && p.length === 1) return manifest;
  let name, args;
  const exact = (count) => { if (p.length !== count) throw new Error('Unexpected or missing command arguments. Run --help.'); };
  if (p[0] === 'call') { exact(2); name = p[1]; args = await inputJson(o, stdin); }
  else if (p[0] === 'search') {
    exact(2); name = 'search_products'; args = { q: p[1] };
    for (const key of ['brand', 'category', 'purpose', 'skin-type', 'ingredient']) if (o[key]) args[key.replace('-', '_')] = o[key];
    for (const key of ['min-price', 'max-price', 'page', 'limit']) if (o[key] != null) args[key.replace('-', '_')] = integer(o[key], key);
    if (o['in-stock'] != null) { if (!['true', 'false'].includes(o['in-stock'])) throw new Error('--in-stock must be true or false'); args.in_stock = o['in-stock'] === 'true'; }
  } else if (p[0] === 'product') { exact(2); name = 'get_product'; args = { product: p[1] }; }
  else if (p[0] === 'order' && p.length === 2) { name = 'get_order'; args = { order_id: p[1] }; }
  else if (p[0] === 'order' && ['cancel', 'return'].includes(p[2])) {
    exact(3); if (!o.reason) throw new Error('--reason is required');
    name = 'request_order_change'; args = { order_id: p[1], kind: p[2], reason: o.reason };
  }
  else if (p[0] === 'orders') { exact(1); name = 'list_orders'; args = {}; if (o.page != null) args.page = integer(o.page, 'page'); if (o.limit != null) args.limit = integer(o.limit, 'limit'); }
  else if (p[0] === 'login') { exact(2); name = 'sign_in'; args = { email: p[1] }; }
  else if (p[0] === 'verify') { exact(3); name = 'sign_in'; args = { email: p[1], code: p[2] }; }
  else if (p[0] === 'account') { exact(1); name = 'sign_in'; args = {}; }
  else if (p[0] === 'checkout' && ['get', 'details', 'payment'].includes(p[1])) {
    exact(3); name = { get: 'get_checkout', details: 'set_checkout_details', payment: 'prepare_payment' }[p[1]];
    args = p[1] === 'get' ? {} : await inputJson(o, stdin);
    if (args.checkout_id && args.checkout_id !== p[2]) throw new Error('Conflicting checkout_id');
    args.checkout_id = p[2];
  }
  else if (p[0] === 'checkout') { exact(2); name = 'create_checkout'; args = await inputJson(o, stdin); if (args.cart_id && args.cart_id !== p[1]) throw new Error('Conflicting cart_id'); args.cart_id = p[1]; }
  else if (p[0] === 'cart') {
    const action = p[1];
    if (action === 'create') { exact(2); name = 'create_cart'; args = ['json', 'file', 'stdin'].some((k) => k in o) ? await inputJson(o, stdin) : {}; }
    else if (action === 'get' || action === 'quote') {
      exact(3); name = action === 'get' ? 'get_cart' : 'quote_cart'; args = { cart_id: p[2] };
      if (action === 'quote' && o['use-credit'] != null) { if (!['true', 'false'].includes(o['use-credit'])) throw new Error('--use-credit must be true or false'); args.use_credit = o['use-credit'] === 'true'; }
      if (action === 'quote' && o.coupon != null) args.coupon_code = o.coupon === 'null' ? null : o.coupon;
    }
    else if (action === 'set') { exact(5); name = 'set_cart_item'; args = { cart_id: p[2], variant_id: integer(p[3], 'variant-id'), quantity: integer(p[4], 'quantity'), version: integer(o.version, 'version') }; }
    else if (action === 'coupon') { exact(4); name = 'set_cart_coupon'; args = { cart_id: p[2], coupon_code: p[3] === 'null' ? null : p[3], version: integer(o.version, 'version') }; }
  }
  const tool = manifest.tools.find((t) => t.name === name);
  if (!tool) throw new Error('Unknown command or tool. Run --help or tools.');
  const rest = { ...args };
  // MCP uses a tool argument; REST carries the same capability in a header.
  if (rest.guest_token != null) {
    env = { ...env, TANATASA_GUEST_TOKEN: rest.guest_token };
    delete rest.guest_token;
  }
  if (rest.account_token != null) {
    env = { ...env, TANATASA_ACCOUNT_TOKEN: rest.account_token };
    delete rest.account_token;
  }
  const path = tool.path.replace(/:([a-z_]+)/g, (_, key) => {
    if (rest[key] == null) throw new Error(`Missing ${key}`);
    const value = encodeURIComponent(rest[key]); delete rest[key]; return value;
  });
  if (!path.startsWith('/agent/v1/') || path.includes('..') || !['GET', 'POST', 'PUT'].includes(tool.method)) throw new Error('Invalid tool route');
  if (tool.method === 'GET') {
    const query = new URLSearchParams(Object.entries(rest).map(([key, value]) => [key, String(value)]));
    return request(`${path}${query.size ? `?${query}` : ''}`);
  }
  return request(path, tool.method, rest);
}
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  try { const result = await run(process.argv.slice(2)); process.stdout.write(result.help ?? `${JSON.stringify(result)}\n`); }
  catch (error) { process.stderr.write(`${JSON.stringify(error.result ?? { error: { code: 'cli_error', message: error.message } })}\n`); process.exitCode = 1; }
}
