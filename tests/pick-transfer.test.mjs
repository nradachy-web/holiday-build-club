import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../site/review-state.js', import.meta.url), 'utf8'), context);
const api = context.PromptReview;

function loadCatalog(directory, filename) {
  const catalogContext = vm.createContext({});
  const keepers = readFileSync(new URL(`../${directory}/keepers.js`, import.meta.url), 'utf8');
  const round = readFileSync(new URL(`../${directory}/${filename}`, import.meta.url), 'utf8');
  vm.runInContext(keepers + '\n' + round + '\n' +
    'globalThis.snapshot={designs:ALL_DESIGNS,approved:KEEPERS,holidayIds:HOLIDAY_IDS,carryoverIds:CARRYOVER_IDS};', catalogContext);
  return catalogContext.snapshot;
}
const historical = loadCatalog('archive/site-round8', 'round8.js');
const currentCatalog = loadCatalog('site', 'round9.js');

// Exact public selections reproduce the earlier 56+15 incident against archived Round08.
const mac56 = [
  'laundry-app-tee', 'own-rules-tee', 'insubordinate-cap', 'timer-login-tee',
  'perceive-repo-tee', 'reminder-tone-crew', 'startup-avoidance-tee', 'domain-instead-tee',
  'not-started-tee', 'dashboard-tee', 'please-no-call-hoodie', 'cold-case-hoodie',
  'specific-cap', 'silent-finally-knit', 'inconvenience-mug', 'cancelled-onesie',
  'screenshot-tee', 'monthly-skill-tee', 'spinner-cofounder-hoodie', 'read-none-cap',
  'plan-b-tee', 'senior-repeater-tee', 'new-confidence-hoodie', 'looks-right-cap',
  'twelve-retries-knit', 'green-build-knit', 'yes-and-cap', 'off-duty-onesie',
  'one-more-tee', 'parallel-play-hoodie', 'human-loop-hoodie', 'context-cap',
  'ho-hold-knit', 'tokens-reindeer-knit', 'snowman-new-chat', 'build-red-knit',
  'waiting-socks', 'stay-context-deskmat', 'hat-after-reset', 'santa-rate-limited',
  'hat-out-of-tokens', 'deskmat-context', 'naughty-compaction', 'context-christmas',
  'socks-offline', 'clawd-timeout', 'gpt-please', 'clawd-christmas',
  'codex-reset', 'codex-midnight', 'claude-tokens', 'vibe-snow',
  'claude-alpine', 'codex-argyle', 'santa-debug', 'pair-programming'
];
const phone15 = [
  'password-rebuild-tee', 'mental-reply-tee', 'anytime-tee', 'stay-there-tee',
  'praise-defects-tee', 'tone-audit-tee', 'small-suggestion-tee', 'where-file-tee',
  'live-here-tee', 'documentation-shield-hoodie', 'relaxation-bugs-hoodie',
  'personal-use-hoodie', 'piles-hoodie', 'intense-cap', 'theory-cap'
];
const otherHeart = 'aesthetic-tee';
const holidayIds = new Set(historical.holidayIds);
const catalog = historical.designs;
const sorted = values => [...values].sort();

function storage(ids = []) {
  const data = new Map([
    [api.keys[0], JSON.stringify(ids.filter(id => !holidayIds.has(id)))],
    [api.keys[1], JSON.stringify(ids.filter(id => holidayIds.has(id)))]
  ]);
  return {
    data, writes: 0, failWrites: false,
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) {
      this.writes++;
      if (this.failWrites) throw new Error('QuotaExceededError');
      data.set(key, value);
    }
  };
}

test('71 real keeper IDs round-trip without exporting retired selections', () => {
  assert.equal(mac56.length, 56);
  assert.equal(phone15.length, 15);
  const all = new Set([...mac56, ...phone15]);
  assert.equal(all.size, 71);
  assert.deepEqual(sorted(historical.approved.map(d => d.id)), sorted(all));
  const hash = api.transferHash(catalog, new Set([...all, 'deadline-tee']));
  const decoded = api.readTransfer('#' + hash, catalog);
  assert.equal(decoded.invalid, false);
  assert.equal(decoded.unavailable, 0);
  assert.deepEqual(sorted(decoded.ids), sorted(all));
  assert.ok(!hash.includes('deadline-tee'));
});

test('ordinary fragments are ignored and an empty transfer has no importable IDs', () => {
  assert.equal(api.readTransfer('#collection', catalog), null);
  assert.equal(api.readTransfer('', catalog), null);
  const empty = api.readTransfer('#picks=', catalog);
  assert.equal(empty.invalid, false);
  assert.equal(empty.ids.length, 0);
});

test('malformed, injected and oversized fragments fail closed without partial IDs', () => {
  const hashes = [
    '#picks=' + phone15[0] + ',%',
    '#picks=%E0%A4%A',
    '#picks=%3Cscript%3E',
    '#picks=' + phone15[0] + '%2C' + phone15[1],
    '#picks=' + phone15[0] + '&extra=value',
    '#picks=' + 'a'.repeat(101),
    '#picks=' + 'a'.repeat(40001),
    '#picks=' + Array.from({length: 1001}, (_, i) => 'test-' + i).join(',')
  ];
  for (const hash of hashes) {
    const result = api.readTransfer(hash, catalog);
    assert.equal(result.invalid, true, hash.slice(0, 90));
    assert.equal(result.ids.length, 0);
  }
});

test('unknown and retired IDs are counted, never imported, and duplicates count once', () => {
  const result = api.readTransfer(
    '#picks=' + [phone15[0], 'deadline-tee', phone15[0], 'future-unknown-design', 'deadline-tee'].join(','),
    catalog
  );
  assert.equal(result.invalid, false);
  assert.deepEqual([...result.ids], [phone15[0]]);
  assert.equal(result.unavailable, 2);
});

test('an older 15-pick snapshot adds to 56 Mac picks without writes or erasure', () => {
  const store = storage(mac56);
  const beforeStorage = [...store.data];
  // Simulate an open tab that predates the stored Mac selections.
  const current = new Set([mac56[0]]);
  const parsed = api.readTransfer('#' + api.transferHash(catalog, new Set(phone15)), catalog);
  const merged = api.mergeTransfer(store, current, parsed.ids);
  assert.equal(merged.size, 71);
  assert.deepEqual(sorted(merged), sorted([...mac56, ...phone15]));
  assert.deepEqual([...current], [mac56[0]], 'the caller owns the current state until it commits');
  assert.equal(store.writes, 0, 'parsing and merging must not persist before an explicit import');
  assert.deepEqual([...store.data], beforeStorage);
  assert.deepEqual(sorted(api.mergeTransfer(store, merged, parsed.ids)), sorted(merged));
});

test('reimporting the old phone snapshot preserves an unrelated newer heart', () => {
  const existing = [...mac56, ...phone15, otherHeart];
  const store = storage(existing);
  const result = api.mergeTransfer(store, new Set(existing), phone15);
  assert.equal(result.size, 72);
  assert.deepEqual(sorted(result), sorted(existing));
  assert.equal(store.writes, 0);
});

test('quota recovery keeps the visible visit-only heart when importing phone picks', () => {
  const store = storage(mac56);
  const current = api.read(store);
  current.add(otherHeart);
  store.failWrites = true;
  assert.throws(() => api.write(store, current, holidayIds), /QuotaExceededError/);
  assert.equal(api.read(store).has(otherHeart), false, 'reads still work but lack the failed write');
  store.failWrites = false;
  const writesBeforeMerge = store.writes;
  const merged = api.mergeTransfer(store, current, phone15);
  assert.equal(merged.size, 72);
  assert.ok(merged.has(otherHeart));
  assert.equal(store.writes, writesBeforeMerge);
  api.write(store, merged, holidayIds);
  assert.deepEqual(sorted(api.read(store)), sorted([...mac56, ...phone15, otherHeart]));
});

test('blocked storage reads preserve visible picks and incoming picks without attempting writes', () => {
  let writes = 0;
  const blocked = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { writes++; throw new Error('SecurityError'); }
  };
  const result = api.mergeTransfer(blocked, new Set([...mac56, otherHeart]), phone15);
  assert.equal(result.size, 72);
  assert.deepEqual(sorted(result), sorted([...mac56, ...phone15, otherHeart]));
  assert.equal(writes, 0);
});

test('the current 28-pick phone snapshot merges with the old 56 to preserve all 84 approvals', () => {
  const phone28 = [...phone15, ...currentCatalog.approved.filter(d => d.round === 8).map(d => d.id)];
  assert.equal(phone28.length, 28);
  const decoded = api.readTransfer('#' + api.transferHash(catalog, new Set(phone28)), currentCatalog.designs);
  assert.equal(decoded.invalid, false);
  assert.equal(decoded.unavailable, 0);
  const store = storage(mac56);
  const merged = api.mergeTransfer(store, new Set(mac56), decoded.ids);
  assert.equal(merged.size, 84);
  assert.deepEqual(sorted(merged), sorted(currentCatalog.approved.map(d => d.id)));
  assert.equal(store.writes, 0);
  const freshDevice = api.mergeTransfer(storage(), new Set(), decoded.ids);
  assert.equal(freshDevice.size, 28, 'a transfer imports personal picks, not missing collection approvals');
  const review = api.decisions(currentCatalog.designs, freshDevice, currentCatalog.carryoverIds);
  assert.equal(review.approved.length, 84);
  assert.equal(review.keep.length, 0);
  assert.equal(review.replace.length, 30);
});

test('an older phone snapshot preserves a newer Round09 heart and ignores 17 retired Round08 IDs', () => {
  const currentIds = new Set(currentCatalog.designs.map(d => d.id));
  const retired = catalog.filter(d => !currentIds.has(d.id));
  assert.equal(retired.length, 17);
  const phone28 = [...phone15, ...currentCatalog.approved.filter(d => d.round === 8).map(d => d.id)];
  const oldLink = api.transferHash(catalog, new Set([...phone28, ...retired.map(d => d.id)]));
  const decoded = api.readTransfer('#' + oldLink, currentCatalog.designs);
  assert.equal(decoded.unavailable, 17);
  assert.deepEqual(sorted(decoded.ids), sorted(phone28));
  const newest = currentCatalog.designs.find(d => d.round === 9).id;
  const alreadySaved = new Set([...currentCatalog.approved.map(d => d.id), newest]);
  const store = storage([...alreadySaved]);
  const merged = api.mergeTransfer(store, alreadySaved, decoded.ids);
  assert.deepEqual(sorted(merged), sorted(alreadySaved));
  assert.equal(merged.size, 85);
  const review = api.decisions(currentCatalog.designs, merged, currentCatalog.carryoverIds);
  assert.equal(review.approved.length, 84);
  assert.deepEqual([...review.keep.map(d => d.id)], [newest]);
  assert.equal(review.replace.length, 29);
  assert.equal(store.writes, 0);
});
