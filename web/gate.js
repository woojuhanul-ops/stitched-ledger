import { retrieve } from "./retriever.js";
export function answerQuestion(table, question) {
    const result = retrieve(table, question);
    if (result !== null) {
        return { status: "ANSWER", answer: result.answer, evidence: result.evidence };
    }
    return { status: "ABSTAIN", message: "기록에 없음" };
}
