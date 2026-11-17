# Tasks — Stitched Ledger UI Stage

Spec: `.kiro/specs/ui-design.md`. Read `.kiro/steering/principles.md` and
the UI design before every session. Modify only the files named in the
session. Never touch `data/` or `exam/`. No npm install, no new
dependencies, no network.

- [x] U0 Core import specifiers: in `src/parser.ts`, `src/retriever.ts`,
      `src/gate.ts`, `src/index.ts`, change relative import/export
      specifiers to carry the `.js` extension. Specifier strings only — no
      logic or other text changes. Then run `npx tsc --noEmit` and
      `npm run build`; fix nothing else.
- [x] U1 Web build scaffolding: create `tsconfig.web.json`,
      `web/package.json`, and `tools/gen-data.mjs` exactly as in ui-design.md
      §Web build; run `node tools/gen-data.mjs` to generate
      `src/ui/ledger-data.ts` and `src/ui/exam-data.ts`. Then run
      `npx tsc -p tsconfig.web.json --noEmit`.
- [x] U2 Page skeleton: create `web/index.html`, `web/styles.css`, and
      `src/ui/main.ts` implementing ui-design.md §Layout and the ask flow
      (answer card with evidence chips; abstain card; plain fluorescent
      highlight of evidence cells/rows; sample chips). Then run
      `npx tsc -p tsconfig.web.json`.
- [x] U3 Stitch layer: extend `src/ui/main.ts` and `web/styles.css` with the
      stitch presentation of ui-design.md §Answer card + stitch (dashed
      stitch outline on evidence rows, dashed card border, the
      `evidence → …` stitch line, scroll-into-view, highlight clearing).
      Then run `npx tsc -p tsconfig.web.json`.
- [x] U4 Live verification panel: extend `src/ui/main.ts` (and
      `web/index.html` / `web/styles.css` if needed) with the verification
      panel of ui-design.md §Live verification panel, including the
      `verify=1` auto-run. Then run `npx tsc -p tsconfig.web.json`.
- [x] U5 Loader: implement `.kiro/specs/loader-design.md` (src/ui/loader.ts,
      main.ts wiring, index.html, styles.css). Completed 2026-11-16 night;
      checker tests 10/10 + live CDP pass.
