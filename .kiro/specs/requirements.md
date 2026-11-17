# Requirements — Stitched Ledger Core

## Purpose
A browser-runnable, fully deterministic record-retrieval engine. It loads a
table (a "ledger"), answers questions by exact lookup over that table, shows
the evidence cell coordinates for every answer, and abstains with
"기록에 없음" when the fact is not in the table. This spec covers the CORE
only (parser, retriever, abstention gate). No UI in this stage.

## Functional requirements
- R1. Parse a ledger from JSON text: an array of row objects with the columns
  `name, type, location, role, quantity, unit, hazard, links`.
  Assign each row a 1-based row number and addressable `[Row, Col]` cells.
- R2. Answer the question families listed in design.md §Retriever, deriving
  every answer from table cells only.
- R3. Every ANSWER result includes evidence: a list of `{ row, col }` cells
  the answer was derived from.
- R4. Abstain (status `ABSTAIN`, message exactly `기록에 없음`) when:
  the named item is not in the table; the question family is unsupported;
  a single-answer lookup matches multiple rows; a comparison is tied.
- R5. Answer string formats (exact):
  - quantity: `"<quantity> <unit>"` (e.g. `2000 mL`)
  - count: decimal integer string (e.g. `5`)
  - links: item names joined with `", "` in stored order
  - location / role / hazard / name: the stored string verbatim

## Non-functional requirements
- N1. TypeScript strict mode, zero compile errors, no runtime dependencies.
- N2. No network, no randomness, no wall-clock dependence in engine logic.
- N3. Runs identically in Node (for the exam harness) and in a browser.
