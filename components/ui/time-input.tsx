'use client';

import { cn } from '@/lib/utils';

interface TimeInputProps {
  /** Value in decimal hours, as a string (e.g. "7.25" = 7 h 15 min). '' = empty. */
  value: string;
  onChange: (value: string) => void;
  maxHours?: number;
  size?: 'sm' | 'md';
}

/**
 * Manual hours + minutes entry. The worker types the two fields directly;
 * they're combined into decimal hours (h + m/60, rounded to 2 dp) so the rest
 * of the app keeps working in decimal hours.
 */
export function TimeInput({ value, onChange, maxHours = 24, size = 'md' }: TimeInputProps) {
  const decimal = parseFloat(value) || 0;
  const hours = Math.floor(decimal + 1e-9);
  const minutes = Math.round((decimal - hours) * 60);
  const isSmall = size === 'sm';

  function emit(nextH: number, nextM: number) {
    let hh = Number.isFinite(nextH) ? Math.max(0, Math.min(maxHours, Math.trunc(nextH))) : 0;
    let mm = Number.isFinite(nextM) ? Math.max(0, Math.min(59, Math.trunc(nextM))) : 0;
    if (hh >= maxHours) mm = 0; // can't go past maxHours:00
    const dec = Math.round((hh + mm / 60) * 100) / 100;
    onChange(dec === 0 ? '' : String(dec));
  }

  const parseDigits = (s: string) => (s.trim() === '' ? NaN : parseInt(s.replace(/\D/g, ''), 10));

  const fieldCls = cn(
    'bg-transparent text-center font-medium text-white tabular-nums outline-none',
    isSmall ? 'text-xs w-6' : 'text-sm w-8'
  );
  const unitCls = cn('text-zinc-500 select-none', isSmall ? 'text-[10px]' : 'text-xs');

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-lg border-2 bg-zinc-900 px-2',
        isSmall ? 'border-zinc-700 h-7' : 'border-zinc-600 h-9'
      )}
    >
      <input
        inputMode="numeric"
        value={hours ? String(hours) : ''}
        onChange={(e) => emit(parseDigits(e.target.value), minutes)}
        placeholder="0"
        aria-label="Hours"
        className={fieldCls}
      />
      <span className={unitCls}>h</span>
      <input
        inputMode="numeric"
        value={minutes || hours ? String(minutes) : ''}
        onChange={(e) => emit(hours, parseDigits(e.target.value))}
        placeholder="00"
        aria-label="Minutes"
        className={fieldCls}
      />
      <span className={unitCls}>min</span>
    </div>
  );
}
