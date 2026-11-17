# Tasks — Stitched Ledger Core

- [x] S1 Init: create `package.json` and `tsconfig.json` exactly as in
      design.md §Build configuration, plus `src/index.ts` as an empty
      placeholder (a single comment line). Nothing else.
- [x] S2 Parser: implement `src/parser.ts` exactly as in design.md §Types.
- [x] S3 Retriever: implement `src/retriever.ts` exactly as in
      design.md §Retriever (families T1–T9).
- [x] S4 Gate: implement `src/gate.ts` and finish `src/index.ts` re-exporting
      `parseLedger`, `answerQuestion`, and the public types. Then run
      `npx tsc --noEmit` and fix any errors within the session.

Rules for every session: read `.kiro/steering/principles.md` first; modify
only the files named for that session; never touch `data/` or `.kiro/`;
do not run `npm install`.

