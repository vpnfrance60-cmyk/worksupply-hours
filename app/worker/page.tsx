'use client';

import { useCallback, useEffect, useState } from 'react';
import { BeamsBackground } from '@/components/ui/beams-background';
import { GlowingShadow } from '@/components/ui/glowing-shadow';
import { HourStepper } from '@/components/ui/hour-stepper';
import { SplitLoginCard } from '@/components/ui/split-login-card';
import { supabase } from '@/lib/supabase';
import {
  signInWorker,
  signOut,
  getMyWorker,
  getWorkerClient,
  getMyWeekLogs,
  submitTodayHours,
  isSubmissionOpen,
  parisToday,
  parisNow,
  type Worker,
  type Client,
  type DailyLog,
  type LogStatus,
} from '@/lib/queries';
import { computeWeekPay, isWeekendDate } from '@/lib/pay';
import { useLang, dateLocale } from '@/lib/i18n';

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

function fmtDay(iso: string, locale: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(locale, {
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

export default function WorkerPage() {
  const { t, lang } = useLang();
  const [phase, setPhase] = useState<'loading' | 'signed-out' | 'ready'>('loading');
  const [worker, setWorker] = useState<Worker | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);

  const [total, setTotal] = useState('');
  const [night, setNight] = useState('');
  const [comment, setComment] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitOk, setSubmitOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const w = await getMyWorker();
    if (!w) {
      setPhase('signed-out');
      return;
    }
    const [c, wk] = await Promise.all([getWorkerClient(w.client_id), getMyWeekLogs()]);
    setWorker(w);
    setClient(c);
    setLogs(wk);
    const todayLog = wk.find((l) => l.log_date === parisToday());
    setTotal(todayLog ? String(todayLog.hours_worked) : '');
    setNight(todayLog ? String(todayLog.night_hours) : '');
    setComment(todayLog?.worker_comment ?? '');
    setPhase('ready');
  }, []);

  useEffect(() => {
    load();
    const { data } = supabase.auth.onAuthStateChange(() => load());
    return () => data.subscription.unsubscribe();
  }, [load]);

  async function handleSignIn(id: string, password: string) {
    const { error } = await signInWorker(id, password);
    if (error) return t.login.workerError;
    await load();
    return null;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitMsg('');
    const hoursVal = parseFloat(total) || 0;
    const n = parseFloat(night) || 0;
    const { error } = await submitTodayHours(hoursVal, n, comment);
    if (error) {
      setSubmitOk(false);
      setSubmitMsg(
        error.message.includes('18:00') ? t.worker.submissionWindowError : error.message
      );
    } else {
      setSubmitOk(true);
      setSubmitMsg(t.worker.saved);
      await load();
    }
    setSubmitting(false);
  }

  if (phase === 'loading') {
    return (
      <BeamsBackground intensity="subtle">
        <p className="text-zinc-400 text-sm">{t.common.loading}</p>
      </BeamsBackground>
    );
  }

  if (phase === 'signed-out') {
    return (
      <BeamsBackground intensity="medium">
        <div className="w-full px-4 flex justify-center">
          <SplitLoginCard onSubmit={handleSignIn} />
        </div>
      </BeamsBackground>
    );
  }

  const today = parisToday();
  const days = last7ParisDays();
  const byDate = new Map(logs.map((l) => [l.log_date, l]));
  const todayLog = byDate.get(today);
  const windowOpen = isSubmissionOpen();
  const editableToday = windowOpen && (!todayLog || todayLog.status === 'pending');
  const pay = client ? computeWeekPay(logs, client.hourly_rate) : null;
  const yLog = byDate.get(days[days.length - 2]);

  return (
    <BeamsBackground intensity="medium">
      <div className="w-full px-4 flex justify-center">
        <GlowingShadow width="94vw">
          <div className="w-full px-2">
            {/* header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-zinc-400">
                  {t.worker.hi} <span className="text-white font-medium">{worker?.name}</span>
                </p>
                <h1 className="text-lg font-semibold text-white">{t.worker.eggCollection}</h1>
                <p className="text-xs text-zinc-500">{t.worker.forClient} {client?.name}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="text-xs text-zinc-400 underline underline-offset-4 hover:text-white"
              >
                {t.common.signOut}
              </button>
            </div>

            {yLog && (
              <p className="text-xs text-zinc-500 mb-3">
                {t.worker.yesterday} <span className="text-zinc-300">{yLog.hours_worked}h</span> · {t.status[yLog.status]}
              </p>
            )}

            {/* TODAY */}
            <div className="rounded-lg border-2 border-sky-500/40 bg-sky-500/5 p-3 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  {t.worker.today} · {fmtDay(today, dateLocale(lang))}
                  {isWeekendDate(today) && <span className="text-sky-400 text-xs"> · +25%</span>}
                </span>
                {todayLog && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[todayLog.status]}`}>
                    {t.status[todayLog.status]}
                  </span>
                )}
              </div>

              {editableToday ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{t.worker.hoursWorked}</span>
                    <HourStepper value={total} onChange={setTotal} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">{t.worker.ofWhichAfter6pm}</span>
                    <HourStepper size="sm" value={night} onChange={setNight} />
                  </div>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.worker.commentPlaceholder}
                    className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
                  />
                  {submitMsg && (
                    <p className={`text-xs ${submitOk ? 'text-emerald-400' : 'text-red-400'}`}>
                      {submitMsg}
                    </p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || (parseFloat(total) || 0) === 0}
                    className="w-full rounded-lg bg-sky-500 text-white py-2 text-sm font-semibold transition hover:bg-sky-400 disabled:opacity-50"
                  >
                    {submitting ? t.worker.saving : todayLog ? t.worker.updateHours : t.worker.submitHours}
                  </button>
                </div>
              ) : todayLog ? (
                <p className="text-sm text-zinc-300">
                  {todayLog.hours_worked}h {t.worker.submitted}
                  {todayLog.night_hours > 0 ? ` (${todayLog.night_hours}h ${t.worker.afterSixPm})` : ''}.
                  {todayLog.client_comment ? ` ${t.worker.clientLabel} “${todayLog.client_comment}”` : ''}
                </p>
              ) : (
                <p className="text-sm text-zinc-400">{t.worker.windowClosed}</p>
              )}
            </div>

            {/* PAST DAYS */}
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{t.worker.thisWeek}</p>
            <div className="space-y-2">
              {days
                .slice()
                .reverse()
                .filter((d) => d !== today)
                .map((d) => {
                  const l = byDate.get(d);
                  return (
                    <div key={d} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-900/40 p-2">
                      <div>
                        <span className="text-sm text-zinc-300">{fmtDay(d, dateLocale(lang))}</span>
                        {isWeekendDate(d) && <span className="text-sky-400 text-xs"> · +25%</span>}
                        {l?.client_comment && (
                          <p className="text-xs text-zinc-500 mt-0.5">“{l.client_comment}”</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{l ? `${l.hours_worked}h` : '—'}</span>
                        {l && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[l.status]}`}>
                            {t.status[l.status]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* PAY SUMMARY */}
            {pay && (
              <div className="border-t-2 border-zinc-700 mt-4 pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">{t.worker.totalThisWeek}</span>
                  <span className="text-white font-semibold">{pay.totalHours}h</span>
                </div>
                {pay.premiumHours > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">{t.worker.premiumHoursLabel}</span>
                    <span className="text-sky-400">{pay.premiumHours}h</span>
                  </div>
                )}
                {pay.weekly25Hours > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">{t.worker.weekly25Label}</span>
                    <span className="text-sky-400">{pay.weekly25Hours}h</span>
                  </div>
                )}
                {pay.weekly50Hours > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">{t.worker.weekly50Label}</span>
                    <span className="text-amber-400">{pay.weekly50Hours}h</span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-400">{t.worker.estimatedPay}</span>
                  <span className="text-emerald-400 font-semibold">€{pay.pay.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </GlowingShadow>
      </div>
    </BeamsBackground>
  );
}
