'use strict';
const $ = s => document.querySelector(s);
let favorites = new Set();
try { favorites = PromptReview.read(localStorage, favorites); } catch {}
let filter = 'New';
let current = null;
let lastFocus = null;
let toastTimer;
const dialog = $('#product-dialog');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}
function visible() {
  const term = $('#search').value.trim().toLowerCase();
  const pool = filter === 'Saved' ? ALL_DESIGNS.filter(d => favorites.has(d.id)) : ACTIVE_DESIGNS;
  return pool.filter(d => (['All','Saved'].includes(filter) || (filter === 'New' ? d.round === 5 : filter === 'Carryover' ? CARRYOVER_IDS.includes(d.id) : filter === 'Replace' ? !favorites.has(d.id) : filter === 'Fan lab' ? d.fan : d.category === filter)) && (!term || [d.name,d.phrase,d.description,d.tags].join(' ').toLowerCase().includes(term)));
}
function render() {
  const list = visible();
  $('#products').innerHTML = list.map(d => `<article class="card ${favorites.has(d.id)?'is-keeper':'needs-idea'}"><button class="card-save" data-save="${d.id}" aria-label="${favorites.has(d.id)?'Unsave':'Save'} ${esc(d.name)}" aria-pressed="${favorites.has(d.id)}">${favorites.has(d.id)?'♥':'♡'}</button><button class="card-image" data-open="${d.id}" aria-label="Explore ${esc(d.name)}"><img src="${d.image}" alt="${esc(d.alt)}" width="1122" height="1402" loading="lazy" decoding="async"><span class="decision-tag">${favorites.has(d.id)?'♥ Keeper':d.round===5?'New idea':'Carried forward'}</span>${d.fan?'<span class="fan-tag">Fan concept / Rights pending</span>':''}</button><div class="card-meta"><div><p class="category">${esc(d.type)} / ${d.fan?'Fan lab':d.method||'Concept'}</p><button class="card-title" data-open="${d.id}">${esc(d.name)}</button></div><span class="serial">${String(ALL_DESIGNS.indexOf(d)+1).padStart(2,'0')}</span></div></article>`).join('');
  $('#empty-state').hidden = list.length > 0;
  $('#result-count').textContent = `${list.length} ${list.length === 1 ? 'design' : 'designs'}${filter==='Saved'?' to keep':filter==='Replace'?' to replace':''}`;
  updateSaved();
}
function updateSaved() {
  const selected = ALL_DESIGNS.filter(d => favorites.has(d.id));
  $('#save-count').textContent = selected.length;
  $('#shortlist-items').innerHTML = selected.length ? selected.map(d => `<div class="shortlist-item"><img src="${d.image}" alt="" width="42" height="52"><span>${esc(d.name)}</span><button data-save="${d.id}" aria-label="Remove ${esc(d.name)} from shortlist">×</button></div>`).join('') : '<p>Heart the designs you want to keep.</p>';
  if (current) $('#dialog-save').textContent = favorites.has(current.id) ? 'Keeping this design ♥' : 'Keep this design ♡';
  updateReview();
  updateMail();
}
function updateMail() {
  const selected = ALL_DESIGNS.filter(d => favorites.has(d.id));
  const size = $('#preferred-size').value;
  const note = $('#shortlist-note').value.trim();
  const body = ['Hi Nick,','','My Prompt Dept. shortlist:',...selected.map(d => '- '+d.name+' ('+d.type+')'),...(!selected.length?['I am interested in the collection.']:[]),'',...(size?['Preferred clothing size: '+size,'']:[]),...(note?['My feedback: '+note,'']:[]),'This is feedback, not an order.','','May you email me once if these designs become available? [Please edit to yes or no.]','','Thanks!'].join('\n');
  $('#email-shortlist').href = 'mailto:nick@modernapexstrategies.com?subject='+encodeURIComponent('Prompt Dept.: my shortlist')+'&body='+encodeURIComponent(body);
}
function toggleSaved(id) {
  if (!ALL_DESIGNS.some(d => d.id === id)) return;
  const focusId = document.activeElement?.dataset?.save;
  try { favorites = PromptReview.read(localStorage, favorites); } catch {}
  const had = favorites.has(id);
  had ? favorites.delete(id) : favorites.add(id);
  let persisted = true;
  try { PromptReview.write(localStorage, favorites, HOLIDAY_IDS); } catch { persisted = false; }
  render();
  if (focusId) (document.querySelector(`[data-save="${focusId}"]`) || document.querySelector('.decision-filters button[aria-pressed="true"]') || $('#search')).focus({preventScroll:true});
  notify(!persisted ? 'Choice kept for this visit only. Copy your design brief before leaving.' : had ? 'Not kept for the next round' : 'Keeper saved on this device');
}
function setFilter(value) {
  filter = value;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed',b.dataset.filter===value));
  render();
}
function openDesign(id, updateUrl = true) {
  const d = ALL_DESIGNS.find(x => x.id === id);
  if (!d) return;
  current = d;
  lastFocus = document.activeElement;
  $('#dialog-title').textContent = d.name;
  $('#dialog-category').textContent = d.type+' / '+d.capsule;
  $('#dialog-description').textContent = d.description;
  $('#dialog-image').src = d.image;
  $('#dialog-image').alt = d.alt;
  $('#dialog-method').textContent = d.method ? `Design method: ${d.method}. Sample not yet approved.` : '';
  $('#dialog-note').textContent = d.native ? 'Native Blender construction study. Materials, dimensions, suppliers and production cost remain unconfirmed. Not available to order.' : d.fan ? 'Independent fan concept using third-party marks. Not affiliated with Anthropic or OpenAI. Permission is required before commercial release. Not available to order.' : 'AI-generated product concept. Materials, decoration, sizing and pricing are subject to physical sampling. Not available to order.';
  updateSaved();
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
  $('#close-dialog').focus();
  if (updateUrl) { const url=new URL(location.href); url.searchParams.set('design',id); history.replaceState(null,'',url); }
}
function closeDesign() {
  if (dialog.open) dialog.close();
  document.body.classList.remove('modal-open');
  const url = new URL(location.href);
  url.searchParams.delete('design');
  history.replaceState(null,'',url);
  const focusTarget=lastFocus?.isConnected?lastFocus:current?document.querySelector(`[data-open="${current.id}"]`):null;
  focusTarget?.focus({preventScroll:true});
  current = null;
}
document.addEventListener('click',event => {
  const save = event.target.closest('[data-save]');
  if (save) { toggleSaved(save.dataset.save); return; }
  const open = event.target.closest('[data-open]');
  if (open) { openDesign(open.dataset.open); return; }
  const button = event.target.closest('[data-filter]');
  if (button) setFilter(button.dataset.filter);
  const category = event.target.closest('[data-category]');
  if (category) { $('#search').value=''; setFilter(category.dataset.category); $('#collection').scrollIntoView(); }
  const search = event.target.closest('[data-search]');
  if (search) { $('#search').value=search.dataset.search; setFilter('All'); $('#collection').scrollIntoView(); }
});
$('#search').addEventListener('input',render);
$('#show-saved').addEventListener('click',() => { $('#search').value=''; setFilter('Saved'); $('#collection').scrollIntoView(); });
$('#reset-filter').addEventListener('click',() => { $('#search').value=''; setFilter('All'); });
$('#preferred-size').addEventListener('change',updateMail);
$('#shortlist-note').addEventListener('input',updateMail);
$('#close-dialog').addEventListener('click',closeDesign);
dialog.addEventListener('cancel',event => { event.preventDefault(); closeDesign(); });
dialog.addEventListener('click',event => { if(event.target===dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) closeDesign(); } });
$('#dialog-save').addEventListener('click',() => { if(current) toggleSaved(current.id); });
$('#dialog-interest').addEventListener('click',() => { if(current&&!favorites.has(current.id)) toggleSaved(current.id); closeDesign(); });
$('#share-design').addEventListener('click',async() => { if(!current)return; const url=new URL(location.href); url.searchParams.set('design',current.id); url.hash=''; try { await navigator.clipboard.writeText(url.href); notify('Design link copied'); } catch { window.prompt('Copy this design link:',url.href); } });
render();
const initial = new URL(location.href).searchParams.get('design');
if (initial && ALL_DESIGNS.some(d=>d.id===initial)) openDesign(initial,false);
else if (initial) $('#retired-note').hidden = false;
const requestedCategory = new URL(location.href).searchParams.get('category');
if (requestedCategory && ['All','New','Carryover','Saved','Sweats','Tees','Hats','Accessories','Onesies','Holiday','Fan lab'].includes(requestedCategory)) setFilter(requestedCategory);


function reviewDesigns() { return ALL_DESIGNS; }
function updateReview() {
  const choices = PromptReview.decisions(reviewDesigns(), favorites);
  $('#keep-total').textContent = choices.keep.length;
  $('#replace-total').textContent = choices.replace.length;
  $('#review-summary').textContent = `${choices.keep.length} ${choices.keep.length === 1 ? 'keeper' : 'keepers'}. ${choices.replace.length} still need your heart.`;
  $('#decision-brief').value = PromptReview.brief(reviewDesigns(), favorites, $('#revision-note').value);
  $('#decision-help').textContent = choices.keep.length ? 'Copy this brief into our chat when your picks are ready. Your keepers stay; the rest become the next design round.' : 'No keepers selected. Copying this brief asks for new ideas for all 66 current designs. Nothing is replaced until you share it.';
}
$('#revision-note').addEventListener('input', () => {
  try { localStorage.setItem('prompt-dept-revision-note-v1', $('#revision-note').value); } catch {}
  updateReview();
});
try { $('#revision-note').value = localStorage.getItem('prompt-dept-revision-note-v1') || ''; } catch {}
updateReview();
$('#copy-decisions').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#decision-brief').value); notify('Design brief copied. Paste it into our chat.'); }
  catch { $('#brief-details').open = true; $('#decision-brief').focus(); $('#decision-brief').select(); notify('Select and copy the brief below.'); }
});
$('#download-decisions').addEventListener('click', () => {
  const choices = PromptReview.decisions(reviewDesigns(), favorites);
  const data = {brand:'Prompt Dept.',schemaVersion:1,createdAt:new Date().toISOString(),catalogIds:reviewDesigns().map(d=>d.id),keep:choices.keep.map(d=>({id:d.id,name:d.name})),replace:choices.replace.map(d=>({id:d.id,name:d.name})),direction:$('#revision-note').value,adultOnesiesOnly:true};
  const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download='prompt-dept-design-decisions.json'; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
window.addEventListener('storage', event => {
  if (PromptReview.keys.includes(event.key) || event.key === null) { try { favorites = PromptReview.read(localStorage, favorites); } catch {} render(); }
});
window.addEventListener('pageshow', () => { try { favorites = PromptReview.read(localStorage, favorites); } catch {} render(); });
