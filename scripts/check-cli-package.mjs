import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const [pack] = JSON.parse(await readFile(process.argv[2], 'utf8'));
assert.equal(pack.name, '@tanatasa/cli');
assert.deepEqual(pack.files.map(file => file.path).sort(), ['LICENSE', 'README.md', 'bin/tanatasa.mjs', 'package.json']);
assert.ok(pack.unpackedSize < 50000, 'Unexpected package size');
console.log(`Verified ${pack.filename}: ${pack.files.length} public files, ${pack.unpackedSize} bytes`);
