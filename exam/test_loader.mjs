// Checker test for the loader conversion (web/ui/loader.js) — NOT product code.
import { ledgerFromDelimitedText } from '../web/ui/loader.js';
import { answerQuestion } from '../web/index.js';

const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, detail: String(e && e.message || e) }); }
}
function eq(a, b, what) { if (a !== b) throw new Error(what + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }

const csv = [
  'name,type,location,role,quantity,unit,hazard,links',
  'Moon Fern,Specimen,Greenhouse,Photosynthesis research,14,plants,None,Nightshade',
  'Nightshade,Specimen,Greenhouse,Alkaloid source,9,plants,Class 2,Moon Fern',
  'Brass Telescope,Instrument,Observatory,Star charting,1,units,None,',
].join('\n');

let t;
check('valid CSV loads (3 rows)', () => { t = ledgerFromDelimitedText(csv, ','); eq(t.rows.length, 3, 'rows'); });
check('retrieval on custom table (T1)', () => {
  const r = answerQuestion(t, 'Where is Moon Fern located?');
  eq(r.status, 'ANSWER', 'status'); eq(r.answer, 'Greenhouse', 'answer');
  eq(JSON.stringify(r.evidence), JSON.stringify([{ row: 1, col: 'location' }]), 'evidence');
});
check('count on custom table (T6)', () => {
  const r = answerQuestion(t, 'How many items are located in Greenhouse?');
  eq(r.status, 'ANSWER', 'status'); eq(r.answer, '2', 'answer');
});
check('trap abstains on custom table', () => {
  const r = answerQuestion(t, 'Where is the Invisible Ink located?');
  eq(r.status, 'ABSTAIN', 'status'); eq(r.message, '기록에 없음', 'message');
});
check('TSV loads', () => {
  const tsv = csv.split('\n').map((l) => l.replace(/,/g, '\t')).join('\n');
  const tt = ledgerFromDelimitedText(tsv, '\t'); eq(tt.rows.length, 3, 'rows');
});
check('quoted CSV field with comma loads', () => {
  const q = 'name,type,location,role,quantity,unit,hazard,links\n"Odd, Widget",Tool,Bench,"Repairs, general",2,units,None,';
  const tq = ledgerFromDelimitedText(q, ',');
  eq(tq.rows[0].data.name, 'Odd, Widget', 'name'); eq(tq.rows[0].data.role, 'Repairs, general', 'role');
});
check('reject: missing column', () => {
  const bad = 'name,type,location,role,quantity,unit,links\nX,Tool,Bench,Fix,1,units,';
  try { ledgerFromDelimitedText(bad, ','); } catch (e) { if (/hazard/.test(e.message)) return; throw new Error('wrong reason: ' + e.message); }
  throw new Error('did not throw');
});
check('reject: wrong field count', () => {
  const bad = 'name,type,location,role,quantity,unit,hazard,links\nX,Tool,Bench,Fix,1,units,None';
  try { ledgerFromDelimitedText(bad, ','); } catch (e) { if (/fields/.test(e.message)) return; throw new Error('wrong reason: ' + e.message); }
  throw new Error('did not throw');
});
check('reject: non-numeric quantity', () => {
  const bad = 'name,type,location,role,quantity,unit,hazard,links\nX,Tool,Bench,Fix,many,units,None,';
  try { ledgerFromDelimitedText(bad, ','); } catch (e) { if (/quantity/.test(e.message)) return; throw new Error('wrong reason: ' + e.message); }
  throw new Error('did not throw');
});
check('reject: header only, no data rows', () => {
  const bad = 'name,type,location,role,quantity,unit,hazard,links';
  try { ledgerFromDelimitedText(bad, ','); } catch (e) { if (/no data rows/.test(e.message)) return; throw new Error('wrong reason: ' + e.message); }
  throw new Error('did not throw');
});

const passed = results.filter((r) => r.ok).length;
console.log(JSON.stringify({ loaderTests: passed + '/' + results.length, results }, null, 1));
