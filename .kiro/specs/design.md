# Design — Stitched Ledger Core

## Module layout (create exactly these files)
- `package.json`, `tsconfig.json` (init session)
- `src/parser.ts` — ledger parsing + types
- `src/retriever.ts` — deterministic question answering
- `src/gate.ts` — abstention gate + public answer entry point
- `src/index.ts` — re-exports the public API

## Types (src/parser.ts)
```ts
export interface LedgerRowData {
  name: string; type: string; location: string; role: string;
  quantity: number; unit: string; hazard: string; links: string[];
}
export interface LedgerRow {
  index: number;            // 1-based row number
  data: LedgerRowData;
}
export interface LedgerTable {
  columns: string[];        // ["name","type","location","role","quantity","unit","hazard","links"]
  rows: LedgerRow[];
}
export function parseLedger(jsonText: string): LedgerTable;
```
`parseLedger` parses the JSON array, validates each row has all columns
(quantity numeric, links an array of strings), and assigns 1-based indexes in
array order. On malformed input it throws an Error.

## Public API (src/gate.ts, re-exported from src/index.ts)
```ts
export interface EvidenceCell { row: number; col: string; }
export type AnswerResult =
  | { status: "ANSWER"; answer: string; evidence: EvidenceCell[] }
  | { status: "ABSTAIN"; message: "기록에 없음" };
export function answerQuestion(table: LedgerTable, question: string): AnswerResult;
```

## Retriever (src/retriever.ts)
Export `retrieve(table, question): { answer: string; evidence: EvidenceCell[] } | null`.
Return `null` whenever no certain answer exists. The gate converts `null`
into the ABSTAIN result; the retriever itself never fabricates.

Item matching: find the item name(s) appearing in the question by exact,
case-sensitive substring match against table names; when several names match,
prefer the longest name. Column values are compared exactly.

Supported question families (exact templates; `<Name>` is an item name,
`<Location>` a location value, `<Type>` a type value, `<Role>` a role string):
- T1 `Where is <Name> located?` → answer = its `location`; evidence `[{row, "location"}]`
- T2 `What is the role of <Name>?` → answer = its `role`; evidence `[{row, "role"}]`
- T3 `What is the quantity of <Name>?` → answer = `"<quantity> <unit>"`; evidence `[{row, "quantity"}]`
- T4 `What is the hazard class of <Name>?` → answer = its `hazard`; evidence `[{row, "hazard"}]`
- T5 `What is <Name> connected to?` → answer = `links` joined with `", "`; evidence `[{row, "links"}]`
- T6 `How many items are located in <Location>?` → answer = count as decimal string;
  evidence = one `{row, "location"}` per counted row. If no row has that location → `null`.
- T7 `How many items are of type <Type>?` → answer = count; evidence = one
  `{row, "type"}` per counted row. If no row has that type → `null`.
- T8 `Which has the greater quantity, <NameA> or <NameB>?` → answer = the name
  with the larger `quantity`; evidence `[{rowA, "quantity"}, {rowB, "quantity"}]`.
  If either name is unknown or quantities are equal → `null`.
- T9 `Which item has the role "<Role>"?` → answer = the matching item's `name`;
  evidence `[{row, "role"}]`. If zero or more than one row matches → `null`.

Any question not matching a family, or naming an item not in the table,
returns `null`.

## Gate (src/gate.ts)
`answerQuestion` calls `retrieve`. On a non-null result it returns
`{ status: "ANSWER", answer, evidence }`. On `null` it returns
`{ status: "ABSTAIN", message: "기록에 없음" }` (exact string).

## Build configuration
- `package.json`: name `stitched-ledger`, version `0.1.0`, license `MIT`,
  `"type": "commonjs"`, scripts `{ "build": "tsc" }`,
  devDependencies: `typescript` ^5, `@types/node` ^22.
- `tsconfig.json`: target ES2022, module CommonJS, rootDir `src`,
  outDir `dist`, strict true, esModuleInterop true, include `["src"]`.
