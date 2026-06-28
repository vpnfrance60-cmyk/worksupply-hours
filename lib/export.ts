import ExcelJS from 'exceljs';
import type { Client, DailyLog, Worker } from './queries';
import { computeWeekPay } from './pay';
import type { Dict, Lang } from './i18n';

type PayLabels = Dict['pay'];
type StatusLabels = Dict['status'];

/**
 * Builds a formatted payroll workbook for the current week (pure — works in
 * both browser and Node). Only CONFIRMED hours are paid — pending/refused days
 * are excluded from the totals but listed separately so nothing disappears.
 */
export function buildPayrollWorkbook(
  client: Client,
  roster: Worker[],
  logs: (DailyLog & { worker: { name: string } })[],
  weekRangeLabel: string,
  pay: PayLabels,
  status: StatusLabels
): ExcelJS.Workbook {
  const logsByWorker = new Map<string, DailyLog[]>();
  for (const l of logs) {
    if (!logsByWorker.has(l.worker_id)) logsByWorker.set(l.worker_id, []);
    logsByWorker.get(l.worker_id)!.push(l);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(pay.payroll, {
    views: [{ state: 'frozen', ySplit: 6 }], // keep header visible while scrolling
  });

  const COLS = [
    { key: 'worker', header: pay.worker, width: 24 },
    { key: 'nif', header: pay.nif, width: 13 },
    { key: 'hours', header: pay.confirmedHours, width: 16 },
    { key: 'night', header: pay.nightHours, width: 18 },
    { key: 'weekend', header: pay.weekendHours, width: 20 },
    { key: 'ot25', header: pay.overtime25, width: 22 },
    { key: 'ot50', header: pay.overtime50, width: 22 },
    { key: 'pay', header: pay.payEur, width: 14 },
    { key: 'excluded', header: pay.excludedCol, width: 34 },
  ];
  ws.columns = COLS.map((c) => ({ key: c.key, width: c.width }));

  const lastCol = COLS.length; // 9

  // ── Title block ────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = `${pay.payroll} — ${client.name}`;
  title.font = { size: 15, bold: true };

  ws.mergeCells(2, 1, 2, lastCol);
  ws.getCell(2, 1).value = `${pay.week}: ${weekRangeLabel}`;
  ws.getCell(2, 1).font = { color: { argb: 'FF666666' } };

  ws.mergeCells(3, 1, 3, lastCol);
  ws.getCell(3, 1).value = `${pay.hourlyRate}: €${client.hourly_rate.toFixed(2)}`;
  ws.getCell(3, 1).font = { color: { argb: 'FF666666' } };

  // ── Header row (row 5) ─────────────────────────────────────────────
  const headerRow = ws.getRow(5);
  COLS.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    cell.alignment = { vertical: 'middle', horizontal: i <= 1 ? 'left' : 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFBBBBBB' } } };
  });
  headerRow.height = 30;

  // ── Data rows ──────────────────────────────────────────────────────
  let totalPay = 0;
  let totalHours = 0;
  let r = 6;

  for (const w of roster) {
    const allLogs = logsByWorker.get(w.id) ?? [];
    const confirmed = allLogs.filter((l) => l.status === 'confirmed');
    const excluded = allLogs.filter((l) => l.status !== 'confirmed');
    const weekPay = computeWeekPay(confirmed, client.hourly_rate);
    const nightHours = confirmed.reduce((s, l) => s + Math.min(l.night_hours, l.hours_worked), 0);
    const weekendHours = confirmed
      .filter((l) => {
        const day = new Date(l.log_date + 'T00:00:00').getDay();
        return day === 0 || day === 6;
      })
      .reduce((s, l) => s + l.hours_worked, 0);

    totalPay += weekPay.pay;
    totalHours += weekPay.totalHours;

    const row = ws.getRow(r);
    row.getCell(1).value = w.name;
    row.getCell(2).value = w.worker_code;
    row.getCell(3).value = weekPay.totalHours;
    row.getCell(4).value = nightHours;
    row.getCell(5).value = weekendHours;
    row.getCell(6).value = weekPay.weekly25Hours;
    row.getCell(7).value = weekPay.weekly50Hours;
    row.getCell(8).value = weekPay.pay;
    row.getCell(8).numFmt = '#,##0.00" €"';
    row.getCell(9).value = excluded
      .map((l) => `${l.log_date} (${status[l.status]}, ${l.hours_worked}h)`)
      .join('; ');

    for (let c = 3; c <= 8; c++) row.getCell(c).alignment = { horizontal: 'center' };
    // subtle zebra striping
    if ((r - 6) % 2 === 1) {
      for (let c = 1; c <= lastCol; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F4F5' } };
      }
    }
    r++;
  }

  // ── Total row ──────────────────────────────────────────────────────
  const totalRow = ws.getRow(r + 1);
  totalRow.getCell(1).value = pay.total;
  totalRow.getCell(3).value = totalHours;
  totalRow.getCell(8).value = totalPay;
  totalRow.getCell(8).numFmt = '#,##0.00" €"';
  for (let c = 1; c <= lastCol; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { bold: true };
    cell.border = { top: { style: 'medium', color: { argb: 'FF059669' } } };
    if (c >= 3 && c <= 8) cell.alignment = { horizontal: 'center' };
  }

  return wb;
}

/** Browser-only: build the workbook and trigger a download. */
export async function downloadPayrollXlsx(
  client: Client,
  roster: Worker[],
  logs: (DailyLog & { worker: { name: string } })[],
  weekRangeLabel: string,
  lang: Lang,
  payLabels: PayLabels,
  statusLabels: { pending: string; confirmed: string; refused: string }
) {
  const wb = buildPayrollWorkbook(client, roster, logs, weekRangeLabel, payLabels, statusLabels);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  a.href = url;
  a.download = `payroll-${safeName}-${weekRangeLabel.split(' ').pop()}-${lang}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
