# Design — Stitched Ledger UI Stage

This spec governs the UI stage only. The core (parser / retriever / gate) is
frozen and already verified (81/81). Read `.kiro/steering/principles.md`
first; every principle still applies. Where this spec and the core spec
differ in file scope, this spec wins for the UI stage.

## Goal

A single static web page (no server, no network, no framework, no external
assets) that:

- loads the built-in ledger and renders it as a grid (right side),
- accepts a typed question and answers it through the UNMODIFIED core
  (`parseLedger` + `answerQuestion`), showing the answer and its evidence
  coordinates (left side),
- visually "stitches" each answer to its actual evidence cells in the grid,
- offers a **Run 66-Point Live Verification** button that re-runs the 66
  retrieval questions from the exam through the same core path, inside the
  browser, and reports the measured result and the measured elapsed time.

Questions outside the core's deterministic families return the core's
abstention (`기록에 없음`). The UI must never invent, rephrase, or
"helpfully" complete an answer: it displays the core result verbatim.

## Core import specifiers (session U0)

The core sources use extensionless relative imports (`"./parser"`). Browser
ES modules require explicit extensions. Change ONLY the import/export
specifiers in `src/parser.ts`, `src/retriever.ts`, `src/gate.ts`,
`src/index.ts` to carry the `.js` extension (e.g. `"./parser.js"`). No logic,
no identifiers, no formatting changes beyond those specifier strings. After
the change, `npx tsc --noEmit` and `npm run build` must pass, and the core
exam must still pass (the checker re-runs it).

## Web build (session U1)

- `tsconfig.web.json`: target ES2022, module ESNext, moduleResolution
  `"bundler"`, rootDir `"src"`, outDir `"web"`, strict true,
  esModuleInterop true, include `["src"]`. (Type-check/bundle resolution
  only; emitted files keep the `.js` specifiers from U0.)
- `web/package.json`: exactly `{ "type": "module" }` (so Node can import the
  emitted modules for the checker harness; browsers ignore it).
- `tools/gen-data.mjs`: a Node script (no dependencies) that reads
  `data/ledger.json` and `exam/exam.json` and generates two TypeScript
  modules:
  - `src/ui/ledger-data.ts` — exports `LEDGER_JSON: string`, the raw ledger
    JSON text (so the UI parses it with the real `parseLedger`).
  - `src/ui/exam-data.ts` — exports `EXAM66`, an array of the 66 exam items
    whose `expectedStatus` is `"ANSWER"`, each
    `{ id, question, expectedAnswer, expectedEvidence: {row, col}[] }`,
    in exam order.
  The script must fail loudly if the counts are not 48 ledger rows and 66
  retrieval questions. Run it once in this session; its outputs are committed
  as source files.
- Do NOT modify anything under `data/` or `exam/`. Do NOT run npm install.

## Page files (sessions U2–U4)

- `web/index.html` — the page. Loads `./styles.css` and, as a module script,
  `./ui/main.js`. If the URL query contains `verify=1`, the page runs the
  live verification automatically once after load (same handler as the
  button) — a shareable link judges can open.
- `web/styles.css` — all styling (see Theme).
- `src/ui/main.ts` — all behaviour. It imports `parseLedger` and
  `answerQuestion` from `../index.js`, `LEDGER_JSON` from `./ledger-data.js`,
  `EXAM66` from `./exam-data.js`. No other dependencies, no network calls.

### Layout

- Header bar: title `STITCHED LEDGER`, subtitle
  `Deterministic record retrieval — no model, no guessing`, and readouts:
  rows loaded (48), columns (8), engine status `DETERMINISTIC`.
- Main split (two columns, stacks vertically on narrow screens):
  - LEFT — query panel:
    - text input + `Ask` button (Enter key also asks);
    - sample-question chips (exactly these four):
      `Where is Sulfuric Acid located?`,
      `How many items are located in Cabinet A?`,
      `Which has the greater quantity, Sulfuric Acid or Zinc Plates?`,
      `Where is the Chronium Crystal located?` (a trap — must abstain);
    - answer card (see below);
    - verification panel (session U4).
  - RIGHT — ledger panel: the full grid, one header row with the 8 column
    names, one row per ledger record, first cell = row number (`Row 1` …
    `Row 48`). The `links` cell shows the names joined with `, `.
- Footer: `Every answer is an exact lookup over the table above. Facts that
  are not in the table are answered with an abstention — never a guess.`

### Answer card + stitch (sessions U2–U3)

On ask, call `answerQuestion(table, question)` and render:

- ANSWER: card shows the label `ANSWER`, the answer string verbatim, and one
  evidence chip per evidence cell, formatted `[Row <n> · <col>]`.
  In the grid, every evidence cell gets the class `evidence-cell`
  (fluorescent green) and its row gets the class `evidence-row` (dashed
  fluorescent outline — the "stitch"). The card itself gets a dashed
  fluorescent left border in the same colour, and a stitch line under the
  chips reading `evidence → [Row <n>, Col <col>]` (multiple cells joined
  with ` · `). The first evidence row is scrolled into view
  (`scrollIntoView({ block: "nearest" })`).
- ABSTAIN: card shows the label `ABSTAIN` and the message `기록에 없음`
  verbatim, styled in muted amber; no grid cell is highlighted; any previous
  highlight is cleared.
- Each new ask clears the previous highlight before applying the new one.

### Live verification panel (session U4)

- A button labelled exactly `Run 66-Point Live Verification` and a result
  area (initially empty).
- On click (or auto-run via `verify=1`): disable the button during the run;
  record `performance.now()`; for each of the 66 `EXAM66` items call
  `answerQuestion(table, item.question)`; a question passes iff status is
  `ANSWER`, the answer equals `expectedAnswer` after whitespace
  normalisation (trim + collapse runs of whitespace), and the evidence set
  equals `expectedEvidence` exactly (same size, same `row:col` keys). Record
  `performance.now()` again; elapsed = difference in ms.
- Render: `<passed>/66 passed`, the measured elapsed time formatted as
  `measured in <x> ms` (one decimal place) — this number must come from the
  measurement, never a constant — a grid of 66 small dots (green = pass,
  red = fail), and, if any failed, a list of the failing question ids.
  Re-enable the button. Re-running replaces the previous result.

## Theme

Dark laboratory / precision-instrument style. Near-black blue-grey
background (`#0b0e11` family), panel surfaces slightly lighter with thin
borders, monospace numerals, one accent: fluorescent green (`#3dff73`
family) reserved for evidence/stitch only. Amber reserved for abstention.
No horror imagery, no decorative clutter, no gradients-as-decoration, no
external fonts or images.

## Rules for every UI session

- Read `.kiro/steering/principles.md` and this file first.
- Modify only the files named for that session. Never touch `data/`,
  `exam/`, or the core logic in `src/parser.ts`, `src/retriever.ts`,
  `src/gate.ts` (U0's specifier-only change is the single exception).
- No new dependencies, no `npm install`, no network.
- End each session by compiling what the session produced
  (`npx tsc --noEmit` for core config; `npx tsc -p tsconfig.web.json` once it
  exists) and fixing errors within the session.
