# SOP Studio

A web app for writing professional Standard Operating Procedures. Build the document in a guided editor, watch a live preview that looks like a controlled company SOP, then save, duplicate, and export.

**Live app:** [https://sherlocklomes.github.io/sop-studio/](https://sherlocklomes.github.io/sop-studio/)

## What it does

- Guided builder for every usual SOP section: document control, purpose, scope, responsibilities, definitions, materials, safety, numbered procedure, quality checks, references, revision history, and approvals
- Reorderable procedure steps with sub-steps, bullet lists, simple tables, and note / tip / caution / warning / danger callouts
- Live A4-style preview with organization header, metadata tables, and signature lines
- Templates: Blank, Equipment Operation, Safety Procedure (LOTO), Quality Control
- Auto-generated document numbers (`SOP-DEPT-YEAR-001`)
- Library with search, duplicate, delete, and JSON import
- Autosave to browser storage, plus explicit Save snapshots you can restore
- Export to printable HTML, Markdown, Word-compatible `.doc`, JSON backup, and Print / Save as PDF

## Run it locally

Double-click **Open SOP Studio.bat**, or from this folder:

```bash
npm install
npm run dev
```

The app opens at [http://localhost:5177](http://localhost:5177).

SOPs are stored in this browser’s local storage. Export JSON or HTML if you need a file copy.

## Keyboard

- `Ctrl+S` / `Cmd+S` — save a version snapshot
- `Ctrl+P` / `Cmd+P` — print / save as PDF
- `Esc` — close dialogs or leave print view

Use `**bold**` in step text for emphasis. Leave approval signature fields blank to print a wet-ink line.
