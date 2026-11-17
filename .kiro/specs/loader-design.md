# Design — Stitched Ledger Loader Stage (U5)

Extends the finished UI. Read `.kiro/steering/principles.md` and
`.kiro/specs/ui-design.md` first; all principles still apply. The core
(parser / retriever / gate) stays untouched.

## Goal

Let a visitor replace the built-in ledger with their own table file, after
which the same deterministic retrieval and abstention operate on the new
table. A malformed file is rejected honestly — an error is shown and the
current ledger stays in place. Nothing is partially loaded, ever.

## Input contract (state it in the page, see UI text below)

- File types: `.csv` or `.tsv`, UTF-8 text. Delimiter: tab for `.tsv`,
  comma for `.csv`.
- First row is a header containing all eight column names —
  `name, type, location, role, quantity, unit, hazard, links` — in any
  order.
- Every data row must have exactly as many fields as the header.
  `quantity` must be a plain number. `links` is a `;`-separated list of
  item names (may be empty). Standard CSV quoting (double quotes) is
  honoured.
- At least one data row is required.

## Behaviour

- A drop zone in the left panel: dashed border, text
  `Drop a .csv / .tsv ledger file here — or click to choose a file`,
  containing a hidden `<input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values">`.
  Clicking the zone opens the file chooser; dropping a file loads it.
  Drag-over state is visibly highlighted.
- On file selection (drop or chooser), read it as text and convert:
  1. Split into rows honouring CSV quoting; detect the delimiter from the
     file extension (`.tsv` → tab, otherwise comma).
  2. Validate the header (all eight names present) and every data row
     (field count, numeric quantity, at least one data row).
  3. Build row objects keyed by the eight columns (`links` split on `;`,
     trimmed, empties dropped), serialise to JSON text, and pass it through
     the real `parseLedger`. If ANY step fails, loading aborts.
- On failure: show a notice in the drop zone area, class `load-error`,
  text starting with `File rejected — ` followed by a short specific
  reason (e.g. `missing column: hazard`, `row 4 has 7 fields, expected 8`,
  `row 2 quantity is not a number`, `no data rows`). The current ledger,
  grid, and answer state remain untouched.
- On success: replace the active table (the `table` binding must become
  reassignable), re-render the grid and header readouts, clear the answer
  card and any highlight, show a notice class `load-ok`:
  `Custom ledger loaded: <N> rows from <file name>.` Also show a
  `Restore built-in ledger` button that returns to the built-in table
  (same re-render path).
- The question templates are value-driven, so questions over the new table
  work unchanged through the same `answerQuestion`. The 66-point
  verification exam belongs to the built-in ledger only: while a custom
  ledger is active, disable the verify button and show the note
  `Live verification is available with the built-in ledger.` Re-enable it
  when the built-in ledger is restored.
- Under the drop zone, one hint line:
  `Header must contain: name, type, location, role, quantity, unit, hazard, links — links separated by ;`

## Files

- `src/ui/main.ts` — add the loader (parse/validate/convert may live in a
  new `src/ui/loader.ts` exporting a pure
  `ledgerFromDelimitedText(text: string, delimiter: string): LedgerTable`
  that throws `Error` with the specific reason on any violation, using
  `parseLedger` for final validation; main.ts wires the DOM).
- `web/index.html`, `web/styles.css` — drop zone, notices, restore button,
  drag-over and error/ok styling in the existing dark lab theme.
- Compile with `npx tsc -p tsconfig.web.json`; zero errors.

## Rules

- Read the steering principles and this file first. Modify only the files
  named above. Never touch `data/`, `exam/`, or the core sources.
- No new dependencies, no npm install, no network. No file is uploaded
  anywhere — reading happens entirely in the browser via `File.text()`.
