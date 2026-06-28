'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export type ClientOption = { id: string; name: string };

interface ClientSelectorDropdownProps {
  clients: ClientOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export function ClientSelectorDropdown({
  clients,
  value,
  onChange,
  placeholder = 'Select client',
}: ClientSelectorDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = clients.find((c) => c.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-colors',
          'bg-zinc-900 border-zinc-600 hover:border-zinc-400'
        )}
      >
        <span className={selected ? 'text-white' : 'text-zinc-500'}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-zinc-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg',
            'bg-zinc-900 border-2 border-zinc-700 shadow-xl animate-fade-in'
          )}
        >
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => {
                onChange(client.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                value === client.id
                  ? 'font-semibold text-sky-400 bg-sky-500/10'
                  : 'text-zinc-200 hover:bg-zinc-800'
              )}
            >
              <span className="flex-1">{client.name}</span>
              {value === client.id && <Check className="h-4 w-4 text-sky-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
