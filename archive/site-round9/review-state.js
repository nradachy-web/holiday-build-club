/* Shared keeper state for the current collection and original holiday designs. */
(function(root) {
  'use strict';
  const keys = ['prompt-dept-favorites-v1', 'holiday-build-club-favorites-v1'];
  function read(storage, fallback = new Set()) {
    const ids = new Set();
    for (const key of keys) {
      try {
        const value = JSON.parse(storage.getItem(key) || '[]');
        if (Array.isArray(value)) value.filter(id => typeof id === 'string').forEach(id => ids.add(id));
      } catch { fallback.forEach(id => ids.add(id)); }
    }
    return ids;
  }
  function write(storage, ids, archiveIds) {
    const archive = new Set(archiveIds);
    const values = [...ids];
    storage.setItem(keys[0], JSON.stringify(values.filter(id => !archive.has(id))));
    storage.setItem(keys[1], JSON.stringify(values.filter(id => archive.has(id))));
  }
  function decisions(designs, ids, carryoverIds = []) {
    const approvedIds = new Set(carryoverIds);
    const approved = designs.filter(d => approvedIds.has(d.id));
    const reviewing = designs.filter(d => !approvedIds.has(d.id));
    return { approved, keep: reviewing.filter(d => ids.has(d.id)), replace: reviewing.filter(d => !ids.has(d.id)) };
  }
  function brief(designs, ids, note = '', carryoverIds) {
    const {approved, keep, replace} = decisions(designs, ids, carryoverIds);
    const rows = list => list.map(d => `- [${d.id}] ${d.name} | ${d.phrase || ''}`).join('\n');
    return ['PROMPT DEPT. / DESIGN DECISIONS',
      ...(carryoverIds === undefined
        ? ['Keep the saved designs exactly as they are. Develop stronger replacements for the unsaved designs. Preserve adult-only onesies.']
        : [`Preserve all ${approved.length} previously approved designs listed below. KEEP and REPLACE apply only to this round's new designs. Missing hearts on this device do not revoke earlier approvals. Preserve adult-only onesies.`,
          `PREVIOUSLY APPROVED (${approved.length})`, rows(approved) || '(No earlier approvals)']),
      `KEEP (${keep.length})`, rows(keep) || '(None selected)',
      `REPLACE (${replace.length})`, rows(replace) || '(No replacements requested)',
      ...(note.trim() ? ['DIRECTION', note.trim()] : []),
      'This is a design brief, not a product order.'].join('\n\n');
  }
  function transferHash(designs, ids) {
    return 'picks=' + designs.filter(d => ids.has(d.id)).map(d => encodeURIComponent(d.id)).join(',');
  }
  function readTransfer(hash, designs) {
    const value = hash.replace(/^#/, '');
    if (!value.startsWith('picks=')) return null;
    if (value.length > 40000) return {ids: [], invalid: true, unavailable: 0};
    let ids;
    try { ids = [...new Set(value.slice(6).split(',').filter(Boolean).map(decodeURIComponent))]; }
    catch { return {ids: [], invalid: true, unavailable: 0}; }
    if (ids.length > 1000 || ids.some(id => !/^[a-z0-9][a-z0-9-]{0,99}$/.test(id))) {
      return {ids: [], invalid: true, unavailable: 0};
    }
    const known = new Set(designs.map(d => d.id));
    return {ids: ids.filter(id => known.has(id)), invalid: false, unavailable: ids.filter(id => !known.has(id)).length};
  }
  function mergeTransfer(storage, current, incoming) {
    return new Set([...current, ...read(storage, current), ...incoming]);
  }
  root.PromptReview = {keys, read, write, decisions, brief, transferHash, readTransfer, mergeTransfer};
})(globalThis);
