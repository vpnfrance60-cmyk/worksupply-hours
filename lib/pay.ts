import type { DailyLog } from './queries';

// ── Pay rules (Elsa le Azalea / Egg collection) ──────────────────────
// Daily +25%: every hour on a weekend (Sat/Sun), and every hour worked
//   after 18:00 on a weekday (the "night_hours" portion).
// Weekly tiers on top: 0–35h ×1.0, 35–43h ×1.25, 43–48h ×1.50.
// The two STACK: a premium hour that also lands in the 43–48h band is
//   rate × 1.25 (daily) × 1.50 (weekly).

const WEEKLY_25_START = 35;
const WEEKLY_50_START = 43;

export function isWeekendDate(isoDate: string): boolean {
  const day = new Date(isoDate + 'T00:00:00').getDay();
  return day === 0 || day === 6;
}

function weeklyMultiplierAt(hoursBefore: number): number {
  if (hoursBefore >= WEEKLY_50_START) return 1.5;
  if (hoursBefore >= WEEKLY_25_START) return 1.25;
  return 1.0;
}

export type PayBreakdown = {
  totalHours: number;
  premiumHours: number; // hours that got the daily +25% (weekend / after-18:00)
  weekly25Hours: number; // hours that fell in the 35–43h weekly band
  weekly50Hours: number; // hours that fell in the 43–48h weekly band
  pay: number;
};

/**
 * Computes pay for a set of daily logs (one work-week), stacking the daily
 * +25% with the weekly overtime tier. Hours are processed chronologically in
 * 0.5h steps so each hour gets the correct weekly band.
 */
export function computeWeekPay(logs: DailyLog[], hourlyRate: number): PayBreakdown {
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  let cumHalves = 0;
  let pay = 0;
  let totalHours = 0;
  let premiumHours = 0;
  let weekly25 = 0;
  let weekly50 = 0;

  const step = (count: number, dailyMult: number) => {
    for (let i = 0; i < count; i++) {
      const wMult = weeklyMultiplierAt(cumHalves / 2);
      pay += hourlyRate * 0.5 * dailyMult * wMult;
      if (wMult === 1.5) weekly50 += 0.5;
      else if (wMult === 1.25) weekly25 += 0.5;
      if (dailyMult > 1) premiumHours += 0.5;
      cumHalves++;
    }
  };

  for (const log of sorted) {
    const totalHalves = Math.round(log.hours_worked * 2);
    const premiumHalves = isWeekendDate(log.log_date)
      ? totalHalves
      : Math.round(Math.min(log.night_hours, log.hours_worked) * 2);
    step(totalHalves - premiumHalves, 1.0); // normal hours first
    step(premiumHalves, 1.25); // then daily-premium hours
    totalHours += log.hours_worked;
  }

  return {
    totalHours,
    premiumHours,
    weekly25Hours: weekly25,
    weekly50Hours: weekly50,
    pay: Math.round(pay * 100) / 100,
  };
}
