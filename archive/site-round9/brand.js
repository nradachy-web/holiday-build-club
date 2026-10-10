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
  return pool.filter(d => (['All','Saved'].includes(filter) || (filter === 'New' ? d.round === 9 : filter === 'Carryover' ? CARRYOVER_IDS.includes(d.id) : filter === 'Replace' ? !CARRYOVER_IDS.includes(d.id) && !favorites.has(d.id) : filter === 'Fan lab' ? d.fan : d.category === filter)) && (!term || [d.name,d.phrase,d.description,d.tags].join(' ').toLowerCase().includes(term)));
}
function render() {
  const list = visible();
  $('#products').innerHTML = list.map(d => `<article class="card ${favorites.has(d.id)?'is-keeper':CARRYOVER_IDS.includes(d.id)?'is-approved':'needs-idea'}"><button class="card-save" data-save="${d.id}" aria-label="${favorites.has(d.id)?'Unsave':'Save'} ${esc(d.name)}" aria-pressed="${favorites.has(d.id)}">${favorites.has(d.id)?'♥':'♡'}</button><button class="card-image" data-open="${d.id}" aria-label="Explore ${esc(d.name)}"><img src="${d.image}" alt="${esc(d.alt)}" width="1122" height="1402" loading="lazy" decoding="async"><span class="decision-tag">${CARRYOVER_IDS.includes(d.id)?'Previously approved':favorites.has(d.id)?'♥ Picked this round':'New idea'}</span>${d.fan?'<span class="fan-tag">Fan concept / Rights pending</span>':''}</button><div class="card-meta"><div><p class="category">${esc(d.type)} / ${d.fan?'Fan lab':d.method||'Concept'}</p><button class="card-title" data-open="${d.id}">${esc(d.name)}</button></div><span class="serial">${String(ALL_DESIGNS.indexOf(d)+1).padStart(2,'0')}</span></div></article>`).join('');
  $('#empty-state').hidden = list.length > 0;
  $('#result-count').textContent = `${list.length} ${list.length === 1 ? 'design' : 'designs'}${filter==='Saved'?' to keep':filter==='Replace'?' to replace':''}`;
  updateSaved();
}
function updateSaved() {
  const selected = ALL_DESIGNS.filter(d => favorites.has(d.id));
  $('#save-count').textContent = selected.length;
  $('#copy-picks-link').disabled = selected.length === 0;
  $('#shortlist-items').innerHTML = selected.length ? selected.map(d => `<div class="shortlist-item"><img src="${d.image}" alt="" width="42" height="52"><span>${esc(d.name)}</span><button data-save="${d.id}" aria-label="Remove ${esc(d.name)} from shortlist">×</button></div>`).join('') : '<p>Heart the designs you want to keep.</p>';
  if (current) $('#dialog-save').textContent = favorites.has(current.id) ? 'Saved on this device ♥' : 'Save on this device ♡';
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
  notify(!persisted ? 'Choice kept for this visit only. Copy your design brief before leaving.' : had ? 'Removed from saved picks on this device' : 'Saved on this device');
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
  const choices = PromptReview.decisions(reviewDesigns(), favorites, CARRYOVER_IDS);
  $('#keep-total').textContent = ALL_DESIGNS.filter(d => favorites.has(d.id)).length;
  $('#replace-total').textContent = choices.replace.length;
  $('#review-summary').textContent = `${choices.approved.length} approved earlier. ${choices.keep.length} new ${choices.keep.length === 1 ? 'pick' : 'picks'} on this device. ${choices.replace.length} new ${choices.replace.length === 1 ? 'idea' : 'ideas'} still to review.`;
  $('#decision-brief').value = PromptReview.brief(reviewDesigns(), favorites, $('#revision-note').value, CARRYOVER_IDS);
  $('#decision-help').textContent = choices.keep.length ? "Copy this brief when this round's picks are ready. Earlier approvals stay. Only unselected new designs are listed for replacement." : "No new picks saved on this device. The brief preserves earlier approvals and lists only this round's new designs for replacement. If you reviewed on another device, import those picks first.";
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
  const choices = PromptReview.decisions(reviewDesigns(), favorites, CARRYOVER_IDS);
  const data = {brand:'Prompt Dept.',schemaVersion:2,createdAt:new Date().toISOString(),catalogIds:reviewDesigns().map(d=>d.id),previouslyApproved:choices.approved.map(d=>({id:d.id,name:d.name})),keep:choices.keep.map(d=>({id:d.id,name:d.name})),replace:choices.replace.map(d=>({id:d.id,name:d.name})),direction:$('#revision-note').value,adultOnesiesOnly:true};
  const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download='prompt-dept-design-decisions.json'; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
window.addEventListener('storage', event => {
  if (PromptReview.keys.includes(event.key) || event.key === null) { try { favorites = PromptReview.read(localStorage, favorites); } catch {} render(); }
});
window.addEventListener('pageshow', () => { try { favorites = PromptReview.read(localStorage, favorites); } catch {} render(); });

let pendingTransfer = null;
function showTransfer() {
  pendingTransfer = PromptReview.readTransfer(location.hash, ALL_DESIGNS);
  $('#picks-import').hidden = !pendingTransfer;
  if (!pendingTransfer) return;
  $('#import-names').replaceChildren();
  $('#import-picks').disabled = pendingTransfer.invalid || pendingTransfer.ids.length === 0;
  $('#import-summary').textContent = pendingTransfer.invalid
    ? 'This transfer link is incomplete or invalid. Ask for a fresh link. Your saved picks are unchanged.'
    : pendingTransfer.ids.length
      ? `Add ${pendingTransfer.ids.length} saved ${pendingTransfer.ids.length === 1 ? 'design' : 'designs'} to this device. Your existing hearts stay.${pendingTransfer.unavailable ? ` ${pendingTransfer.unavailable} older designs are no longer in this collection.` : ''}`
      : 'This link has no designs in the current collection. Your saved picks are unchanged.';
  for (const id of pendingTransfer.ids) {
    const row = document.createElement('li');
    row.textContent = ALL_DESIGNS.find(d => d.id === id).name;
    $('#import-names').append(row);
  }
  $('#picks-import').scrollIntoView({behavior:'instant',block:'start'});
}
function dismissTransfer() {
  pendingTransfer = null;
  $('#picks-import').hidden = true;
  const url = new URL(location.href); url.hash = 'collection';
  history.replaceState(null, '', url);
}
$('#import-picks').addEventListener('click', () => {
  if (!pendingTransfer || pendingTransfer.invalid || !pendingTransfer.ids.length) return;
  try {
    const merged = PromptReview.mergeTransfer(localStorage, favorites, pendingTransfer.ids);
    PromptReview.write(localStorage, merged, HOLIDAY_IDS);
    favorites = merged;
  } catch {
    $('#import-summary').textContent = 'This browser could not save your picks. Keep this link and retry when browser storage is available. Your existing hearts have not been removed.';
    return;
  }
  dismissTransfer();
  render();
  $('#show-saved').focus({preventScroll:true});
  notify('Keepers added to this device. Existing hearts preserved.');
});
$('#dismiss-import').addEventListener('click', () => { dismissTransfer(); $('#show-saved').focus({preventScroll:true}); });
$('#copy-picks-link').addEventListener('click', async () => {
  const url = new URL('./', location.href);
  url.hash = PromptReview.transferHash(ALL_DESIGNS, favorites);
  try {
    await navigator.clipboard.writeText(url.href);
    notify('Transfer link copied. Open it on your other device.');
  } catch {
    $('#transfer-link-label').hidden = false;
    $('#transfer-link-output').value = url.href;
    $('#transfer-link-output').focus();
    $('#transfer-link-output').select();
    notify('Select and copy the transfer link below.');
  }
});
window.addEventListener('hashchange', showTransfer);
showTransfer();
