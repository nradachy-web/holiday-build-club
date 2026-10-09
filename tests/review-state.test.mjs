import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});
vm.runInContext(readFileSync('site/review-state.js','utf8'),context);
vm.runInContext(readFileSync('archive/site-round3/catalog.js','utf8')+'\n'+readFileSync('archive/site-round3/collection.js','utf8')+'\nglobalThis.designs=[...CATALOG,...COLLECTION];',context);
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

test('round 3 preserves old favorite IDs while retiring unselected concepts',()=>{
  vm.runInContext(readFileSync('archive/site-round3/round3.js','utf8')+'\nglobalThis.current=ACTIVE_DESIGNS; globalThis.all=ALL_DESIGNS; globalThis.carryover=CARRYOVER_IDS;',context);
  assert.equal(context.current.length,48);
  assert.equal(context.all.length,68);
  assert.equal(new Set(context.all.map(d=>d.id)).size,68);
  assert.equal(context.current.filter(d=>d.round===3).length,30);
  const store=storage({'prompt-dept-favorites-v1':JSON.stringify(context.carryover),'holiday-build-club-favorites-v1':'["approved-plan","claude-claus"]'});
  const picks=api.read(store);
  assert.equal(api.decisions(context.current,picks).keep.length,18);
  assert.equal(api.decisions(context.current,picks).replace.length,30);
  const review=context.all.filter(d=>!d.retired||picks.has(d.id));
  assert.equal(api.decisions(review,picks).keep.length,20);
  assert.ok(!api.decisions(review,picks).replace.some(d=>d.id==='change-button'));
  picks.add('debug-duck-tee');api.write(store,picks,['claude-claus']);
  assert.equal(api.read(store).size,21);
  assert.ok(api.read(store).has('approved-plan'));
  for(const d of context.current.filter(d=>d.round!==3)) {
    const original=designs.find(x=>x.id===d.id);
    assert.equal(d.name,original.name);assert.equal(d.phrase,original.phrase);
    assert.equal(d.description,original.description);
  }
});

const round4=vm.createContext({});
vm.runInContext(readFileSync('site/keepers.js','utf8')+'\n'+readFileSync('site/round4.js','utf8')+'\nglobalThis.current=ALL_DESIGNS;globalThis.keepers=KEEPERS;globalThis.holidays=HOLIDAY_IDS;',round4);
test('round 4 preserves exactly 30 keeper objects and introduces 30 unique designs',()=>{
  assert.equal(round4.current.length,60);
  assert.equal(new Set(round4.current.map(d=>d.id)).size,60);
  assert.equal(round4.keepers.length,30);
  assert.equal(round4.current.filter(d=>d.round===4).length,30);
  for(const keeper of round4.keepers){
    const previous=context.all.find(d=>d.id===keeper.id);
    for(const key of ['id','name','phrase','description','image'])assert.equal(keeper[key],previous[key],keeper.id+' '+key);
  }
});
test('retired designs cannot reappear in gallery or brief while their storage IDs survive',()=>{
  const picks=new Set([...round4.keepers.map(d=>d.id),'who-dis-tee','future-design']);
  const store=storage();api.write(store,picks,round4.holidays);
  const loaded=api.read(store), decisions=api.decisions(round4.current,loaded);
  assert.equal(loaded.size,32);
  assert.equal(decisions.keep.length,30);assert.equal(decisions.replace.length,30);
  const brief=api.brief(round4.current,loaded,'More relatable satire.');
  assert.ok(brief.includes('KEEP (30)')&&brief.includes('REPLACE (30)'));
  assert.ok(!brief.includes('[who-dis-tee]'));
  const removed=context.all.filter(d=>!round4.current.some(n=>n.id===d.id));
  assert.equal(removed.length,38);
  for(const d of removed)assert.equal(existsSync('site/'+d.image),false,d.id+' is not published');
});
test('every current design image is present and old catalog scripts are not published',()=>{
  for(const d of round4.current)assert.ok(existsSync('site/'+d.image),d.image);
  for(const f of ['catalog.js','collection.js','round3.js','app.js'])assert.equal(existsSync('site/'+f),false,f);
  const page=readFileSync('site/index.html','utf8');
  assert.ok(page.includes('keepers.js?v=4')&&page.includes('round4.js?v=4'));
  assert.ok(!page.includes('data-filter="Archive"'));
});
