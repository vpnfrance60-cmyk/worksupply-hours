// Smoke test: confirms ExcelJS writes a real multi-column sheet (no CSV
// delimiter ambiguity) with the real DB data, then reparses it. Read-only.
//   node --env-file=.env.local scripts/verify-payroll.mjs
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: client } = await admin.from('clients').select('*').eq('slug', 'elsa-le-azalea').single();
const { data: roster } = await admin.from('workers').select('id,name,worker_code').eq('client_id', client.id).order('name');
const { data: logs } = await admin.from('daily_logs').select('*').eq('client_id', client.id).eq('status', 'confirmed');

const byWorker = new Map();
for (const l of logs) {
  if (!byWorker.has(l.worker_id)) byWorker.set(l.worker_id, []);
  byWorker.get(l.worker_id).push(l);
}

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Payroll');
ws.addRow(['Worker', 'NIF', 'Confirmed hours', 'Pay (€)']);
ws.getRow(1).font = { bold: true };
for (const w of roster) {
  const hrs = (byWorker.get(w.id) ?? []).reduce((s, l) => s + Number(l.hours_worked), 0);
  const cell = ws.addRow([w.name, w.worker_code, hrs, hrs * Number(client.hourly_rate)]).getCell(4);
  cell.numFmt = '#,##0.00" €"';
}

const file = join(tmpdir(), 'verify-payroll.xlsx');
await wb.xlsx.writeFile(file);

// Reparse to prove columns/values survived as a real spreadsheet.
const wb2 = new ExcelJS.Workbook();
await wb2.xlsx.readFile(file);
const ws2 = wb2.getWorksheet('Payroll');
console.log('Reparsed sheet — first 4 rows, columns A–D:');
for (let r = 1; r <= Math.min(4, ws2.rowCount); r++) {
  const row = ws2.getRow(r);
  console.log([1, 2, 3, 4].map((c) => JSON.stringify(row.getCell(c).value)).join('  |  '));
}
console.log(`\nHeader A1 bold: ${ws2.getRow(1).getCell(1).font?.bold === true}`);
console.log(`Pay cell D2 numeric: ${typeof ws2.getRow(2).getCell(4).value === 'number'} (value ${ws2.getRow(2).getCell(4).value})`);
console.log(`Total rows: ${ws2.rowCount} (1 header + ${roster.length} workers)`);
