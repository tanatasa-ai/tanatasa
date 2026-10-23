// Read-only check. To accept a reviewed API change, update docs/mcp.md and
// docs/tool-contract.json together. Never refresh this snapshot automatically.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort()
    .filter(key => key !== 'description' && key !== '$schema')
    .map(key => [key, canonical(value[key])]));
}
const contract = tools => tools.map(({ name, method, path, input_schema }) =>
  canonical({ name, method, path, input_schema })).sort((a, b) => a.name.localeCompare(b.name));
const response = await fetch('https://tanatasa.sg/agent/v1/tools', {
  headers: { 'User-Agent': 'tanatasa-docs-check/1.0 (+https://github.com/tanatasa-beauty/tanatasa)' },
  redirect: 'error', signal: AbortSignal.timeout(30000),
});
assert.equal(response.status, 200, 'Public tool manifest is unavailable');
const live = contract((await response.json()).tools);
const expected = contract(JSON.parse(await readFile(new URL('../docs/tool-contract.json', import.meta.url), 'utf8')));
assert.deepEqual(live, expected, 'API contract changed: review parameter limits, required fields, methods and paths in the docs');
console.log(`Reviewed contracts match for ${live.length} tools`);
