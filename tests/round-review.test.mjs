import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const stateSource = readFileSync(new URL('../site/review-state.js', import.meta.url), 'utf8');
const brandSource = readFileSync(new URL('../site/brand.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(stateSource, context);
const api = context.PromptReview;

// Synthetic catalog isolates review semantics from future catalog replacements.
const approvedIds = Array.from({length: 85}, (_, i) => `approved-${i + 1}`);
const newIds = Array.from({length: 29}, (_, i) => `new-${i + 1}`);
const designs = [...approvedIds, ...newIds].map(id => ({
  id, name: id, phrase: `Design ${id}`, description: '', tags: '',
  type: 'Adult lounge suit', category: 'Onesies', image: 'fixture.webp', alt: id,
  round: approvedIds.includes(id) ? 9 : 10
}));
// The phone has 15 Round07, 13 Round08 and the trousers approval, missing the earlier 56.
const phoneIds = approvedIds.slice(56);
const sorted = values => [...values].sort();

test('a sparse phone brief preserves all 85 approvals and scopes KEEP/REPLACE to 29 new designs', () => {
  assert.equal(phoneIds.length, 29);
  const hearts = new Set(phoneIds);
  const result = api.decisions(designs, hearts, approvedIds);
  assert.equal(result.approved.length, 85);
  assert.equal(result.keep.length, 0);
  assert.deepEqual(sorted(result.replace.map(d => d.id)), sorted(newIds));
  const brief = api.brief(designs, hearts, 'Adult onesies only.', approvedIds);
  const previous = brief.split('PREVIOUSLY APPROVED (85)')[1].split('\n\nKEEP (0)')[0];
  const replace = brief.split('\n\nREPLACE (29)')[1];
  for (const id of approvedIds) {
    assert.ok(previous.includes(`[${id}]`));
    assert.ok(!replace.includes(`[${id}]`));
  }
  assert.ok(brief.includes('Missing hearts on this device do not revoke earlier approvals.'));
  assert.ok(brief.includes('Adult onesies only.'));
  assert.deepEqual([...hearts], phoneIds, 'generating a brief cannot seed personal hearts');
});

test('new selections form disjoint review groups while unknown saved IDs stay out of the brief', () => {
  const hearts = new Set([...phoneIds, newIds[0], newIds[1], 'retired-fixture']);
  const result = api.decisions(designs, hearts, [...approvedIds, 'missing-approval']);
  assert.equal(result.approved.length, 85);
  assert.deepEqual(result.keep.map(d => d.id), newIds.slice(0, 2));
  assert.equal(result.replace.length, 27);
  assert.equal(new Set([...result.approved, ...result.keep, ...result.replace].map(d => d.id)).size, 114);
  const brief = api.brief(designs, hearts, '', approvedIds);
  const currentReview = brief.split('\n\nKEEP (2)')[1];
  assert.ok(currentReview.includes(`[${newIds[0]}]`));
  assert.ok(!currentReview.includes(`[${approvedIds[0]}]`));
  assert.ok(!brief.includes('[retired-fixture]'));
  assert.ok(!brief.includes('[missing-approval]'));
});

test('the legacy holiday brief keeps its original groups when carryover IDs are omitted', () => {
  const legacy = designs.slice(0, 2);
  const hearts = new Set([legacy[0].id]);
  const brief = api.brief(legacy, hearts, 'Keep this direction.');
  assert.ok(!brief.includes('PREVIOUSLY APPROVED'));
  assert.ok(brief.includes('KEEP (1)'));
  assert.ok(brief.includes('REPLACE (1)'));
  assert.ok(brief.includes('Keep the saved designs exactly as they are.'));
  assert.ok(brief.includes('Keep this direction.'));
  assert.equal(api.decisions(legacy, hearts).keep.length, 1);
  assert.equal(api.decisions(legacy, hearts).replace.length, 1);
});

function browser(heartIds = []) {
  const nodes = new Map();
  let writes = 0;
  let downloaded;
  function makeNode() {
    return {
      value: '', hidden: false, disabled: false, open: false, dataset: {}, listeners: {},
      classList: {add() {}, remove() {}},
      addEventListener(type, callback) { this.listeners[type] = callback; },
      setAttribute() {}, replaceChildren() {}, append() {}, scrollIntoView() {},
      focus() {}, select() {}, click() {}, showModal() {}, close() {}
    };
  }
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, makeNode());
    return nodes.get(selector);
  };
  const data = new Map([['prompt-dept-favorites-v1', JSON.stringify(heartIds)]]);
  const localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem(key, value) { writes++; data.set(key, value); }
  };
  const sandbox = vm.createContext({
    ALL_DESIGNS: designs, ACTIVE_DESIGNS: designs, CARRYOVER_IDS: approvedIds, HOLIDAY_IDS: [],
    localStorage, Blob,
    URL: class extends URL {
      static createObjectURL(blob) { downloaded = blob; return 'blob:test-download'; }
      static revokeObjectURL() {}
    },
    document: {
      querySelector: node, querySelectorAll: () => [], createElement: makeNode,
      addEventListener() {}, body: makeNode(), activeElement: null
    },
    window: {addEventListener() {}},
    location: {href: 'https://example.invalid/', hash: ''},
    history: {replaceState() {}}, navigator: {clipboard: {writeText: async () => {}}},
    setTimeout() { return 0; }, clearTimeout() {}
  });
  vm.runInContext(stateSource, sandbox);
  vm.runInContext(brandSource, sandbox);
  return {sandbox, node, data, writes: () => writes, download: () => downloaded};
}

test('an empty browser shows prior approval without adding hearts or enabling their transfer', () => {
  const page = browser();
  assert.equal(page.node('#save-count').textContent, 0);
  assert.equal(page.node('#keep-total').textContent, 0);
  assert.equal(page.node('#replace-total').textContent, 29);
  assert.equal(page.node('#copy-picks-link').disabled, true);
  assert.equal(page.node('#review-summary').textContent, '85 approved earlier. 0 new picks on this device. 29 new ideas still to review.');
  assert.equal(vm.runInContext('favorites.size', page.sandbox), 0);
  assert.equal(page.writes(), 0);
});

test('saved filters stay personal and removing an old heart cannot revoke its approval', () => {
  const page = browser(phoneIds);
  vm.runInContext("setFilter('Saved')", page.sandbox);
  assert.deepEqual(sorted(vm.runInContext('visible().map(d => d.id)', page.sandbox)), sorted(phoneIds));
  assert.equal(page.node('#save-count').textContent, 29);
  assert.equal(page.node('#keep-total').textContent, 29);
  vm.runInContext("setFilter('Replace')", page.sandbox);
  assert.deepEqual(sorted(vm.runInContext('visible().map(d => d.id)', page.sandbox)), sorted(newIds));
  page.sandbox.removedId = phoneIds[0];
  vm.runInContext('toggleSaved(removedId)', page.sandbox);
  assert.equal(page.node('#save-count').textContent, 28);
  assert.equal(page.node('#replace-total').textContent, 29);
  assert.ok(page.node('#decision-brief').value.includes('PREVIOUSLY APPROVED (85)'));
  assert.equal(page.node('#toast').textContent, 'Removed from saved picks on this device');
});

test('downloaded JSON separates prior approvals from this rounds KEEP/REPLACE groups', async () => {
  const page = browser([...phoneIds, newIds[0], newIds[1]]);
  page.node('#download-decisions').listeners.click();
  const exported = JSON.parse(await page.download().text());
  assert.equal(exported.schemaVersion, 2);
  assert.equal(exported.previouslyApproved.length, 85);
  assert.deepEqual(exported.keep.map(d => d.id), newIds.slice(0, 2));
  assert.equal(exported.replace.length, 27);
  assert.ok(exported.replace.every(d => !approvedIds.includes(d.id)));
  assert.equal(page.node('#keep-total').textContent, 31, 'saved count includes local older hearts');
  assert.equal(page.node('#replace-total').textContent, 27);
  assert.equal(page.writes(), 0, 'exporting does not change storage');
});
