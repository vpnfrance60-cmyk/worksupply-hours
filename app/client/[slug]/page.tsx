'use client';

import { useCallback, useEffect, useState } from 'react';
import { BeamsBackground } from '@/components/ui/beams-background';
import { SplitLoginCard } from '@/components/ui/split-login-card';
import { Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  signInClient,
  signOut,
  getMyClient,
  getClientWeekLogs,
  reviewDay,
  type Client,
  type DailyLog,
  type LogStatus,
} from '@/lib/queries';
import { isWeekendDate } from '@/lib/pay';

type Row = DailyLog & { worker: { name: string } };

function fmtDay(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const STATUS_BADGE: Record<LogStatus, string> = {
  pending: 'bg-amber-500 text-white',
  confirmed: 'bg-emerald-500 text-white',
  refused: 'bg-red-500 text-white',
};

export default function ClientReviewPage() {
  const [phase, setPhase] = useState<'loading' | 'signed-out' | 'ready'>('loading');
  const [client, setClient] = useState<Client | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [refuseId, setRefuseId] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const c = await getMyClient();
    if (!c) {
      setPhase('signed-out');
      return;
    }
    const r = await getClientWeekLogs();
    setClient(c);
    setRows(r);
    setPhase('ready');
  }, []);

  useEffect(() => {
    load();
    const { data } = supabase.auth.onAuthStateChange(() => load());
    return () => data.subscription.unsubscribe();
  }, [load]);

  async function handleSignIn(email: string, password: string) {
    const { error } = await signInClient(email, password);
    if (error) return 'Wrong email or password.';
    await load();
    return null;
  }

  async function confirm(id: string) {
    setBusyId(id);
    await reviewDay(id, true);
    await load();
    setBusyId(null);
  }

  async function refuse(id: string) {
    setBusyId(id);
    await reviewDay(id, false, remark);
    setRefuseId(null);
    setRemark('');
    await load();
    setBusyId(null);
  }

  if (phase === 'loading') {
    return (
      <BeamsBackground intensity="subtle">
        <p className="text-zinc-400 text-sm">Loading…</p>
      </BeamsBackground>
    );
  }

  if (phase === 'signed-out') {
    return (
      <BeamsBackground intensity="medium">
        <div className="w-full px-4 flex justify-center">
          <SplitLoginCard
            title="Client space"
            subtitle="Sign in to review and confirm your workers' hours."
            idLabel="Email"
            idType="email"
            idPlaceholder="you@example.com"
            onSubmit={handleSignIn}
          />
        </div>
      </BeamsBackground>
    );
  }

  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  return (
    <BeamsBackground intensity="medium">
      <div className="w-full max-w-2xl px-4">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">{client?.name} — hours review</h1>
            <p className="text-sm text-zinc-400">
              {rows.length === 0 ? 'No entries this week.' : `${pendingCount} pending review`}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-xs text-zinc-400 underline underline-offset-4 hover:text-white"
          >
            Sign out
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((log) => (
            <div key={log.id} className="widget-card rounded-xl border-2 border-zinc-700 bg-zinc-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{log.worker.name}</p>
                  <p className="text-sm text-zinc-400">
                    {fmtDay(log.log_date)}
                    {isWeekendDate(log.log_date) && <span className="text-sky-400"> · +25%</span>} ·{' '}
                    {log.hours_worked}h
                    {log.night_hours > 0 ? ` (${log.night_hours}h after 6 PM)` : ''}
                    {log.worker_comment ? ` — “${log.worker_comment}”` : ''}
                  </p>
                  {log.client_comment && (
                    <p className="text-xs text-red-300/80 mt-0.5">Your remark: “{log.client_comment}”</p>
                  )}
                </div>

                {log.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => confirm(log.id)}
                      disabled={busyId === log.id}
                      aria-label="Confirm"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-500/15 text-emerald-400 transition hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setRefuseId(refuseId === log.id ? null : log.id);
                        setRemark('');
                      }}
                      disabled={busyId === log.id}
                      aria-label="Refuse"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-red-500 bg-red-500/15 text-red-400 transition hover:bg-red-500/25 active:scale-95 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[log.status]}`}>
                    {log.status}
                  </span>
                )}
              </div>

              {refuseId === log.id && (
                <div className="mt-3 border-t-2 border-zinc-700 pt-3 flex gap-2">
                  <input
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Reason / remark (optional)"
                    className="flex-1 rounded-lg border-2 border-zinc-600 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-400"
                  />
                  <button
                    onClick={() => refuse(log.id)}
                    disabled={busyId === log.id}
                    className="rounded-lg bg-red-500 text-white text-sm font-semibold px-3 py-1.5 transition hover:bg-red-400 disabled:opacity-50"
                  >
                    Refuse
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </BeamsBackground>
  );
}
