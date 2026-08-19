import { fileSlug } from './model.js';
import { documentStyles, esc, formatInline, renderDocument } from './document.js';

function downloadBlob(filename, mime, content) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function standaloneHtml(sop) {
  const body = renderDocument(sop);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(sop.meta.number || 'SOP')} — ${esc(sop.meta.title || 'Standard Operating Procedure')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&display=swap" rel="stylesheet" />
  <style>
    ${documentStyles()}
    html, body { background: #ece7dc; margin: 0; }
    body { padding: 16px; }
    .doc { box-shadow: 0 12px 40px rgba(16, 35, 58, 0.16); }
    @media print {
      html, body { background: white; padding: 0; }
      .doc { box-shadow: none; }
      @page { size: A4; margin: 12mm 14mm 16mm; }
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

export function downloadHtml(sop) {
  downloadBlob(`${fileSlug(sop)}.html`, 'text/html;charset=utf-8', standaloneHtml(sop));
}

function filled(v) {
  return String(v || '').trim().length > 0;
}

function mdInline(text) {
  return String(text || '').replace(/\r\n/g, '\n').trim();
}

function mdTable(headers, rows) {
  const h = `| ${headers.join(' | ')} |`;
  const s = `| ${headers.map(() => '---').join(' | ')} |`;
  const b = rows.map((r) => `| ${r.map((c) => String(c || '').replace(/\|/g, '\\|')).join(' | ')} |`).join('\n');
  return `${h}\n${s}\n${b}`;
}

export function toMarkdown(sop) {
  const lines = [];
  const org = sop.company?.name || 'Organization';
  lines.push(`# Standard Operating Procedure`);
  lines.push('');
  lines.push(`**${org}**${sop.company?.site ? ` — ${sop.company.site}` : ''}`);
  lines.push('');
  lines.push(`## ${sop.meta.title || 'Untitled procedure'}`);
  lines.push('');
  lines.push(mdTable(
    ['Document no.', 'Version', 'Revision', 'Status', 'Effective date', 'Department'],
    [[
      sop.meta.number || '—',
      sop.meta.version || '—',
      sop.meta.revision || '—',
      sop.meta.status || 'Draft',
      sop.meta.effectiveDate || '—',
      [sop.meta.department, sop.meta.area].filter(filled).join(' / ') || '—',
    ]],
  ));
  lines.push('');
  lines.push(`**Classification:** ${sop.company?.classification || 'Internal'}`);
  lines.push('');
  let n = 1;
  const h = (title) => {
    lines.push(`## ${n}. ${title}`);
    lines.push('');
    n += 1;
  };

  h('Purpose');
  lines.push(mdInline(sop.purpose) || '_Not specified._');
  lines.push('');
  h('Scope');
  lines.push(mdInline(sop.scope) || '_Not specified._');
  lines.push('');

  h('Responsibilities');
  const roles = (sop.responsibilities || []).filter((r) => filled(r.role) || filled(r.duties));
  if (roles.length) {
    lines.push(mdTable(['Role', 'Responsibilities'], roles.map((r) => [r.role, r.duties])));
  } else lines.push('_Not specified._');
  lines.push('');

  const defs = (sop.definitions || []).filter((d) => filled(d.term));
  if (defs.length) {
    h('Definitions');
    for (const d of defs) lines.push(`- **${d.term}** — ${mdInline(d.definition)}`);
    lines.push('');
  }

  const mats = (sop.materials || []).filter((m) => filled(m.item));
  if (mats.length) {
    h('Materials / Equipment / Tools');
    lines.push(mdTable(['Item', 'Specification / notes', 'Qty'], mats.map((m) => [m.item, m.specification, m.quantity])));
    lines.push('');
  }

  const safeties = (sop.safety || []).filter((s) => filled(s.text));
  if (safeties.length) {
    h('Safety Precautions / Warnings');
    for (const s of safeties) {
      lines.push(`> **${(s.level || 'note').toUpperCase()}:** ${mdInline(s.text)}`);
      lines.push('');
    }
  }

  h('Procedure');
  (sop.steps || []).forEach((st, i) => {
    lines.push(`### ${i + 1}. ${st.title || `Step ${i + 1}`}`);
    lines.push('');
    if (filled(st.instruction)) {
      lines.push(mdInline(st.instruction));
      lines.push('');
    }
    if (filled(st.callout)) {
      lines.push(`> **${(st.calloutType || 'note').toUpperCase()}:** ${mdInline(st.callout)}`);
      lines.push('');
    }
    (st.substeps || []).filter((s) => filled(s.text)).forEach((s, si) => {
      lines.push(`${i + 1}.${si + 1}. ${mdInline(s.text)}`);
    });
    if ((st.substeps || []).some((s) => filled(s.text))) lines.push('');
    (st.bullets || []).filter(filled).forEach((b) => lines.push(`- ${mdInline(b)}`));
    if ((st.bullets || []).some(filled)) lines.push('');
    if (st.table?.headers) {
      const rows = (st.table.rows || []).filter((r) => r.some(filled));
      if (rows.length) {
        lines.push(mdTable(st.table.headers, rows));
        lines.push('');
      }
    }
  });

  const checks = (sop.qualityChecks || []).filter((c) => filled(c.check));
  if (checks.length) {
    h('Quality Checks / Acceptance Criteria');
    lines.push(mdTable(
      ['Check', 'Acceptance criteria', 'Method', 'Frequency'],
      checks.map((c) => [c.check, c.criteria, c.method, c.frequency]),
    ));
    lines.push('');
  }

  const refs = (sop.references || []).filter((r) => filled(r.title) || filled(r.number));
  if (refs.length) {
    h('References / Related Documents');
    lines.push(mdTable(['Type', 'Document', 'Number'], refs.map((r) => [r.type, r.title, r.number])));
    lines.push('');
  }

  h('Revision History');
  const revs = sop.revisions || [];
  if (revs.length) {
    lines.push(mdTable(
      ['Version', 'Date', 'Description', 'Author'],
      revs.map((r) => [r.version, r.date, r.description, r.author]),
    ));
  } else lines.push('_None._');
  lines.push('');

  h('Approvals');
  lines.push(mdTable(
    ['Role', 'Name', 'Title', 'Date', 'Signature'],
    (sop.approvals || []).map((a) => [a.role, a.name, a.title, a.date, a.signature]),
  ));
  lines.push('');
  lines.push('---');
  lines.push('_Uncontrolled if printed — verify this is the current approved revision before use._');
  lines.push('');
  return lines.join('\n');
}

export function downloadMarkdown(sop) {
  downloadBlob(`${fileSlug(sop)}.md`, 'text/markdown;charset=utf-8', toMarkdown(sop));
}

export function downloadJson(sop) {
  const payload = {
    app: 'sop-studio',
    version: 1,
    exportedAt: new Date().toISOString(),
    sop,
  };
  downloadBlob(`${fileSlug(sop)}.json`, 'application/json;charset=utf-8', JSON.stringify(payload, null, 2));
}

function wordHtml(sop) {
  const inner = renderDocument(sop)
    .replace(/class="doc"/, 'class="doc WordSection1"');
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:w="urn:schemas-microsoft-com:office:word"
 xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${esc(sop.meta.title || 'SOP')}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page { size: 21cm 29.7cm; margin: 1.4cm 1.6cm 1.8cm; }
  ${documentStyles()}
  body { background: white; }
  .doc { max-width: none; min-height: auto; }
  .doc-banner { padding-left: 12pt; padding-right: 12pt; }
  .doc-identity, .doc-title, .doc-section, .doc-footer { padding-left: 0; padding-right: 0; }
  .doc-table { width: 100%; margin-left: 0; margin-right: 0; }
</style>
</head>
<body>
${inner}
</body>
</html>`;
}

export function downloadWord(sop) {
  downloadBlob(`${fileSlug(sop)}.doc`, 'application/msword', wordHtml(sop));
}

export function printSop(sop) {
  const html = standaloneHtml(sop);
  const w = window.open('', '_blank', 'noopener,noreferrer,width=920,height=1100');
  if (!w) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 1000);
    };
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.onload = () => {
    w.print();
  };
}

export { formatInline };
