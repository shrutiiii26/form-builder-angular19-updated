# Form Builder Offline - Angular 19

This is a working starter project scaffold for the "Angular Form Builder & Runtime (offline)" machine test, tailored for Angular 19.

Features included in this scaffold:

- IndexedDB persistence via Dexie (forms, submissions, audit)
- NgRx Store + Effects (basic forms slice)
- Web Worker for evaluating computed fields & rules
- Basic Builder UI (add fields, save schema)
- Runtime renderer for simple schemas (text, number, date, select)
- Submissions list with virtual scroll and CSV export
- PWA config (ngsw-config.json) and offline detection
- Theme toggle scaffold and seed data

**Limitations**
This scaffold implements core functionality and wiring. It is a complete Angular workspace skeleton but intentionally keeps UI and some advanced features as minimal implementations for you to extend:

- Rules engine is simple (uses Function in worker for expression eval) — replace with a safe parser before production.
- Versioning UI shows basic version bumps; full diff UI can be implemented with jsondiffpatch.
- Accessibility and performance tuning are scaffolded but may need improvements.

## Setup

1. Install Angular CLI v19 and Node (>=18)
2. Run:
   ```
   npm install
   ng serve
   ```
3. Open `http://localhost:4200`
