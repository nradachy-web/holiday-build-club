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
  function decisions(designs, ids) {
    return { keep: designs.filter(d => ids.has(d.id)), replace: designs.filter(d => !ids.has(d.id)) };
  }
  function brief(designs, ids, note = '') {
    const {keep, replace} = decisions(designs, ids);
    const rows = list => list.map(d => `- [${d.id}] ${d.name} | ${d.phrase || ''}`).join('\n');
    return ['PROMPT DEPT. / DESIGN DECISIONS',
      'Keep the saved designs exactly as they are. Develop stronger replacements for the unsaved designs. Preserve adult-only onesies.',
      `KEEP (${keep.length})`, rows(keep) || '(None selected)',
      `REPLACE (${replace.length})`, rows(replace) || '(No replacements requested)',
      ...(note.trim() ? ['DIRECTION', note.trim()] : []),
      'This is a design brief, not a product order.'].join('\n\n');
  }
  root.PromptReview = {keys, read, write, decisions, brief};
})(globalThis);
