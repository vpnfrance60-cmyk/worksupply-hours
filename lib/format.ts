/**
 * Formats decimal hours as "7h15" (7 h 15 min). Whole hours drop the minutes
 * ("7h"); minutes are always zero-padded to two digits ("7h05").
 */
export function formatHours(decimalHours: number): string {
  const totalMin = Math.round((Number(decimalHours) || 0) * 60);
  const sign = totalMin < 0 ? '-' : '';
  const abs = Math.abs(totalMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `${sign}${h}h` : `${sign}${h}h${String(m).padStart(2, '0')}`;
}
