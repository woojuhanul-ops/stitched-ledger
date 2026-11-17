# Stitched Ledger — Steering Principles

These principles govern every file in this project. They override convenience.

1. **Deterministic only.** The engine answers questions by exact lookup over a
   loaded table. No probabilistic generation, no randomness, no external APIs,
   no network calls, no model inference of any kind.
2. **Never guess (무추측).** If a fact is not in the table, the answer is an
   abstention, not an approximation. The abstention result is exactly:
   `{ status: "ABSTAIN", message: "기록에 없음" }`.
3. **Evidence coordinates always.** Every successful answer carries the
   coordinates of the cells it was derived from, written as `[Row, Col]`
   (1-based data row number, column key). An answer without evidence is a bug.
4. **Ambiguity abstains.** If a question that requires a single answer matches
   more than one row, or a comparison is tied, abstain. Never pick arbitrarily.
5. **Small, plain TypeScript.** Strict mode, no external runtime dependencies,
   no frameworks. Code must compile with `tsc` with zero errors.
6. **Scope discipline.** Implement only what `.kiro/specs/design.md` specifies.
   Do not modify anything under `data/` or `.kiro/`. Do not add features.
