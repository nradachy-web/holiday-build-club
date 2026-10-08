'use strict';
const $ = s => document.querySelector(s);
const storageKey = 'prompt-dept-favorites-v1';
let favorites = new Set();
let filter = 'All';
let current = null;
let lastFocus = null;
let toastTimer;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) favorites = new Set(saved.filter(id => CATALOG.some(d => d.id === id)));
} catch {}
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
  return CATALOG.filter(d => (filter === 'All' || (filter === 'Saved' ? favorites.has(d.id) : d.category === filter)) && (!term || [d.name,d.phrase,d.description,d.tags].join(' ').toLowerCase().includes(term)));
}
function render() {
  const list = visible();
  $('#products').innerHTML = list.map(d => `<article class="card"><button class="card-save" data-save="${d.id}" aria-label="${favorites.has(d.id)?'Unsave':'Save'} ${esc(d.name)}" aria-pressed="${favorites.has(d.id)}">${favorites.has(d.id)?'♥':'♡'}</button><button class="card-image" data-open="${d.id}" aria-label="Explore ${esc(d.name)}"><img src="${d.image}" alt="${esc(d.alt)}" width="1122" height="1402" loading="lazy" decoding="async">${d.fan?'<span class="fan-tag">Fan concept / Rights pending</span>':''}</button><div class="card-meta"><div><p class="category">${esc(d.type)} / ${d.fan?'Fan lab':'Concept'}</p><button class="card-title" data-open="${d.id}">${esc(d.name)}</button></div><span class="serial">${String(CATALOG.indexOf(d)+1).padStart(2,'0')}</span></div></article>`).join('');
  $('#empty-state').hidden = list.length > 0;
  $('#result-count').textContent = `${list.length} ${list.length === 1 ? 'design' : 'designs'}${filter==='Saved'?' in your shortlist':''}`;
  updateSaved();
}
function updateSaved() {
  const selected = CATALOG.filter(d => favorites.has(d.id));
  $('#save-count').textContent = selected.length;
  $('#shortlist-items').innerHTML = selected.length ? selected.map(d => `<div class="shortlist-item"><img src="${d.image}" alt="" width="42" height="52"><span>${esc(d.name)}</span><button data-save="${d.id}" aria-label="Remove ${esc(d.name)} from shortlist">×</button></div>`).join('') : '<p>Tap the heart on a design to start your shortlist.</p>';
  if (current) $('#dialog-save').textContent = favorites.has(current.id) ? 'Saved to your shortlist ♥' : 'Save this design ♡';
  updateMail();
}
function updateMail() {
  const selected = CATALOG.filter(d => favorites.has(d.id));
  const size = $('#preferred-size').value;
  const note = $('#shortlist-note').value.trim();
  const body = ['Hi Nick,','','My Prompt Dept. shortlist:',...selected.map(d => '- '+d.name+' ('+d.type+')'),...(!selected.length?['I am interested in the collection.']:[]),'',...(size?['Preferred clothing size: '+size,'']:[]),...(note?['My feedback: '+note,'']:[]),'This is feedback, not an order.','','May you email me once if these designs become available? [Please edit to yes or no.]','','Thanks!'].join('\n');
  $('#email-shortlist').href = 'mailto:nick@modernapexstrategies.com?subject='+encodeURIComponent('Prompt Dept.: my shortlist')+'&body='+encodeURIComponent(body);
}
function toggleSaved(id) {
  if (!CATALOG.some(d => d.id === id)) return;
  const focusId = document.activeElement?.dataset?.save;
  const had = favorites.has(id);
  had ? favorites.delete(id) : favorites.add(id);
  let persisted = true;
  try { localStorage.setItem(storageKey,JSON.stringify([...favorites])); } catch { persisted = false; }
  render();
  if (focusId) document.querySelector(`[data-save="${focusId}"]`)?.focus({preventScroll:true});
  notify(had ? 'Removed from your shortlist' : persisted ? 'Saved on this device' : 'Saved for this visit. Browser storage is unavailable.');
}
function setFilter(value) {
  filter = value;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed',b.dataset.filter===value));
  render();
}
function openDesign(id, updateUrl = true) {
  const d = CATALOG.find(x => x.id === id);
  if (!d) return;
  current = d;
  lastFocus = document.activeElement;
  $('#dialog-title').textContent = d.name;
  $('#dialog-category').textContent = d.type+' / '+d.capsule;
  $('#dialog-description').textContent = d.description;
  $('#dialog-image').src = d.image;
  $('#dialog-image').alt = d.alt;
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
if (initial && CATALOG.some(d=>d.id===initial)) openDesign(initial,false);
else if(initial && typeof HOLIDAY_IDS !== 'undefined' && HOLIDAY_IDS.includes(initial)) location.replace('holiday.html?design='+encodeURIComponent(initial));
