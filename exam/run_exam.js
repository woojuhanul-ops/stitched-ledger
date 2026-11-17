// Exam harness (checker side — NOT part of the product).
// Runs the 81-question exam against the compiled core and writes results.
const fs = require('fs');
const path = require('path');
const { parseLedger, answerQuestion } = require('../dist/index.js');

const root = path.join(__dirname, '..');
const ledgerText = fs.readFileSync(path.join(root, 'data', 'ledger.json'), 'utf-8');
const exam = JSON.parse(fs.readFileSync(path.join(__dirname, 'exam.json'), 'utf-8'));
const table = parseLedger(ledgerText);

const norm = (s) => String(s).trim().replace(/\s+/g, ' ');
const evKey = (e) => `${e.row}:${e.col}`;
const evSet = (arr) => new Set((arr || []).map(evKey));

const results = [];
let retrievalCorrect = 0, retrievalTotal = 0;
let trapCorrect = 0, trapTotal = 0;
let evidenceCorrect = 0;
let totalMs = 0;

for (const item of exam) {
  const t0 = process.hrtime.bigint();
  let res;
  try {
    res = answerQuestion(table, item.question);
  } catch (err) {
    res = { status: 'ERROR', message: String(err && err.message || err) };
  }
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6;
  totalMs += ms;

  const isTrap = item.expectedStatus === 'ABSTAIN';
  let correct = false, evCorrect = false, failureKind = null;

  if (isTrap) {
    trapTotal++;
    correct = res.status === 'ABSTAIN' && res.message === '기록에 없음';
    if (!correct) failureKind = res.status === 'ANSWER' ? 'guessed-instead-of-abstain' : 'wrong-abstain-form';
    if (correct) trapCorrect++;
  } else {
    retrievalTotal++;
    if (res.status !== 'ANSWER') {
      failureKind = 'abstained-instead-of-answer';
    } else if (norm(res.answer) !== norm(item.expectedAnswer)) {
      failureKind = 'wrong-answer';
    } else {
      correct = true;
      const exp = evSet(item.expectedEvidence), act = evSet(res.evidence);
      evCorrect = exp.size === act.size && [...exp].every((k) => act.has(k));
      if (evCorrect) evidenceCorrect++;
      else failureKind = 'evidence-mismatch';
    }
    if (correct) retrievalCorrect++;
  }

  results.push({
    id: item.id, type: item.type, question: item.question,
    expectedStatus: item.expectedStatus, expectedAnswer: item.expectedAnswer,
    gotStatus: res.status, gotAnswer: res.answer || null, gotMessage: res.message || null,
    correct, evidenceCorrect: evCorrect, failureKind, ms: Math.round(ms * 1000) / 1000,
  });
}

const summary = {
  retrieval: `${retrievalCorrect}/${retrievalTotal}`,
  traps: `${trapCorrect}/${trapTotal}`,
  evidenceCorrectAmongCorrectAnswers: evidenceCorrect,
  avgMsPerQuestion: Math.round((totalMs / exam.length) * 1000) / 1000,
  failures: results.filter((r) => !r.correct || (r.expectedStatus === 'ANSWER' && r.correct && !r.evidenceCorrect)),
};
fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify({ summary, results }, null, 1), 'utf-8');
console.log(JSON.stringify(summary, null, 1));
