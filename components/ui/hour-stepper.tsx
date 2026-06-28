'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HourStepperProps {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function HourStepper({
  value,
  onChange,
  step = 0.5,
  min = 0,
  max = 24,
  size = 'md',
}: HourStepperProps) {
  const numeric = parseFloat(value) || 0;
  const isSmall = size === 'sm';

  function set(next: number) {
    const clamped = Math.min(max, Math.max(min, Math.round(next * 2) / 2));
    onChange(clamped === 0 ? '' : String(clamped));
  }

  return (
    <div
      className={cn(
        'flex items-center rounded-lg border-2 bg-zinc-900 overflow-hidden',
        isSmall ? 'border-zinc-700' : 'border-zinc-600'
      )}
    >
      <button
        type="button"
        onClick={() => set(numeric - step)}
        disabled={numeric <= min}
        className={cn(
          'flex items-center justify-center text-zinc-400 transition-colors hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent',
          isSmall ? 'h-7 w-7' : 'h-9 w-9'
        )}
      >
        <Minus className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </button>

      <span
        className={cn(
          'flex-1 text-center font-medium text-white tabular-nums',
          isSmall ? 'text-xs px-1' : 'text-sm px-2'
        )}
      >
        {numeric}h
      </span>

      <button
        type="button"
        onClick={() => set(numeric + step)}
        disabled={numeric >= max}
        className={cn(
          'flex items-center justify-center text-zinc-400 transition-colors hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent',
          isSmall ? 'h-7 w-7' : 'h-9 w-9'
        )}
      >
        <Plus className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </button>
    </div>
  );
}
