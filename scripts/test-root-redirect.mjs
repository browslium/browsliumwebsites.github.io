import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const gateway = readFileSync(resolve(root, 'index.html'), 'utf8');
const script = gateway.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'root gateway has an inline redirect script');

function redirectFor(input, { saved = null, languages = ['en-US'] } = {}) {
  const url = new URL(input, 'https://browslium.com');
  let destination;
  runInNewContext(script, {
    location: {
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      replace(value) { destination = value; },
    },
    localStorage: { getItem() { return saved; } },
    navigator: { languages, language: languages[0] },
  });
  return destination;
}

assert.equal(redirectFor('/?utm_source=launch#text-future', { languages: ['es-MX'] }), '/es/?utm_source=launch#text-future');
assert.equal(redirectFor('/?utm_source=launch#text-future', { saved: 'fr', languages: ['es-MX'] }), '/fr/?utm_source=launch#text-future');
assert.equal(redirectFor('/?utm_source=launch#text-future', { languages: ['ja-JP'] }), '/en/?utm_source=launch#text-future');
assert.equal(redirectFor('/index.html?utm_source=launch#text-future', { languages: ['pt-BR'] }), '/pt-br/?utm_source=launch#text-future');
assert.equal(redirectFor('/en/?utm_source=launch#text-future', { languages: ['es-MX'] }), undefined);
assert.doesNotMatch(readFileSync(resolve(root, '404.html'), 'utf8'), /location\.replace/);

console.log('PASS: root-only language redirect retains query and fragment');
