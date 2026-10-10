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
vm.runInContext(readFileSync('archive/site-round4/keepers.js','utf8')+'\n'+readFileSync('archive/site-round4/round4.js','utf8')+'\nglobalThis.current=ALL_DESIGNS;globalThis.keepers=KEEPERS;globalThis.holidays=HOLIDAY_IDS;',round4);
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
const round5=vm.createContext({});
vm.runInContext(readFileSync('archive/site-round5/keepers.js','utf8')+'\n'+readFileSync('archive/site-round5/round5.js','utf8')+'\nglobalThis.current=ALL_DESIGNS;globalThis.keepers=KEEPERS;globalThis.holidays=HOLIDAY_IDS;',round5);
test('round 5 preserves all 36 selected records and adds 30 unique new designs',()=>{
  assert.equal(round5.current.length,66);
  assert.equal(new Set(round5.current.map(d=>d.id)).size,66);
  assert.equal(round5.keepers.length,36);
  assert.equal(round5.current.filter(d=>d.round===5).length,30);
  for(const keeper of round5.keepers){
    const previous=round4.current.find(d=>d.id===keeper.id);
    assert.ok(previous,keeper.id);
    assert.equal(JSON.stringify(keeper),JSON.stringify(previous),keeper.id+' unchanged');
  }
});
test('round 5 review preserves old storage IDs without republishing 24 rejected designs',()=>{
  const store=storage();
  const picks=new Set([...round5.keepers.map(d=>d.id),'explaining-fire-tee','future-design']);
  api.write(store,picks,round5.holidays);
  const loaded=api.read(store),decisions=api.decisions(round5.current,loaded);
  assert.equal(loaded.size,38);assert.equal(decisions.keep.length,36);assert.equal(decisions.replace.length,30);
  const brief=api.brief(round5.current,loaded,'They need to be funny.');
  assert.ok(brief.includes('KEEP (36)')&&brief.includes('REPLACE (30)'));
  assert.ok(!brief.includes('[explaining-fire-tee]'));
  const removed=round4.current.filter(d=>!round5.current.some(n=>n.id===d.id));
  assert.equal(removed.length,24);
  for(const d of removed)assert.equal(existsSync('site/'+d.image),false,d.id+' removed from public site');
});
const round6=vm.createContext({});
vm.runInContext(readFileSync('archive/site-round6/keepers.js','utf8')+'\n'+readFileSync('archive/site-round6/round6.js','utf8')+'\nglobalThis.current=ALL_DESIGNS;globalThis.keepers=KEEPERS;globalThis.holidays=HOLIDAY_IDS;',round6);
test('round 6 preserves all 40 selected records and adds 30 unique new designs',()=>{
  assert.equal(round6.current.length,70);
  assert.equal(new Set(round6.current.map(d=>d.id)).size,70);
  assert.equal(round6.keepers.length,40);
  assert.equal(round6.current.filter(d=>d.round===6).length,30);
  for(const keeper of round6.keepers){
    const previous=round5.current.find(d=>d.id===keeper.id);
    assert.ok(previous,keeper.id);
    assert.equal(JSON.stringify(keeper),JSON.stringify(previous),keeper.id+' unchanged');
  }
});
test('round 6 review preserves old storage IDs without republishing 26 rejected designs',()=>{
  const store=storage();
  const picks=new Set([...round6.keepers.map(d=>d.id),'cause-code-tee','future-design']);
  api.write(store,picks,round6.holidays);
  const loaded=api.read(store),decisions=api.decisions(round6.current,loaded);
  assert.equal(loaded.size,42);assert.equal(decisions.keep.length,40);assert.equal(decisions.replace.length,30);
  const brief=api.brief(round6.current,loaded,'Sharper satire and side quests.');
  assert.ok(brief.includes('KEEP (40)')&&brief.includes('REPLACE (30)'));
  assert.ok(!brief.includes('[cause-code-tee]'));
  const removed=round5.current.filter(d=>!round6.current.some(n=>n.id===d.id));
  assert.equal(removed.length,26);
  for(const d of removed)assert.equal(existsSync('site/'+d.image),false,d.id+' removed from public site');
});
const round7=vm.createContext({});
vm.runInContext(readFileSync('archive/site-round7/keepers.js','utf8')+'\n'+readFileSync('archive/site-round7/round7.js','utf8')+'\nglobalThis.current=ALL_DESIGNS;globalThis.keepers=KEEPERS;globalThis.holidays=HOLIDAY_IDS;',round7);
test('round 7 preserves all 56 selected records and adds 30 unique new designs',()=>{
  assert.equal(round7.current.length,86);
  assert.equal(new Set(round7.current.map(d=>d.id)).size,86);
  assert.equal(round7.keepers.length,56);
  assert.equal(round7.current.filter(d=>d.round===7).length,30);
  for(const keeper of round7.keepers){
    const previous=round6.current.find(d=>d.id===keeper.id);
    assert.ok(previous,keeper.id);
    assert.equal(JSON.stringify(keeper),JSON.stringify(previous),keeper.id+' unchanged');
  }
});
test('round 7 review preserves old storage IDs without republishing 14 rejected designs',()=>{
  const store=storage();
  const picks=new Set([...round7.keepers.map(d=>d.id),'deadline-tee','future-design']);
  api.write(store,picks,round7.holidays);
  const loaded=api.read(store),decisions=api.decisions(round7.current,loaded);
  assert.equal(loaded.size,58);assert.equal(decisions.keep.length,56);assert.equal(decisions.replace.length,30);
  const brief=api.brief(round7.current,loaded,'Specific situations and original visual jokes.');
  assert.ok(brief.includes('KEEP (56)')&&brief.includes('REPLACE (30)'));
  assert.ok(!brief.includes('[deadline-tee]'));
  const removed=round6.current.filter(d=>!round7.current.some(n=>n.id===d.id));
  assert.equal(removed.length,14);
  for(const d of removed)assert.equal(existsSync('site/'+d.image),false,d.id+' removed from public site');
});
const round8=vm.createContext({});
vm.runInContext(readFileSync('archive/site-round8/keepers.js','utf8')+'\n'+readFileSync('archive/site-round8/round8.js','utf8')+'\nglobalThis.current=ALL_DESIGNS;globalThis.keepers=KEEPERS;globalThis.holidays=HOLIDAY_IDS;',round8);
test('round 8 combines the 56 prior keepers and 15 phone selections without changing records',()=>{
  assert.equal(round8.current.length,101);
  assert.equal(new Set(round8.current.map(d=>d.id)).size,101);
  assert.equal(round8.keepers.length,71);
  assert.equal(round8.current.filter(d=>d.round===8).length,30);
  assert.ok(round7.keepers.every(d=>round8.keepers.some(k=>k.id===d.id)));
  assert.equal(round8.keepers.filter(d=>d.round===7).length,15);
  for(const keeper of round8.keepers){
    const previous=round7.current.find(d=>d.id===keeper.id);
    assert.ok(previous,keeper.id);
    assert.equal(JSON.stringify(keeper),JSON.stringify(previous),keeper.id+' unchanged');
  }
});
test('round 8 brief excludes the 15 unselected Round07 designs while storage remains compatible',()=>{
  const store=storage();
  const picks=new Set([...round8.keepers.map(d=>d.id),'rehearsed-crew','future-design']);
  api.write(store,picks,round8.holidays);
  const loaded=api.read(store),decisions=api.decisions(round8.current,loaded);
  assert.equal(loaded.size,73);assert.equal(decisions.keep.length,71);assert.equal(decisions.replace.length,30);
  const brief=api.brief(round8.current,loaded,'Another round of specific situations.');
  assert.ok(brief.includes('KEEP (71)')&&brief.includes('REPLACE (30)'));
  assert.ok(!brief.includes('[rehearsed-crew]'));
  const removed=round7.current.filter(d=>!round8.current.some(n=>n.id===d.id));
  assert.equal(removed.length,15);
  for(const d of removed)assert.equal(existsSync('site/'+d.image),false,d.id+' removed from public site');
});
const round9=vm.createContext({});
vm.runInContext(readFileSync('archive/site-round9/keepers.js','utf8')+'\n'+readFileSync('archive/site-round9/round9.js','utf8')+'\nglobalThis.current=ALL_DESIGNS;globalThis.keepers=KEEPERS;globalThis.holidays=HOLIDAY_IDS;globalThis.carryover=CARRYOVER_IDS;',round9);
const round8ApprovedIds=[
  'idea-emails-tee','aesthetic-tee','rhetorical-cap','global-fix-tee','polite-version-tee',
  'personal-project-hoodie','empathy-spreadsheet-hoodie','escalated-cap','footnotes-cap',
  'purpose-flexible-cap','not-this-minute-mug','free-time-tote','entire-plan-onesie'
];
test('round 9 preserves all 84 complete approved records including the exact 13 Round08 selections',()=>{
  assert.equal(round9.current.length,114);
  assert.equal(new Set(round9.current.map(d=>d.id)).size,114);
  assert.equal(round9.keepers.length,84);
  assert.ok(round8.keepers.every(d=>round9.keepers.some(k=>k.id===d.id)));
  assert.deepEqual([...round9.keepers.filter(d=>d.round===8).map(d=>d.id)].sort(),[...round8ApprovedIds].sort());
  assert.deepEqual([...round9.carryover].sort(),[...round9.keepers.map(d=>d.id)].sort());
  for(const keeper of round9.keepers){
    const previous=round8.current.find(d=>d.id===keeper.id);
    assert.ok(previous,keeper.id);
    assert.equal(JSON.stringify(keeper),JSON.stringify(previous),keeper.id+' unchanged');
  }
  const additions=round9.current.filter(d=>d.round===9);
  assert.equal(additions.length,30);
  assert.ok(additions.every(d=>d.category==='Onesies'&&d.type==='Adult lounge suit'&&!d.fan));
});
test('all 17 rejected Round08 designs remain archived and absent from the current gallery and brief',()=>{
  const removed=round8.current.filter(d=>!round9.current.some(n=>n.id===d.id));
  assert.equal(removed.length,17);
  const oldHearts=new Set([...removed.map(d=>d.id),...round8ApprovedIds]);
  const brief=api.brief(round9.current,oldHearts,'Adult onesies only.',round9.carryover);
  for(const d of removed){
    assert.equal(existsSync('site/'+d.image),false,d.id+' is not public');
    assert.equal(existsSync('archive/site-round8/'+d.image),true,d.id+' is recoverable');
    assert.ok(!brief.includes('['+d.id+']'),d.id+' cannot enter the brief from old hearts');
  }
  assert.ok(brief.includes('PREVIOUSLY APPROVED (84)'));
  assert.ok(brief.includes('KEEP (0)')&&brief.includes('REPLACE (30)'));
});
test('the Round09 sparse phone snapshot cannot replace prior approvals or seed missing local hearts',()=>{
  const phoneIds=[...round8.keepers.filter(d=>d.round===7).map(d=>d.id),...round8ApprovedIds];
  assert.equal(phoneIds.length,28);
  const picks=new Set(phoneIds),store=storage();
  api.write(store,picks,round9.holidays);
  const loaded=api.read(store);
  const choices=api.decisions(round9.current,loaded,round9.carryover);
  assert.equal(choices.approved.length,84);
  assert.equal(choices.keep.length,0);
  assert.equal(choices.replace.length,30);
  assert.ok(choices.replace.every(d=>d.round===9));
  const brief=api.brief(round9.current,loaded,'Onesies Round 01.',round9.carryover);
  assert.ok(brief.includes('PREVIOUSLY APPROVED (84)'));
  assert.ok(brief.includes('KEEP (0)')&&brief.includes('REPLACE (30)'));
  assert.equal(api.read(store).size,28);
});
const round10=vm.createContext({});
vm.runInContext(readFileSync('site/keepers.js','utf8')+'\n'+readFileSync('site/round10.js','utf8')+'\nglobalThis.current=ALL_DESIGNS;globalThis.keepers=KEEPERS;globalThis.holidays=HOLIDAY_IDS;globalThis.carryover=CARRYOVER_IDS;',round10);
test('round 10 preserves all 84 prior approvals and only the selected trousers onesie from Round09',()=>{
  assert.equal(round10.current.length,114);
  assert.equal(new Set(round10.current.map(d=>d.id)).size,114);
  assert.equal(round10.keepers.length,85);
  const expected=[...round9.keepers.map(d=>d.id),'avoid-trousers-onesie'].sort();
  assert.deepEqual([...round10.keepers.map(d=>d.id)].sort(),expected);
  assert.deepEqual([...round10.carryover].sort(),expected);
  assert.deepEqual([...round10.keepers.filter(d=>d.round===9).map(d=>d.id)],['avoid-trousers-onesie']);
  for(const keeper of round10.keepers){
    const previous=round9.current.find(d=>d.id===keeper.id);
    assert.ok(previous,keeper.id);
    assert.equal(JSON.stringify(keeper),JSON.stringify(previous),keeper.id+' unchanged');
  }
  const additions=round10.current.filter(d=>d.round===10);
  assert.equal(additions.length,29);
  assert.ok(additions.every(d=>d.category==='Onesies'&&d.type==='Adult lounge suit'&&!d.fan));
});
test('all 29 rejected Round09 onesies are archived and cannot return through an old saved snapshot',()=>{
  const removed=round9.current.filter(d=>!round10.current.some(n=>n.id===d.id));
  assert.equal(removed.length,29);
  assert.ok(removed.every(d=>d.round===9));
  const oldHearts=new Set([...removed.map(d=>d.id),'avoid-trousers-onesie']);
  const brief=api.brief(round10.current,oldHearts,'Onesies Round 02.',round10.carryover);
  for(const d of removed){
    assert.equal(existsSync('site/'+d.image),false,d.id+' is not public');
    assert.equal(existsSync('archive/site-round9/'+d.image),true,d.id+' is recoverable');
    assert.ok(!brief.includes('['+d.id+']'),d.id+' cannot enter the current brief');
  }
  assert.ok(brief.includes('PREVIOUSLY APPROVED (85)'));
  assert.ok(brief.includes('[avoid-trousers-onesie]'));
  assert.ok(brief.includes('KEEP (0)')&&brief.includes('REPLACE (29)'));
});
test('current category counts and all 163 retired design IDs match the full catalog history',()=>{
  const categories={};
  for(const d of round10.current)categories[d.category]=(categories[d.category]||0)+1;
  assert.deepEqual(categories,{Onesies:33,Tees:26,Hats:14,Sweats:13,Accessories:7,Holiday:17,'Fan lab':4});
  assert.equal(round10.current.filter(d=>d.fan).length,9);
  const currentIds=new Set(round10.current.map(d=>d.id));
  const history=[context.all,round4.current,round5.current,round6.current,round7.current,round8.current,round9.current];
  const retired=new Map(history.flatMap(rows=>[...rows]).filter(d=>!currentIds.has(d.id)).map(d=>[d.id,d]));
  assert.equal(retired.size,163);
  for(const d of retired.values())assert.equal(existsSync('site/'+d.image),false,d.id+' stays retired');
});
test('current page loads Round10 and historical catalog scripts are not published',()=>{
  for(const f of ['catalog.js','collection.js','round3.js','round4.js','round5.js','round6.js','round7.js','round8.js','round9.js','app.js'])assert.equal(existsSync('site/'+f),false,f);
  const page=readFileSync('site/index.html','utf8');
  assert.ok(page.includes('keepers.js?v=10')&&page.includes('round10.js?v=10'));
  assert.ok(!page.includes('data-filter="Archive"'));
});
test('all 114 current design images exist',()=>{
  assert.equal(round10.current.length,114);
  const missing=[...round10.current.filter(d=>!existsSync('site/'+d.image)).map(d=>d.image)];
  assert.deepEqual(missing,[],'Missing current design renders');
});
