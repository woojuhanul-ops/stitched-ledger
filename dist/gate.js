"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.answerQuestion = answerQuestion;
const retriever_js_1 = require("./retriever.js");
function answerQuestion(table, question) {
    const result = (0, retriever_js_1.retrieve)(table, question);
    if (result !== null) {
        return { status: "ANSWER", answer: result.answer, evidence: result.evidence };
    }
    return { status: "ABSTAIN", message: "기록에 없음" };
}
