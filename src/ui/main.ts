import { parseLedger, answerQuestion } from "../index.js";
import type { LedgerTable } from "../index.js";
import { LEDGER_JSON } from "./ledger-data.js";
import { EXAM66 } from "./exam-data.js";
import { ledgerFromDelimitedText } from "./loader.js";

// ---------------------------------------------------------------------------
// Bootstrap — parse the built-in ledger once at load time
// ---------------------------------------------------------------------------

const BUILT_IN_TABLE: LedgerTable = parseLedger(LEDGER_JSON);

// Active table — reassignable when a custom ledger is loaded
let table: LedgerTable = BUILT_IN_TABLE;
let isCustomLedger = false;

// ---------------------------------------------------------------------------
// Header readouts
// ---------------------------------------------------------------------------

const statRows = document.getElementById("stat-rows");
const statCols = document.getElementById("stat-cols");

function updateHeaderReadouts(): void {
  if (statRows) statRows.textContent = String(table.rows.length);
  if (statCols) statCols.textContent = String(table.columns.length);
}

updateHeaderReadouts();

// ---------------------------------------------------------------------------
// Build / rebuild ledger grid
// ---------------------------------------------------------------------------

const thead = document.getElementById("ledger-thead") as HTMLTableSectionElement;
const tbody = document.getElementById("ledger-tbody") as HTMLTableSectionElement;

function renderGrid(): void {
  // Clear existing content
  thead.innerHTML = "";
  tbody.innerHTML = "";

  // Header row: row-number stub + column names
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

    const values: string[] = [
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
}

renderGrid();

// ---------------------------------------------------------------------------
// Evidence highlight helpers
// ---------------------------------------------------------------------------

function clearHighlight(): void {
  const cells = tbody.querySelectorAll<HTMLTableCellElement>(".evidence-cell");
  cells.forEach((c) => c.classList.remove("evidence-cell"));

  const rows = tbody.querySelectorAll<HTMLTableRowElement>(".evidence-row");
  rows.forEach((r) => r.classList.remove("evidence-row"));
}

function applyHighlight(evidence: { row: number; col: string }[]): void {
  for (const ev of evidence) {
    const tr = tbody.querySelector<HTMLTableRowElement>(`tr[data-row-index="${ev.row}"]`);
    if (!tr) continue;

    tr.classList.add("evidence-row");

    const td = tr.querySelector<HTMLTableCellElement>(`td[data-col="${ev.col}"]`);
    if (td) td.classList.add("evidence-cell");
  }

  if (evidence.length > 0) {
    const firstTr = tbody.querySelector<HTMLTableRowElement>(
      `tr[data-row-index="${evidence[0].row}"]`
    );
    firstTr?.scrollIntoView({ block: "nearest" });
  }
}

// ---------------------------------------------------------------------------
// Answer card rendering
// ---------------------------------------------------------------------------

const answerCard = document.getElementById("answer-card") as HTMLDivElement;

function clearAnswerCard(): void {
  clearHighlight();
  answerCard.className = "answer-card hidden";
  answerCard.innerHTML = "";
}

function renderAnswerCard(question: string): void {
  const result = answerQuestion(table, question);

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

      const stitchEl = document.createElement("div");
      stitchEl.className = "stitch-line";
      const coordsText = result.evidence
        .map((ev) => `[Row ${ev.row}, Col ${ev.col}]`)
        .join(" · ");
      stitchEl.innerHTML = `evidence → <span class="stitch-coords">${coordsText}</span>`;
      answerCard.appendChild(stitchEl);
    }

    applyHighlight(result.evidence);
  } else {
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

const questionInput = document.getElementById("question-input") as HTMLInputElement;
const askBtn = document.getElementById("ask-btn") as HTMLButtonElement;

function doAsk(): void {
  const q = questionInput.value.trim();
  if (!q) return;
  renderAnswerCard(q);
}

askBtn.addEventListener("click", doAsk);

questionInput.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Enter") doAsk();
});

// ---------------------------------------------------------------------------
// Sample chips
// ---------------------------------------------------------------------------

const chips = document.querySelectorAll<HTMLButtonElement>(".chip[data-q]");
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

const verifyBtn = document.getElementById("verify-btn") as HTMLButtonElement;
const verifyResult = document.getElementById("verify-result") as HTMLDivElement;
const verifyNote = document.getElementById("verify-custom-note") as HTMLDivElement;

function setVerifyAvailable(available: boolean): void {
  verifyBtn.disabled = !available;
  if (verifyNote) {
    verifyNote.classList.toggle("hidden", available);
  }
  if (!available) {
    // A previous verification result belongs to the built-in ledger only.
    // Clear it so it is never read as a result for a custom ledger.
    verifyResult.innerHTML = "";
    verifyResult.classList.add("hidden");
  }
}

function normalizeWs(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function runVerification(): void {
  verifyBtn.disabled = true;

  const t0 = performance.now();

  const results: boolean[] = [];
  const failingIds: number[] = [];

  for (const item of EXAM66) {
    const result = answerQuestion(table, item.question);

    let pass = false;
    if (result.status === "ANSWER") {
      const answerMatch = normalizeWs(result.answer) === normalizeWs(item.expectedAnswer);

      const actualKeys = new Set<string>(
        result.evidence.map((ev) => `${ev.row}:${ev.col}`)
      );
      const expectedKeys = new Set<string>(
        item.expectedEvidence.map((ev) => `${ev.row}:${ev.col}`)
      );

      const evidenceMatch =
        actualKeys.size === expectedKeys.size &&
        [...expectedKeys].every((k) => actualKeys.has(k));

      pass = answerMatch && evidenceMatch;
    }

    results.push(pass);
    if (!pass) failingIds.push(item.id);
  }

  const t1 = performance.now();
  const elapsed = t1 - t0;
  const passed = results.filter(Boolean).length;

  verifyResult.innerHTML = "";
  verifyResult.classList.remove("hidden");

  const summaryEl = document.createElement("div");
  summaryEl.className = "verify-summary";
  const passedSpan = document.createElement("span");
  passedSpan.className = passed === 66 ? "vpass" : "vfail";
  passedSpan.textContent = `${passed}/66 passed`;
  summaryEl.appendChild(passedSpan);
  verifyResult.appendChild(summaryEl);

  const elapsedEl = document.createElement("div");
  elapsedEl.className = "verify-elapsed";
  elapsedEl.textContent = `measured in ${elapsed.toFixed(1)} ms`;
  verifyResult.appendChild(elapsedEl);

  const dotsEl = document.createElement("div");
  dotsEl.className = "verify-dots";
  for (const pass of results) {
    const dot = document.createElement("span");
    dot.className = `vdot ${pass ? "pass" : "fail"}`;
    dot.title = pass ? "pass" : "fail";
    dotsEl.appendChild(dot);
  }
  verifyResult.appendChild(dotsEl);

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

if (new URLSearchParams(window.location.search).get("verify") === "1") {
  runVerification();
}

// ---------------------------------------------------------------------------
// Loader — drop zone, file chooser, restore built-in
// ---------------------------------------------------------------------------

const dropZone = document.getElementById("drop-zone") as HTMLDivElement;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const loadNotice = document.getElementById("load-notice") as HTMLDivElement;
const restoreBtn = document.getElementById("restore-btn") as HTMLButtonElement;

function showLoadNotice(cls: "load-ok" | "load-error", message: string): void {
  loadNotice.className = `load-notice ${cls}`;
  loadNotice.textContent = message;
  loadNotice.classList.remove("hidden");
}

function activateCustomLedger(newTable: LedgerTable, fileName: string): void {
  table = newTable;
  isCustomLedger = true;

  updateHeaderReadouts();
  renderGrid();
  clearAnswerCard();

  showLoadNotice(
    "load-ok",
    `Custom ledger loaded: ${newTable.rows.length} rows from ${fileName}.`
  );
  restoreBtn.classList.remove("hidden");
  setVerifyAvailable(false);
}

function restoreBuiltIn(): void {
  table = BUILT_IN_TABLE;
  isCustomLedger = false;

  updateHeaderReadouts();
  renderGrid();
  clearAnswerCard();

  loadNotice.classList.add("hidden");
  restoreBtn.classList.add("hidden");
  setVerifyAvailable(true);

  // Reset file input so the same file can be reloaded if desired
  fileInput.value = "";
}

async function handleFile(file: File): Promise<void> {
  const name = file.name;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const delimiter = ext === "tsv" ? "\t" : ",";

  let text: string;
  try {
    text = await file.text();
  } catch (e) {
    showLoadNotice("load-error", `File rejected — could not read file: ${(e as Error).message}`);
    return;
  }

  let newTable: LedgerTable;
  try {
    newTable = ledgerFromDelimitedText(text, delimiter);
  } catch (e) {
    showLoadNotice("load-error", (e as Error).message);
    return;
  }

  activateCustomLedger(newTable, name);
}

// Click on drop zone opens the file chooser
dropZone.addEventListener("click", () => {
  fileInput.click();
});

// File chooser selection
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) void handleFile(file);
});

// Drag-over highlight
dropZone.addEventListener("dragover", (e: DragEvent) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e: DragEvent) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer?.files[0];
  if (file) void handleFile(file);
});

// Restore built-in ledger
restoreBtn.addEventListener("click", restoreBuiltIn);
