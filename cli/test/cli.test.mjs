import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { run, parseArgs } from '../bin/tanatasa.mjs';

test('installed entry point runs through Unix-style npm symlinks', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'tanatasa-cli-test-'));
  try {
    const link = join(directory, 'tanatasa.mjs');
    try { await symlink(fileURLToPath(new URL('../bin/tanatasa.mjs', import.meta.url)), link); }
    catch (error) {
      if (process.platform === 'win32' && error.code === 'EPERM') return t.skip('Windows requires symlink privileges; Linux CI exercises this');
      throw error;
    }
    const result = spawnSync(process.execPath, [link, '--help'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Tanatasa agent shopping CLI/);
    const version = spawnSync(process.execPath, [link, '--version'], { encoding: 'utf8' });
    assert.equal(version.status, 0, version.stderr);
    assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+$/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

const env = { TANATASA_API_URL: 'http://localhost:8787', TANATASA_AGENT_TOKEN: 'test-token' };
const tools = [
  { name: 'search_products', method: 'GET', path: '/agent/v1/products' },
  { name: 'set_cart_item', method: 'PUT', path: '/agent/v1/carts/:cart_id/items/:variant_id' },
  { name: 'create_checkout', method: 'POST', path: '/agent/v1/carts/:cart_id/checkout' },
];
function fakeFetch() {
  const calls = [];
  return { calls, fetchImpl: async (url, init) => {
    calls.push({ url: String(url), ...init });
    return Response.json(String(url).endsWith('/tools') ? { tools } : { ok: true });
  } };
}
test('search encodes terms, typed filters and bearer authentication', async () => {
  const fake = fakeFetch();
  assert.deepEqual(await run(['search', 'CeraVe & cleanser', '--in-stock', 'true', '--max-price', '2500'], { env, ...fake }), { ok: true });
  const request = fake.calls[1];
  const url = new URL(request.url);
  assert.equal(url.searchParams.get('q'), 'CeraVe & cleanser');
  assert.equal(url.searchParams.get('max_price'), '2500');
  assert.equal(url.searchParams.get('in_stock'), 'true');
  assert.equal(request.headers.Authorization, 'Bearer test-token');
  assert.equal(request.redirect, 'error');
});
test('allows anonymous catalog filters and guest shopping without an account token', async () => {
  const fake = fakeFetch(), publicEnv = { TANATASA_API_URL: env.TANATASA_API_URL };
  await run(['search', 'cleanser', '--skin-type', 'sensitive', '--purpose', 'sensitive-skin', '--ingredient', 'ceramides'], { env: publicEnv, ...fake });
  const url = new URL(fake.calls[1].url);
  assert.equal(url.searchParams.get('skin_type'), 'sensitive');
  assert.equal(url.searchParams.get('purpose'), 'sensitive-skin');
  assert.equal(url.searchParams.get('ingredient'), 'ceramides');
  assert.equal(fake.calls[1].headers.Authorization, undefined);
  const guest = fakeFetch();
  await run(['cart', 'set', 'cart-1', '11', '1', '--version', '1'], { env: { ...publicEnv, TANATASA_GUEST_TOKEN: 'a'.repeat(64) }, ...guest });
  assert.equal(guest.calls[1].headers.Authorization, undefined);
  assert.equal(guest.calls[1].headers['X-Tanatasa-Guest-Token'], 'a'.repeat(64));
});
test('cart set uses absolute quantity, version and resource IDs in URL', async () => {
  const fake = fakeFetch();
  await run(['cart', 'set', 'cart-1', '11', '0', '--version', '3'], { env, ...fake });
  assert.equal(fake.calls[1].url, 'http://localhost:8787/agent/v1/carts/cart-1/items/11');
  assert.equal(fake.calls[1].method, 'PUT');
  assert.deepEqual(JSON.parse(fake.calls[1].body), { quantity: 0, version: 3 });
});
test('generic calls and checkout accept stdin and preserve idempotency input', async () => {
  const fake = fakeFetch();
  const input = { version: 2, expected_total: 3060, idempotency_key: 'purchase-1' };
  await run(['checkout', 'cart-1', '--stdin'], { env, ...fake, stdin: Readable.from([JSON.stringify(input)]) });
  assert.deepEqual(JSON.parse(fake.calls[1].body), input);
  const generic = fakeFetch();
  await run(['call', 'set_cart_item', '--json', '{"cart_id":"c","variant_id":11,"quantity":1,"version":2}'], { env, ...generic });
  assert.equal(generic.calls[1].url, 'http://localhost:8787/agent/v1/carts/c/items/11');
});
test('rejects insecure remote endpoints, bad flags, conflicting resources and ambiguous input', async () => {
  const fake = fakeFetch();
  await assert.rejects(run(['tools', '--url', 'http://remote.example'], { env, ...fake }), /HTTPS/);
  assert.throws(() => parseArgs(['search', 'x', '--wat']), /Unknown option/);
  await assert.rejects(run(['cart', 'set', 'c', '11', '1.2', '--version', '1'], { env, ...fake }), /integer/);
  await assert.rejects(run(['checkout', 'c', '--json', '{"cart_id":"other"}'], { env, ...fake }), /Conflicting cart_id/);
  await assert.rejects(run(['call', 'create_checkout', '--json', '{}', '--stdin'], { env, ...fake }), /exactly one/);
});
test('surfaces structured API errors', async () => {
  const fetchImpl = async (url) => String(url).endsWith('/tools') ? Response.json({ tools }) : Response.json({ error: { code: 'cart_changed', message: 'Get the latest version' } }, { status: 409 });
  await assert.rejects(run(['cart', 'set', 'c', '11', '1', '--version', '1'], { env, fetchImpl }), (error) => error.result.status === 409 && error.result.error.code === 'cart_changed');
});
