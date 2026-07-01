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
 * +25% with the weekly overtime tier. Hours are processed chronologically as
 * exact fractions (so entered minutes count) — each partial hour is split at
 * the weekly-band boundaries and gets the correct band.
 */
export function computeWeekPay(logs: DailyLog[], hourlyRate: number): PayBreakdown {
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  let cumHours = 0;
  let pay = 0;
  let totalHours = 0;
  let premiumHours = 0;
  let weekly25 = 0;
  let weekly50 = 0;

  // Add `hours` (may be fractional) of work at a given daily multiplier,
  // splitting the run across the weekly bands so minutes land correctly.
  const addHours = (hours: number, dailyMult: number) => {
    let remaining = hours;
    while (remaining > 1e-9) {
      const wMult = weeklyMultiplierAt(cumHours);
      const boundary =
        cumHours < WEEKLY_25_START ? WEEKLY_25_START
        : cumHours < WEEKLY_50_START ? WEEKLY_50_START
        : Infinity;
      const chunk = Math.min(remaining, boundary - cumHours);
      pay += hourlyRate * chunk * dailyMult * wMult;
      if (wMult === 1.5) weekly50 += chunk;
      else if (wMult === 1.25) weekly25 += chunk;
      if (dailyMult > 1) premiumHours += chunk;
      cumHours += chunk;
      remaining -= chunk;
    }
  };

  for (const log of sorted) {
    const total = log.hours_worked;
    const premium = isWeekendDate(log.log_date)
      ? total
      : Math.min(log.night_hours, total);
    addHours(total - premium, 1.0); // normal hours first
    addHours(premium, 1.25); // then daily-premium hours
    totalHours += total;
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    totalHours: round2(totalHours),
    premiumHours: round2(premiumHours),
    weekly25Hours: round2(weekly25),
    weekly50Hours: round2(weekly50),
    pay: round2(pay),
  };
}
