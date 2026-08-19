export function uid() {
  return crypto.randomUUID();
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function nowISO() {
  return new Date().toISOString();
}

export function deptCode(department) {
  const raw = String(department || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '');
  if (!raw) return 'GEN';
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 4);
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 4);
}

export function generateNumber(sops, department) {
  const year = new Date().getFullYear();
  const code = deptCode(department);
  const prefix = `SOP-${code}-${year}-`;
  const seqs = Object.values(sops || {})
    .map((s) => s?.meta?.number || '')
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number.parseInt(n.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n));
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export function rowRole(role = '', duties = '') {
  return { id: uid(), role, duties };
}

export function rowDefinition(term = '', definition = '') {
  return { id: uid(), term, definition };
}

export function rowMaterial(item = '', specification = '', quantity = '') {
  return { id: uid(), item, specification, quantity };
}

export function rowSafety(level = 'warning', text = '') {
  return { id: uid(), level, text };
}

export function rowSubstep(text = '') {
  return { id: uid(), text };
}

export function emptyTable() {
  return {
    headers: ['Column 1', 'Column 2'],
    rows: [
      ['', ''],
      ['', ''],
    ],
  };
}

export function rowStep(partial = {}) {
  return {
    id: uid(),
    title: '',
    instruction: '',
    calloutType: '',
    callout: '',
    substeps: [],
    bullets: [],
    table: null,
    ...partial,
  };
}

export function rowCheck(check = '', criteria = '', method = '', frequency = '') {
  return { id: uid(), check, criteria, method, frequency };
}

export function rowReference(title = '', number = '', type = 'SOP') {
  return { id: uid(), title, number, type };
}

export function rowRevision(version = '1.0', date = todayISO(), description = 'Initial release', author = '') {
  return { id: uid(), version, date, description, author };
}

export function rowApproval(role, name = '', title = '', date = '', signature = '') {
  return { id: uid(), role, name, title, date, signature };
}

export function createSop(settings = {}, overrides = {}) {
  const date = todayISO();
  const sop = {
    id: uid(),
    templateId: 'blank',
    createdAt: nowISO(),
    updatedAt: nowISO(),
    lastSavedAt: null,
    company: {
      name: settings.companyName || '',
      site: settings.site || '',
      classification: settings.classification || 'Internal',
      headerColor: settings.headerColor || '#10233a',
    },
    meta: {
      title: '',
      number: '',
      version: '1.0',
      revision: '0',
      status: 'Draft',
      effectiveDate: date,
      reviewDate: '',
      department: '',
      area: '',
      supersedes: 'None',
    },
    purpose: '',
    scope: '',
    responsibilities: [rowRole()],
    definitions: [],
    materials: [rowMaterial()],
    safety: [],
    steps: [rowStep()],
    qualityChecks: [rowCheck()],
    references: [],
    revisions: [rowRevision('1.0', date, 'Initial release')],
    approvals: [
      rowApproval('Prepared by'),
      rowApproval('Reviewed by'),
      rowApproval('Approved by'),
    ],
    snapshots: [],
  };
  return deepMerge(sop, overrides);
}

export function cloneSop(sop, { asCopy = true } = {}) {
  const copy = structuredClone(sop);
  copy.id = uid();
  copy.createdAt = nowISO();
  copy.updatedAt = nowISO();
  copy.lastSavedAt = null;
  copy.snapshots = [];
  if (asCopy) {
    copy.meta = {
      ...copy.meta,
      title: copy.meta.title ? `${copy.meta.title} (Copy)` : '',
      number: '',
      version: '1.0',
      revision: '0',
      status: 'Draft',
      supersedes: sop.meta.number || 'None',
    };
    copy.revisions = [rowRevision('1.0', todayISO(), `Duplicated from ${sop.meta.number || 'existing SOP'}`)];
    copy.approvals = copy.approvals.map((a) => ({
      ...a,
      id: uid(),
      date: '',
      signature: '',
    }));
  }
  return copy;
}

export function snapshotSop(sop, note = '') {
  const snap = {
    id: uid(),
    at: nowISO(),
    version: sop.meta.version,
    note,
    sop: structuredClone({ ...sop, snapshots: undefined }),
  };
  const next = structuredClone(sop);
  next.snapshots = [snap, ...(sop.snapshots || [])].slice(0, 12);
  next.lastSavedAt = snap.at;
  next.updatedAt = snap.at;
  return next;
}

export function restoreSnapshot(current, snap) {
  const restored = structuredClone(snap.sop);
  restored.id = current.id;
  restored.snapshots = current.snapshots;
  restored.createdAt = current.createdAt;
  restored.updatedAt = nowISO();
  restored.lastSavedAt = current.lastSavedAt;
  return restored;
}

export const SECTIONS = [
  { id: 'control', label: 'Document Control', hint: 'Title, ID, version, dates' },
  { id: 'purpose', label: 'Purpose & Scope', hint: 'Why it exists and who it covers' },
  { id: 'responsibilities', label: 'Responsibilities', hint: 'Roles and duties' },
  { id: 'definitions', label: 'Definitions', hint: 'Optional terms' },
  { id: 'materials', label: 'Materials & Equipment', hint: 'Tools, PPE, supplies' },
  { id: 'safety', label: 'Safety Precautions', hint: 'Warnings, cautions, notes' },
  { id: 'procedure', label: 'Procedure', hint: 'Numbered, reorderable steps' },
  { id: 'quality', label: 'Quality Checks', hint: 'Acceptance criteria' },
  { id: 'references', label: 'References', hint: 'Related documents' },
  { id: 'revisions', label: 'Revision History', hint: 'Change log' },
  { id: 'approvals', label: 'Approvals', hint: 'Prepared, reviewed, approved' },
];

export function sectionComplete(sop, sectionId) {
  const filled = (v) => String(v || '').trim().length > 0;
  switch (sectionId) {
    case 'control':
      return filled(sop.meta.title) && filled(sop.meta.number);
    case 'purpose':
      return filled(sop.purpose) && filled(sop.scope);
    case 'responsibilities':
      return sop.responsibilities.some((r) => filled(r.role) && filled(r.duties));
    case 'definitions':
      return sop.definitions.some((d) => filled(d.term));
    case 'materials':
      return sop.materials.some((m) => filled(m.item));
    case 'safety':
      return sop.safety.some((s) => filled(s.text));
    case 'procedure':
      return sop.steps.some((s) => filled(s.title) || filled(s.instruction));
    case 'quality':
      return sop.qualityChecks.some((q) => filled(q.check));
    case 'references':
      return sop.references.some((r) => filled(r.title) || filled(r.number));
    case 'revisions':
      return sop.revisions.some((r) => filled(r.description));
    case 'approvals':
      return sop.approvals.some((a) => filled(a.name));
    default:
      return false;
  }
}

export function completionScore(sop) {
  const required = ['control', 'purpose', 'responsibilities', 'procedure', 'approvals'];
  const done = required.filter((id) => sectionComplete(sop, id)).length;
  return { done, total: required.length };
}

export const STATUSES = ['Draft', 'In Review', 'Approved', 'Obsolete'];
export const CLASSIFICATIONS = ['Unrestricted', 'Internal', 'Confidential', 'Controlled'];
export const SAFETY_LEVELS = [
  { id: 'danger', label: 'Danger' },
  { id: 'warning', label: 'Warning' },
  { id: 'caution', label: 'Caution' },
  { id: 'note', label: 'Note' },
];
export const CALLOUT_TYPES = [
  { id: '', label: 'None' },
  { id: 'note', label: 'Note' },
  { id: 'tip', label: 'Tip' },
  { id: 'caution', label: 'Caution' },
  { id: 'warning', label: 'Warning' },
  { id: 'danger', label: 'Danger' },
];
export const REF_TYPES = ['SOP', 'Form', 'Specification', 'Manual', 'Regulation', 'Drawing', 'Other'];

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object') return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k] && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function setPath(obj, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) cur = cur[p];
  cur[last] = value;
}

export function fileSlug(sop) {
  const num = (sop.meta.number || 'SOP').replace(/[^\w.-]+/g, '-');
  const title = (sop.meta.title || 'untitled')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `${num}_${title || 'untitled'}_v${sop.meta.version || '1.0'}`;
}

export function formatWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function moveItem(list, id, dir) {
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return list;
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(i, 1);
  next.splice(j, 0, item);
  return next;
}

export function reorderById(list, draggedId, targetId, place) {
  const from = list.findIndex((x) => x.id === draggedId);
  const to = list.findIndex((x) => x.id === targetId);
  if (from < 0 || to < 0 || draggedId === targetId) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  let insert = next.findIndex((x) => x.id === targetId);
  if (place === 'after') insert += 1;
  next.splice(insert, 0, item);
  return next;
}
