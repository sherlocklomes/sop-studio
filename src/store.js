import { createSop, nowISO } from './model.js';

const KEY = 'sop-studio.v1';

function defaultSettings() {
  return {
    companyName: '',
    site: '',
    classification: 'Internal',
    headerColor: '#10233a',
  };
}

function empty() {
  return { sops: {}, settings: defaultSettings() };
}

function migrate(data) {
  const store = empty();
  if (!data || typeof data !== 'object') return store;
  store.settings = { ...store.settings, ...(data.settings || {}) };
  const sops = data.sops && typeof data.sops === 'object' ? data.sops : {};
  for (const [id, sop] of Object.entries(sops)) {
    if (sop && sop.id) store.sops[id] = sop;
  }
  return store;
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return migrate(JSON.parse(raw));
  } catch {
    return empty();
  }
}

export function saveStore(store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function upsertSop(store, sop) {
  const next = {
    ...store,
    sops: { ...store.sops, [sop.id]: sop },
  };
  saveStore(next);
  return next;
}

export function removeSop(store, id) {
  const sops = { ...store.sops };
  delete sops[id];
  const next = { ...store, sops };
  saveStore(next);
  return next;
}

export function listSops(store) {
  return Object.values(store.sops).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function searchSops(store, query) {
  const q = query.trim().toLowerCase();
  const all = listSops(store);
  if (!q) return all;
  return all.filter((s) => {
    const hay = [
      s.meta.title,
      s.meta.number,
      s.meta.department,
      s.meta.area,
      s.meta.status,
      s.company.name,
      s.purpose,
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function newDraft(store, templateFactory) {
  const sop = templateFactory
    ? templateFactory(store.settings)
    : createSop(store.settings);
  return upsertSop(store, sop);
}

export function exportBackup(store) {
  return JSON.stringify(
    {
      exportedAt: nowISO(),
      app: 'sop-studio',
      version: 1,
      ...store,
    },
    null,
    2,
  );
}

export function importSopJson(text) {
  const data = JSON.parse(text);
  if (data?.meta && data?.id) return data;
  if (data?.sop?.meta) return data.sop;
  throw new Error('This file is not a recognized SOP JSON export.');
}
