// Checker tooling: drive headless Chrome via CDP against the LIVE page.
// Measures: verify-button click result+time (as rendered), ask flow
// (answer + trap), loader success/rejection/restore. Prints JSON.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const LIVE = process.argv[2];
const proj = 'D:\\Chronica\\kiroween\\stitched-ledger';
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const goodCsv = path.join(proj, 'session-logs', 'test-ledger.csv');
const badCsv = path.join(proj, 'session-logs', 'test-bad.csv');

const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=9224',
  '--user-data-dir=' + path.join(proj, 'session-logs', 'chrome-profile-cdp'),
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitJson(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {}
    await sleep(500);
  }
  throw new Error('CDP endpoint not ready: ' + url);
}

const out = {};
try {
  const targets = await waitJson('http://127.0.0.1:9224/json/list');
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let seq = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((res) => {
    const id = ++seq; pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result && r.result.result ? r.result.result.value : undefined;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Page.navigate', { url: LIVE });

  // wait for grid render (48 rows)
  let rows = 0;
  for (let i = 0; i < 40; i++) {
    rows = await evalJs("document.querySelectorAll('#ledger-tbody tr').length");
    if (rows === 48) break;
    await sleep(500);
  }
  out.gridRowsOnLoad = rows;
  out.headerRows = await evalJs("document.getElementById('stat-rows').textContent");

  // 1) real click on the verification button
  await evalJs("document.getElementById('verify-btn').click()");
  await sleep(400);
  out.verifyText = await evalJs("document.getElementById('verify-result').innerText.replace(/\\s+/g,' ').trim()");

  // 2) ask flow via sample chips: chip 1 (answer), chip 4 (trap)
  await evalJs("document.querySelectorAll('.chip[data-q]')[0].click()");
  await sleep(200);
  out.chipAnswer = await evalJs("document.getElementById('answer-card').innerText.replace(/\\s+/g,' ').trim()");
  out.evidenceCells = await evalJs("document.querySelectorAll('.evidence-cell').length");
  await evalJs("document.querySelectorAll('.chip[data-q]')[3].click()");
  await sleep(200);
  out.chipTrap = await evalJs("document.getElementById('answer-card').innerText.replace(/\\s+/g,' ').trim()");

  // helper for file loading via CDP
  const loadFile = async (file) => {
    const doc = await send('DOM.getDocument', {});
    const rootId = doc.result.root.nodeId;
    const q = await send('DOM.querySelector', { nodeId: rootId, selector: 'input[type="file"]' });
    await send('DOM.setFileInputFiles', { files: [file], nodeId: q.result.nodeId });
    await sleep(500);
  };

  // 3) loader: good CSV
  await loadFile(goodCsv);
  out.loadOkNotice = await evalJs("(document.querySelector('.load-notice')||{}).textContent || ''");
  out.gridRowsAfterLoad = await evalJs("document.querySelectorAll('#ledger-tbody tr').length");
  out.verifyDisabledOnCustom = await evalJs("document.getElementById('verify-btn').disabled");

  await evalJs("document.getElementById('question-input').value = 'Where is Moon Fern located?'");
  await evalJs("document.getElementById('ask-btn').click()");
  await sleep(200);
  out.customAnswer = await evalJs("document.getElementById('answer-card').innerText.replace(/\\s+/g,' ').trim()");

  await evalJs("document.getElementById('question-input').value = 'Where is the Invisible Ink located?'");
  await evalJs("document.getElementById('ask-btn').click()");
  await sleep(200);
  out.customTrap = await evalJs("document.getElementById('answer-card').innerText.replace(/\\s+/g,' ').trim()");

  // 4) loader: malformed CSV (missing hazard column)
  await loadFile(badCsv);
  out.loadBadNotice = await evalJs("(document.querySelector('.load-notice')||{}).textContent || ''");
  out.gridRowsAfterBad = await evalJs("document.querySelectorAll('#ledger-tbody tr').length");

  // 5) restore built-in
  await evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Restore built-in'))?.click()");
  await sleep(400);
  out.gridRowsAfterRestore = await evalJs("document.querySelectorAll('#ledger-tbody tr').length");
  out.verifyDisabledAfterRestore = await evalJs("document.getElementById('verify-btn').disabled");

  ws.close();
} finally {
  proc.kill();
}
console.log(JSON.stringify(out, null, 1));
