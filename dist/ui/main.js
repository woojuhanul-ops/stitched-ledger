"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../index.js");
const ledger_data_js_1 = require("./ledger-data.js");
const exam_data_js_1 = require("./exam-data.js");
// ---------------------------------------------------------------------------
// Bootstrap — parse the ledger once at load time
// ---------------------------------------------------------------------------
const table = (0, index_js_1.parseLedger)(ledger_data_js_1.LEDGER_JSON);
// Update header readouts
const statRows = document.getElementById("stat-rows");
const statCols = document.getElementById("stat-cols");
if (statRows)
    statRows.textContent = String(table.rows.length);
if (statCols)
    statCols.textContent = String(table.columns.length);
// ---------------------------------------------------------------------------
// Build ledger grid
// ---------------------------------------------------------------------------
const thead = document.getElementById("ledger-thead");
const tbody = document.getElementById("ledger-tbody");
// Header row: row-number stub + 8 column names
const headerRow = document.createElement("tr");
const thRowNum = document.createElement("th");
thRowNum.textContent = "#";
headerRow.appendChild(thRowNum);
for (const col of table.columns) {
    const th = document.createElement("th");
    th.textContent = col.toUpperCase();
    headerRow.appendChild(th);
}
thead.appendChild(headerRow);
// Data rows
for (const row of table.rows) {
    const tr = document.createElement("tr");
    tr.dataset["rowIndex"] = String(row.index);
    const tdNum = document.createElement("td");
    tdNum.className = "row-num";
    tdNum.textContent = `Row ${row.index}`;
    tr.appendChild(tdNum);
    const values = [
        row.data.name,
        row.data.type,
        row.data.location,
        row.data.role,
        String(row.data.quantity),
        row.data.unit,
        row.data.hazard,
        row.data.links.join(", "),
    ];
    for (let i = 0; i < table.columns.length; i++) {
        const td = document.createElement("td");
        td.textContent = values[i] ?? "";
        td.dataset["col"] = table.columns[i];
        tr.appendChild(td);
    }
    tbody.appendChild(tr);
}
// ---------------------------------------------------------------------------
// Evidence highlight helpers
// ---------------------------------------------------------------------------
function clearHighlight() {
    const cells = tbody.querySelectorAll(".evidence-cell");
    cells.forEach((c) => c.classList.remove("evidence-cell"));
    const rows = tbody.querySelectorAll(".evidence-row");
    rows.forEach((r) => r.classList.remove("evidence-row"));
}
function applyHighlight(evidence) {
    for (const ev of evidence) {
        // Find the tr with matching row index
        const tr = tbody.querySelector(`tr[data-row-index="${ev.row}"]`);
        if (!tr)
            continue;
        tr.classList.add("evidence-row");
        // Find the td in that row with matching col
        const td = tr.querySelector(`td[data-col="${ev.col}"]`);
        if (td)
            td.classList.add("evidence-cell");
    }
    // Scroll first evidence row into view
    if (evidence.length > 0) {
        const firstTr = tbody.querySelector(`tr[data-row-index="${evidence[0].row}"]`);
        firstTr?.scrollIntoView({ block: "nearest" });
    }
}
// ---------------------------------------------------------------------------
// Answer card rendering
// ---------------------------------------------------------------------------
const answerCard = document.getElementById("answer-card");
function renderAnswerCard(question) {
    const result = (0, index_js_1.answerQuestion)(table, question);
    // Clear previous card state and highlight
    clearHighlight();
    answerCard.className = "answer-card";
    answerCard.innerHTML = "";
    if (result.status === "ANSWER") {
        answerCard.classList.add("state-answer");
        const statusEl = document.createElement("div");
        statusEl.className = "card-status";
        statusEl.textContent = "ANSWER";
        answerCard.appendChild(statusEl);
        const answerEl = document.createElement("div");
        answerEl.className = "card-answer";
        answerEl.textContent = result.answer;
        answerCard.appendChild(answerEl);
        // Evidence chips + stitch line
        if (result.evidence.length > 0) {
            const chipsEl = document.createElement("div");
            chipsEl.className = "evidence-chips";
            for (const ev of result.evidence) {
                const chip = document.createElement("span");
                chip.className = "ev-chip";
                chip.textContent = `[Row ${ev.row} · ${ev.col}]`;
                chipsEl.appendChild(chip);
            }
            answerCard.appendChild(chipsEl);
            // Stitch line: evidence → [Row n, Col col] · [Row n, Col col] …
            const stitchEl = document.createElement("div");
            stitchEl.className = "stitch-line";
            const coordsText = result.evidence
                .map((ev) => `[Row ${ev.row}, Col ${ev.col}]`)
                .join(" · ");
            stitchEl.innerHTML = `evidence → <span class="stitch-coords">${coordsText}</span>`;
            answerCard.appendChild(stitchEl);
        }
        // Apply grid highlight
        applyHighlight(result.evidence);
    }
    else {
        // ABSTAIN
        answerCard.classList.add("state-abstain");
        const statusEl = document.createElement("div");
        statusEl.className = "card-status";
        statusEl.textContent = "ABSTAIN";
        answerCard.appendChild(statusEl);
        const msgEl = document.createElement("div");
        msgEl.className = "card-answer";
        msgEl.textContent = result.message;
        answerCard.appendChild(msgEl);
    }
    answerCard.classList.remove("hidden");
}
// ---------------------------------------------------------------------------
// Ask interaction
// ---------------------------------------------------------------------------
const questionInput = document.getElementById("question-input");
const askBtn = document.getElementById("ask-btn");
function doAsk() {
    const q = questionInput.value.trim();
    if (!q)
        return;
    renderAnswerCard(q);
}
askBtn.addEventListener("click", doAsk);
questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
        doAsk();
});
// ---------------------------------------------------------------------------
// Sample chips
// ---------------------------------------------------------------------------
const chips = document.querySelectorAll(".chip[data-q]");
chips.forEach((chip) => {
    chip.addEventListener("click", () => {
        const q = chip.dataset["q"] ?? "";
        questionInput.value = q;
        renderAnswerCard(q);
    });
});
// ---------------------------------------------------------------------------
// Live verification panel
// ---------------------------------------------------------------------------
const verifyBtn = document.getElementById("verify-btn");
const verifyResult = document.getElementById("verify-result");
function normalizeWs(s) {
    return s.trim().replace(/\s+/g, " ");
}
function runVerification() {
    verifyBtn.disabled = true;
    const t0 = performance.now();
    const results = [];
    const failingIds = [];
    for (const item of exam_data_js_1.EXAM66) {
        const result = (0, index_js_1.answerQuestion)(table, item.question);
        let pass = false;
        if (result.status === "ANSWER") {
            const answerMatch = normalizeWs(result.answer) === normalizeWs(item.expectedAnswer);
            // Build a set of "row:col" keys from actual evidence
            const actualKeys = new Set(result.evidence.map((ev) => `${ev.row}:${ev.col}`));
            const expectedKeys = new Set(item.expectedEvidence.map((ev) => `${ev.row}:${ev.col}`));
            const evidenceMatch = actualKeys.size === expectedKeys.size &&
                [...expectedKeys].every((k) => actualKeys.has(k));
            pass = answerMatch && evidenceMatch;
        }
        results.push(pass);
        if (!pass)
            failingIds.push(item.id);
    }
    const t1 = performance.now();
    const elapsed = t1 - t0;
    const passed = results.filter(Boolean).length;
    // Clear and render result area
    verifyResult.innerHTML = "";
    verifyResult.classList.remove("hidden");
    // Summary line
    const summaryEl = document.createElement("div");
    summaryEl.className = "verify-summary";
    const passedSpan = document.createElement("span");
    passedSpan.className = passed === 66 ? "vpass" : "vfail";
    passedSpan.textContent = `${passed}/66 passed`;
    summaryEl.appendChild(passedSpan);
    verifyResult.appendChild(summaryEl);
    // Elapsed time
    const elapsedEl = document.createElement("div");
    elapsedEl.className = "verify-elapsed";
    elapsedEl.textContent = `measured in ${elapsed.toFixed(1)} ms`;
    verifyResult.appendChild(elapsedEl);
    // 66 dots
    const dotsEl = document.createElement("div");
    dotsEl.className = "verify-dots";
    for (const pass of results) {
        const dot = document.createElement("span");
        dot.className = `vdot ${pass ? "pass" : "fail"}`;
        dot.title = pass ? "pass" : "fail";
        dotsEl.appendChild(dot);
    }
    verifyResult.appendChild(dotsEl);
    // Failing ids (if any)
    if (failingIds.length > 0) {
        const failEl = document.createElement("div");
        failEl.className = "verify-failures";
        const labelEl = document.createElement("div");
        labelEl.className = "verify-failures-label";
        labelEl.textContent = "FAILING IDs";
        failEl.appendChild(labelEl);
        for (const id of failingIds) {
            const lineEl = document.createElement("div");
            lineEl.textContent = `#${id}`;
            failEl.appendChild(lineEl);
        }
        verifyResult.appendChild(failEl);
    }
    verifyBtn.disabled = false;
}
verifyBtn.addEventListener("click", runVerification);
// Auto-run if URL contains verify=1
if (new URLSearchParams(window.location.search).get("verify") === "1") {
    runVerification();
}
