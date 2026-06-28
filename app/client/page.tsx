'use client';

import { useCallback, useEffect, useState } from 'react';
import { BeamsBackground } from '@/components/ui/beams-background';
import { SplitLoginCard } from '@/components/ui/split-login-card';
import { Check, X, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  signInClient,
  signOut,
  getMyClient,
  getClientRoster,
  getClientWeekLogs,
  reviewDay,
  subscribeClientLogs,
  parisNow,
  type Client,
  type Worker,
  type DailyLog,
  type LogStatus,
} from '@/lib/queries';
import { isWeekendDate, computeWeekPay } from '@/lib/pay';
import { downloadPayrollXlsx } from '@/lib/export';

function last7ParisDays(): string[] {
  const today = parisNow();
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.toLocaleDateString('en-CA'));
  }
  return out;
}

function fmtDayShort(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

const STATUS_BOX: Record<LogStatus, string> = {
  pending: 'border-amber-300 bg-amber-600',
  confirmed: 'border-emerald-300 bg-emerald-600',
  refused: 'border-red-300 bg-red-600',
};

export default function ClientReviewPage() {
  const [phase, setPhase] = useState<'loading' | 'signed-out' | 'ready'>('loading');
  const [client, setClient] = useState<Client | null>(null);
  const [roster, setRoster] = useState<Worker[]>([]);
  const [logs, setLogs] = useState<(DailyLog & { worker: { name: string } })[]>([]);
  const [openCell, setOpenCell] = useState<string | null>(null); // log id with refuse box open
  const [remark, setRemark] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [justUpdated, setJustUpdated] = useState<string | null>(null); // log id that just changed, for a flash

  const load = useCallback(async () => {
    const c = await getMyClient();
    if (!c) {
      setPhase('signed-out');
      return;
    }
    const [r, l] = await Promise.all([getClientRoster(), getClientWeekLogs()]);
    setClient(c);
    setRoster(r);
    setLogs(l);
    setPhase('ready');
  }, []);

  useEffect(() => {
    load();
    const { data } = supabase.auth.onAuthStateChange(() => load());
    return () => data.subscription.unsubscribe();
  }, [load]);

  // Live: re-pull the moment any worker submits/edits a log for this client.
  useEffect(() => {
    if (!client) return;
    const unsubscribe = subscribeClientLogs(client.id, async () => {
      const l = await getClientWeekLogs();
      setLogs(l);
      setJustUpdated('pulse');
      setTimeout(() => setJustUpdated(null), 1200);
    });
    return unsubscribe;
  }, [client]);

  async function handleSignIn(email: string, password: string) {
    const { error } = await signInClient(email, password);
    if (error) return 'Wrong email or password.';
    await load();
    return null;
  }

  async function confirm(id: string) {
    setBusyId(id);
    await reviewDay(id, true);
    setBusyId(null);
  }

  async function refuse(id: string) {
    setBusyId(id);
    await reviewDay(id, false, remark);
    setOpenCell(null);
    setRemark('');
    setBusyId(null);
  }

  const [exporting, setExporting] = useState(false);
  async function exportPayroll() {
    if (!client || exporting) return;
    setExporting(true);
    try {
      const d = last7ParisDays();
      await downloadPayrollXlsx(client, roster, logs, `${d[0]} → ${d[d.length - 1]}`);
    } finally {
      setExporting(false);
    }
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
            accent="green"
            title="Client space"
            subtitle="Live hours for every assigned worker — review, confirm, or refuse."
            idLabel="Email"
            idType="email"
            idPlaceholder="you@example.com"
            onSubmit={handleSignIn}
          />
        </div>
      </BeamsBackground>
    );
  }

  const days = last7ParisDays();
  const logByWorkerDay = new Map<string, DailyLog & { worker: { name: string } }>();
  for (const l of logs) logByWorkerDay.set(`${l.worker_id}_${l.log_date}`, l);

  const pendingCount = logs.filter((l) => l.status === 'pending').length;

  return (
    <BeamsBackground intensity="medium">
      <div className="login-glow-border login-glow-border--green w-full max-w-5xl mx-auto px-4">
        <div className="login-glow-inner p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h1 className="text-xl font-semibold text-white mb-1">{client?.name}</h1>
              <p className="text-sm text-zinc-400">
                {roster.length} worker{roster.length === 1 ? '' : 's'} ·{' '}
                {pendingCount > 0 ? `${pendingCount} pending review` : 'all reviewed'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-1.5 text-xs text-zinc-500 transition-opacity ${justUpdated ? 'opacity-100' : 'opacity-0'}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> updated
              </span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> live
              </span>
              <button
                onClick={exportPayroll}
                disabled={exporting}
                className="flex items-center gap-1.5 rounded-lg border-2 border-emerald-400 bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> {exporting ? 'Preparing…' : 'Download payroll (Excel)'}
              </button>
              <button
                onClick={() => signOut()}
                className="text-xs text-zinc-400 underline underline-offset-4 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border-2 border-zinc-700 bg-zinc-950 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-700">
                  <th className="text-left text-xs font-medium text-zinc-400 px-3 py-2.5 sticky left-0 bg-zinc-950">
                    Worker
                  </th>
                  {days.map((d) => (
                    <th key={d} className="text-center text-xs font-medium text-zinc-400 px-2 py-2.5 min-w-[84px]">
                      {fmtDayShort(d)}
                      {isWeekendDate(d) && <span className="text-sky-400"> +25%</span>}
                    </th>
                  ))}
                  <th className="text-center text-xs font-medium text-zinc-400 px-3 py-2.5">Week</th>
                  <th className="text-center text-xs font-medium text-zinc-400 px-3 py-2.5">Pay</th>
                </tr>
              </thead>
              <tbody>
              {roster.map((w) => {
                const weekLogs = days
                  .map((d) => logByWorkerDay.get(`${w.id}_${d}`))
                  .filter((l): l is DailyLog & { worker: { name: string } } => !!l);
                const weekTotal = weekLogs.reduce((s, l) => s + l.hours_worked, 0);
                const pay = client ? computeWeekPay(weekLogs, client.hourly_rate) : null;

                return (
                  <tr key={w.id} className="border-b border-zinc-700/60 last:border-0">
                    <td className="px-3 py-2 sticky left-0 bg-zinc-950">
                      <div className="text-white font-medium whitespace-nowrap">{w.name}</div>
                      <div className="text-xs text-zinc-500">{w.worker_code}</div>
                    </td>
                    {days.map((d) => {
                      const log = logByWorkerDay.get(`${w.id}_${d}`);
                      if (!log) {
                        return (
                          <td key={d} className="px-1.5 py-1.5">
                            <div className="rounded-lg border-2 border-zinc-700 bg-zinc-900 py-1.5 text-center text-zinc-600">
                              —
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td key={d} className="px-1.5 py-1.5">
                          <div className={`rounded-lg border-2 px-1.5 py-1 text-center shadow-md ${STATUS_BOX[log.status]}`}>
                            <div className="text-white text-sm font-semibold">{log.hours_worked}h</div>
                            {log.night_hours > 0 && (
                              <div className="text-[10px] text-white/80">{log.night_hours}h night</div>
                            )}
                            {log.worker_comment && (
                              <div className="text-[10px] text-white/70 truncate" title={log.worker_comment}>
                                “{log.worker_comment}”
                              </div>
                            )}

                            {log.status === 'pending' ? (
                              openCell === log.id ? (
                                <div className="mt-1.5 space-y-1">
                                  <input
                                    autoFocus
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    placeholder="Reason"
                                    className="w-full rounded border-2 border-amber-300 bg-amber-700 px-1 py-0.5 text-[10px] text-white placeholder-white/60 outline-none"
                                  />
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => refuse(log.id)}
                                      disabled={busyId === log.id}
                                      className="flex-1 rounded bg-red-600 border-2 border-red-300 text-white font-semibold text-[10px] py-0.5 hover:bg-red-500 disabled:opacity-50"
                                    >
                                      Refuse
                                    </button>
                                    <button
                                      onClick={() => setOpenCell(null)}
                                      className="rounded border-2 border-white/40 text-white text-[10px] px-1.5 py-0.5 hover:bg-white/10"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-1.5 flex justify-center gap-1.5">
                                  <button
                                    onClick={() => confirm(log.id)}
                                    disabled={busyId === log.id}
                                    aria-label="Confirm"
                                    className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenCell(log.id);
                                      setRemark('');
                                    }}
                                    disabled={busyId === log.id}
                                    aria-label="Refuse"
                                    className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-red-300 bg-red-600 text-white hover:bg-red-500 active:scale-95 disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )
                            ) : (
                              <div className="text-[10px] font-bold text-white mt-0.5 uppercase tracking-wide">
                                {log.status}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-2 text-white font-medium whitespace-nowrap">
                      {weekTotal}h
                    </td>
                    <td className="text-center px-3 py-2 text-emerald-400 font-medium whitespace-nowrap">
                      {pay ? `€${pay.pay.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                );
              })}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={days.length + 3} className="text-center text-zinc-500 text-sm py-6">
                    No workers assigned yet.
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BeamsBackground>
  );
}
