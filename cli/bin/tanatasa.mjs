#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const HELP = `Tanatasa agent shopping CLI — JSON output, money in SGD cents.

Set TANATASA_API_URL (default https://tanatasa.sg). Account login is optional.
Run cart create; retain its guest_token in TANATASA_GUEST_TOKEN for later calls.
TANATASA_AGENT_TOKEN optionally uses a trusted token or OAuth access token.

  tanatasa tools
  tanatasa --version
  tanatasa search "cerave cleanser" --in-stock true --max-price 3000
  tanatasa search "cleanser" --purpose sensitive-skin --skin-type sensitive --ingredient ceramides
  tanatasa product <product-id-or-slug-or-sku>
  tanatasa cart create
  tanatasa cart get <cart-id>
  tanatasa cart set <cart-id> <variant-id> <quantity> --version <version>
  tanatasa cart coupon <cart-id> <code-or-null> --version <version>
  tanatasa cart quote <cart-id>
  tanatasa checkout <cart-id> --file checkout.json
  tanatasa order <order-id>
  tanatasa call <tool-name> --json '{...}'
  tanatasa call <tool-name> --file input.json
  tanatasa call <tool-name> --stdin

Checkout input: version, expected_total, idempotency_key.
Keep the same key and exact input on retries. Give the full checkout_url to the
buyer to review the cart and enter delivery details on Tanatasa before payment.
Quantity is absolute; zero removes. Use the latest cart version after every edit.
API errors go to stderr with exit code 1. Use --url only for a trusted server.
`;
const flags = new Set(['url', 'json', 'file', 'stdin', 'version', 'brand', 'category', 'purpose', 'skin-type', 'ingredient', 'min-price', 'max-price', 'page', 'limit', 'in-stock']);
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
    const headers = { Accept: 'application/json' };
    if (env.TANATASA_AGENT_TOKEN) headers.Authorization = `Bearer ${env.TANATASA_AGENT_TOKEN}`;
    if (env.TANATASA_GUEST_TOKEN) headers['X-Tanatasa-Guest-Token'] = env.TANATASA_GUEST_TOKEN;
    if (body != null) headers['Content-Type'] = 'application/json';
    const response = await fetchImpl(new URL(path, base), { method, headers, ...(body != null ? { body: JSON.stringify(body) } : {}), redirect: 'error', signal: AbortSignal.timeout(60000) });
    const result = await response.json();
    if (!response.ok) { const error = new Error(result.error?.message ?? `HTTP ${response.status}`); error.result = { ...result, status: response.status }; throw error; }
    return result;
  };
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
  else if (p[0] === 'order') { exact(2); name = 'get_order'; args = { order_id: p[1] }; }
  else if (p[0] === 'checkout') { exact(2); name = 'create_checkout'; args = await inputJson(o, stdin); if (args.cart_id && args.cart_id !== p[1]) throw new Error('Conflicting cart_id'); args.cart_id = p[1]; }
  else if (p[0] === 'cart') {
    const action = p[1];
    if (action === 'create') { exact(2); name = 'create_cart'; args = {}; }
    else if (action === 'get' || action === 'quote') { exact(3); name = action === 'get' ? 'get_cart' : 'quote_cart'; args = { cart_id: p[2] }; }
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
