// Checker tooling: serve web/ locally, load the page in headless Chrome,
// dump the rendered DOM (with ?verify=1 auto-run) to a file.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const proj = 'D:\\Chronica\\kiroween\\stitched-ledger';
const web = path.join(proj, 'web');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.join(web, rel);
  if (!file.startsWith(web) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((r) => server.listen(8931, '127.0.0.1', r));

const url = process.argv[2] || 'http://127.0.0.1:8931/index.html?verify=1';
const outFile = process.argv[3] || path.join(proj, 'session-logs', 'browser-dom.html');

const child = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--user-data-dir=' + path.join(proj, 'session-logs', 'chrome-profile'),
  '--dump-dom', '--virtual-time-budget=10000', url,
], { stdio: ['ignore', 'pipe', 'pipe'] });

let out = '', err = '';
child.stdout.on('data', (d) => (out += d));
child.stderr.on('data', (d) => (err += d));
const code = await new Promise((r) => child.on('close', r));
server.close();

fs.writeFileSync(outFile, out, 'utf-8');
console.log('chrome exit=' + code + ' domLength=' + out.length);
if (err.trim()) console.log('stderr head: ' + err.trim().split('\n').slice(0, 3).join(' | '));
const m1 = out.match(/(\d+)\/66 passed/);
const m2 = out.match(/measured in ([\d.]+) ms/);
console.log('verifySummary=' + (m1 ? m1[0] : 'NOT FOUND'));
console.log('verifyElapsed=' + (m2 ? m2[0] : 'NOT FOUND'));
console.log('hasRow48=' + out.includes('Row 48') + ' hasSulfuric=' + out.includes('Sulfuric Acid'));
