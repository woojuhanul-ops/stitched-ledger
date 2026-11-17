# Stitched Ledger

A small, deterministic record-answering engine — a librarian, not a brain.
It answers questions by exact lookup over one loaded table, shows the exact
cell every answer came from, and honestly abstains when a fact is not in the
table. No language model, no guessing, no network calls: all computation runs
in the visitor's own browser.

**Live app: https://stitched-ledger.pages.dev/**

Built for **Kiroween 2026**, category **Frankenstein** — four parts stitched
into one app: a table parser, a deterministic retrieval formula, an
abstention gate, and an evidence-linking interface.

## How it works

- Records are stacked as a table (the "ledger"). The built-in ledger is a
  48-row synthetic Frankenstein laboratory ledger (reagents, equipment,
  safety data; 8 columns, no personal data). The same engine answers over any
  table loaded in its place.
- Questions are matched against nine frozen question templates (T1–T9:
  value lookup, count, comparison, and similar exact forms).
- Every answer carries its evidence as table coordinates, `[Row, Col]`, and
  the interface lights up the actual evidence cell — the "stitch" between
  answer and source.
- If a fact is absent from the table, or a question falls outside the
  templates, the engine abstains with "기록에 없음" ("no record") instead of
  inventing an answer.

## Features

- Split view: question input and answer card on the left, the full ledger
  grid on the right.
- Stitch highlight: the evidence cell glows and the answer card shows
  `evidence → [Row, Col]`.
- **[Run 66-Point Live Verification] button**: re-runs the 66-question
  verification in the browser through the real core path and displays the
  pass count with the actually measured time.
- Ledger loader: drag and drop (or select) a CSV/TSV file to replace the
  ledger and ask questions over your own table. Malformed files are rejected
  with the reason stated, and the previous ledger stays in place.
- Dark laboratory theme; no external fonts, images, or network requests.

## Verification (measured, not estimated)

The exam is 81 questions: 66 generated mechanically from the table (answers
and evidence coordinates derived from the table itself) plus 15 trap
questions built only from items and attributes verifiably absent from the
table.

| Check | Result |
|---|---|
| Core exam, Node build (`exam/run_exam.js`) | retrieval **66/66**, trap abstention **15/15**, evidence coordinates **66/66**, avg 0.018 ms/question |
| Core exam, web build modules (`exam/run_exam_web.mjs`) | retrieval **66/66**, trap abstention **15/15**, evidence coordinates **66/66**, avg 0.019 ms/question |
| Live verification button, local page (real Chrome) | **66/66 passed, measured in 1.4 ms** (the panel's own `performance.now()` reading) |
| Live verification button, live page (real Chrome via CDP) | **66/66 passed, measured in 1.4 ms** |
| Loader unit tests (`exam/test_loader.mjs`) | **10/10** |
| Type checks (`tsc`, core and web configurations) | clean, exit 0 |

The 1.4 ms figure is the value the verification panel itself measured in a
real browser, read as displayed; it was reproduced independently on the
local page and on the live deployment, whose files were verified
byte-identical to the deployed build.

Honest boundaries, by design: questions outside the nine frozen templates
are all abstained (that boundary is the point of the piece), and the loader
does not accept quoted CSV fields containing line breaks — such files are
rejected with the reason shown.

## Run it

Live: open https://stitched-ledger.pages.dev/

Local web app (the `web/` directory is the complete static app):

```sh
python3 -m http.server 8000 -d web
# then open http://localhost:8000/
```

Core engine and exams (Node):

```sh
npm install
npm run build              # tsc -> dist/
node exam/run_exam.js        # 81-question exam against the Node build
node exam/run_exam_web.mjs   # the same exam against the web modules
node exam/test_loader.mjs    # loader unit tests
```

## How I used Kiro

The specification was frozen before construction and lives in `/.kiro`:

- `/.kiro/steering/principles.md` — the governing rules for every file:
  deterministic only, never guess, evidence coordinates always, ambiguity
  abstains.
- `/.kiro/specs/` — requirements, design, and task lists for the core
  (`requirements.md`, `design.md`, `tasks.md`), the interface (`ui-design.md`,
  `ui-tasks.md`), and the loader (`loader-design.md`).

Construction was done with **Kiro CLI 3.3.0** in ten small sessions, each
scoped to one part: S1 initialization, S2 parser, S3 retriever, S4
abstention gate and integration; U0 import paths, U1 web build skeleton,
U2 screen skeleton, U3 stitch highlight, U4 verification panel, U5 loader.
Each session delivered to spec on the first pass — **0 corrections in all
ten sessions** — and the raw session logs are preserved in `session-logs/`.
Verification was a separate pass from construction: type checks on both
build configurations, the 81-question exam on both build paths, loader unit
tests, and full live operation of the deployed page in a real browser.

Concept, specifications, and verification design: Dukha Kim (Nexus Group).
Construction: Kiro CLI sessions working to those frozen specifications.

## Project layout

- `src/` — TypeScript sources: `parser.ts`, `retriever.ts`, `gate.ts`,
  `index.ts`, and the UI under `src/ui/`.
- `web/` — the built static web app (what is deployed).
- `dist/` — the Node build of the core.
- `data/ledger.json` — the built-in 48-row synthetic ledger.
- `exam/` — the 81-question exam, its runners, and recorded results.
- `session-logs/` — the Kiro session logs and browser verification scripts.
- `/.kiro/` — steering principles and specifications (kept at the repo root,
  not git-ignored).

## License

MIT — see `LICENSE`.
