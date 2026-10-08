import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});
vm.runInContext(readFileSync('site/review-state.js','utf8'),context);
vm.runInContext(readFileSync('site/catalog.js','utf8')+'\n'+readFileSync('site/collection.js','utf8')+'\nglobalThis.designs=[...CATALOG,...COLLECTION];',context);
const api=context.PromptReview, designs=context.designs;
function storage(entries={}) { const data=new Map(Object.entries(entries));return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}; }
test('existing holiday and Prompt Dept hearts survive consolidation and writes',()=>{
  const store=storage({'prompt-dept-favorites-v1':'["approved-plan","future-design"]','holiday-build-club-favorites-v1':'["claude-claus"]'});
  const picks=api.read(store);
  picks.add('onesie-reset');api.write(store,picks,['claude-claus']);
  assert.deepEqual([...api.read(store)].sort(),['approved-plan','claude-claus','future-design','onesie-reset']);
  assert.equal(store.data.get('holiday-build-club-favorites-v1'),'["claude-claus"]');
});
test('a malformed list cannot discard the other valid collection',()=>{
  const store=storage({'prompt-dept-favorites-v1':'not-json','holiday-build-club-favorites-v1':'["claude-claus",null,42]'});
  assert.deepEqual([...api.read(store)],['claude-claus']);
});
test('every known design belongs to exactly one decision group',()=>{
  assert.equal(designs.length,38);assert.equal(new Set(designs.map(d=>d.id)).size,38);
  const picks=new Set(['approved-plan','claude-claus','future-design']);
  const result=api.decisions(designs,picks);
  assert.equal(result.keep.length,2);assert.equal(result.replace.length,36);
  assert.ok(result.replace.every(d=>!picks.has(d.id)));
  assert.equal(new Set([...result.keep,...result.replace].map(d=>d.id)).size,38);
});
test('brief carries exact keeper IDs, replacement IDs and direction',()=>{
  const brief=api.brief(designs,new Set(['approved-plan','claude-claus']),'More graphics. Less text.');
  const [keep,replace]=brief.split('REPLACE (36)');
  assert.ok(keep.includes('[approved-plan]'));assert.ok(keep.includes('[claude-claus]'));
  assert.ok(!replace.includes('[approved-plan]'));assert.ok(!replace.includes('[claude-claus]'));
  assert.ok(replace.includes('[onesie-reset]'));assert.ok(replace.includes('More graphics. Less text.'));
  assert.ok(brief.includes('adult-only onesies'));
});
test('blocked storage reads degrade safely and failed writes report failure',()=>{
  const store={getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}};
  assert.equal(api.read(store).size,0);assert.deepEqual([...api.read(store,new Set(['approved-plan']))],['approved-plan']);assert.throws(()=>api.write(store,new Set(['approved-plan']),[]));
});
