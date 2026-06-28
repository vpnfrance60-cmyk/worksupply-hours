'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SplitLoginCardProps {
  /** Returns an error message to show, or null on success. */
  onSubmit: (identifier: string, password: string) => Promise<string | null>;
  title?: string;
  subtitle?: string;
  idLabel?: string;
  idPlaceholder?: string;
  idType?: 'text' | 'email';
  accent?: 'blue' | 'green';
}

const ACCENT = {
  blue: {
    border: '',
    panel: 'bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700',
    orb2: 'bg-blue-900/30',
    subtitle: 'text-sky-100/90',
    focus: 'focus:border-sky-500',
    button: 'bg-sky-500 hover:bg-sky-400',
  },
  green: {
    border: 'login-glow-border--green',
    panel: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700',
    orb2: 'bg-green-900/30',
    subtitle: 'text-emerald-100/90',
    focus: 'focus:border-emerald-500',
    button: 'bg-emerald-500 hover:bg-emerald-400',
  },
} as const;

export function SplitLoginCard({
  onSubmit,
  title = 'Welcome back',
  subtitle = 'Sign in to log your hours and track day-by-day confirmations.',
  idLabel = 'ID',
  idPlaceholder = 'Worker ID',
  idType = 'text',
  accent = 'blue',
}: SplitLoginCardProps) {
  const theme = ACCENT[accent];
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const err = await onSubmit(identifier.trim(), password);
    if (err) {
      setError(err);
      setBusy(false);
    }
    // on success the parent unmounts this card, so no need to reset busy
  }

  return (
    <div className={cn('login-glow-border w-full max-w-3xl mx-auto', theme.border)}>
      <div className="login-glow-inner flex flex-col md:flex-row overflow-hidden">
        {/* Left: accent panel with animated logo */}
        <div className={cn('relative md:w-1/2 flex flex-col items-center justify-center p-8 overflow-hidden', theme.panel)}>
          <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className={cn('pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full blur-2xl', theme.orb2)} />

          <div className="login-logo-wrap relative z-10 mb-5 flex items-center justify-center">
            <div className="login-halo absolute h-32 w-32 rounded-full" />
            <Image
              src="/logo-transparent.png"
              alt="WorkSupply"
              width={180}
              height={64}
              priority
              className="login-logo relative"
            />
          </div>

          <h2 className="relative z-10 text-2xl font-bold text-white mb-2 text-center">{title}</h2>
          <p className={cn('relative z-10 text-sm text-center max-w-xs', theme.subtitle)}>{subtitle}</p>
        </div>

        {/* Right: sign-in form */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center bg-zinc-900">
          <h3 className="text-xl font-semibold text-white mb-1">Sign in</h3>
          <p className="text-sm text-zinc-400 mb-6">Enter your {idLabel.toLowerCase()} and password.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="login-id" className="block text-sm font-medium text-zinc-300 mb-1.5">
                {idLabel}
              </label>
              <input
                id="login-id"
                type={idType}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={idPlaceholder}
                autoComplete="username"
                className={cn(
                  'w-full rounded-lg border-2 border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition',
                  theme.focus
                )}
              />
            </div>

            <div>
              <label htmlFor="login-pw" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                id="login-pw"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(
                  'w-full rounded-lg border-2 border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition',
                  theme.focus
                )}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={busy || !identifier.trim() || !password}
              className={cn(
                'mt-2 w-full rounded-lg text-white py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
                theme.button
              )}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
