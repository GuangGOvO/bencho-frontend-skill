import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discoverAssets, extractCatalog, createSnapshot, compareSnapshots } from '../scripts/upstream.mjs';

const html = '<script type="module" src="/assets/index-ab.js"></script><link href="/assets/index-cd.css" rel="stylesheet"><script src="https://third.party/tracker.js"></script>';
const bundle = '{id:`like`,seo:`Like`,name:`Like`,cat:`Press`,kind:`Press`,demo:[]},{id:`compare`,seo:`Compare`,fresh:!0,name:`Compare`,cat:`Drag`,kind:`Drag`,css:`x`}';
const assets = discoverAssets(html);
const snapshot = () => createSnapshot(html, bundle, 'css', 'licence', assets, '2026-10-05T00:00:00Z');

test('catalog parser reads facts without executing source and sorts by ID', () => {
  const data = extractCatalog(bundle + ';throw new Error("must never execute")');
  assert.deepEqual(data.map(item => item.id), ['compare', 'like']);
  assert.equal(data[1].url, 'https://bencho.dev/blocks/like');
});
test('same-origin asset selection ignores analytics and rejects redirects/ambiguous inputs', () => {
  assert.equal(assets.script, 'https://bencho.dev/assets/index-ab.js');
  assert.throws(() => discoverAssets('<script src="https://evil.example/assets/index-aa.js"></script>'));
  assert.throws(() => discoverAssets(html + '<script src="/assets/index-other.js"></script>'));
});
test('incomplete, duplicate and unsafe metadata fail closed', () => {
  for (const source of ['not a catalog', bundle + bundle, bundle.replace('cat:`Drag`', 'cat:`Unknown`'), bundle.replace('name:`Compare`,', ''), bundle.replace('name:`Compare`', 'name:`@everyone`')]) {
    assert.throws(() => extractCatalog(source));
  }
});
test('timestamps and asset filenames do not cause repeated updates', () => {
  const a = snapshot(), b = snapshot();
  b.capturedAt = '2026-10-06T00:00:00Z';
  b.assets.script.url = 'https://bencho.dev/assets/index-rename.js';
  const diff = compareSnapshots(a, b);
  assert.equal(diff.changed, false);
  assert.equal(diff.fingerprint, compareSnapshots(a, a).fingerprint);
});
test('additions, removals, metadata and runtime changes are detected separately', () => {
  const a = snapshot(), b = snapshot();
  b.catalog = [b.catalog[0], { id: 'new', name: 'New', category: 'Press', url: 'https://bencho.dev/blocks/new' }];
  b.catalog[0] = { ...b.catalog[0], name: 'Renamed' };
  b.assets.script.sha256 = 'new';
  const diff = compareSnapshots(a, b);
  assert.equal(diff.changed, true);
  assert.deepEqual(diff.added.map(i => i.id), ['new']);
  assert.deepEqual(diff.removed.map(i => i.id), ['like']);
  assert.deepEqual(diff.modified.map(i => i.id), ['compare']);
  assert.deepEqual(diff.assetsChanged, ['script']);
});
