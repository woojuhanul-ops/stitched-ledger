import { LedgerTable } from "./parser.js";
import { EvidenceCell, retrieve } from "./retriever.js";

export type { EvidenceCell };

export type AnswerResult =
  | { status: "ANSWER"; answer: string; evidence: EvidenceCell[] }
  | { status: "ABSTAIN"; message: "기록에 없음" };

export function answerQuestion(table: LedgerTable, question: string): AnswerResult {
  const result = retrieve(table, question);
  if (result !== null) {
    return { status: "ANSWER", answer: result.answer, evidence: result.evidence };
  }
  return { status: "ABSTAIN", message: "기록에 없음" };
}
