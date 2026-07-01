import { supabase } from './supabase';

export type LogStatus = 'pending' | 'confirmed' | 'refused';

export type Worker = {
  id: string;
  name: string;
  worker_code: string;
  client_id: string;
};

export type Client = {
  id: string;
  name: string;
  slug: string;
  hourly_rate: number;
};

export type DailyLog = {
  id: string;
  worker_id: string;
  client_id: string;
  log_date: string; // 'YYYY-MM-DD'
  hours_worked: number;
  night_hours: number; // portion after 18:00 (gets +25%)
  worker_comment: string | null;
  status: LogStatus;
  client_comment: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

// Workers log in with their ID + password. Real auth needs an email, so we
// map the worker_code to a synthetic address (admin creates the auth user
// with this exact email). No table read needed before login → no leak.
const WORKER_EMAIL_DOMAIN = 'workers.worksupply.local';
export const workerEmail = (code: string) =>
  `${code.trim().toLowerCase()}@${WORKER_EMAIL_DOMAIN}`;

// ── "today" / window, using the same Europe/Paris business clock as the DB ──
export function parisNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
}
export function parisToday(): string {
  return parisNow().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
}
export function isSubmissionOpen(): boolean {
  return true; // TEST: submission window disabled — workers can submit any time of day
}

// ── Auth ────────────────────────────────────────────────────────────
export async function signInWorker(code: string, password: string) {
  return supabase.auth.signInWithPassword({ email: workerEmail(code), password });
}
export async function signInClient(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
}
export async function signOut() {
  return supabase.auth.signOut();
}

// ── Who am I ────────────────────────────────────────────────────────
// IMPORTANT: filter by the signed-in user's id explicitly. The workers RLS
// policy also lets a CLIENT read their workers' rows, so relying on RLS alone
// would resolve a client session to one of their worker rows.
export async function getMyWorker(): Promise<Worker | null> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return null;
  const { data } = await supabase
    .from('workers')
    .select('id, name, worker_code, client_id')
    .eq('user_id', uid)
    .maybeSingle();
  return data ?? null;
}
export async function getMyClient(): Promise<Client | null> {
  const { data } = await supabase
    .from('clients')
    .select('id, name, slug, hourly_rate')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .maybeSingle();
  return data ?? null;
}
export async function getWorkerClient(clientId: string): Promise<Client | null> {
  const { data } = await supabase
    .from('clients')
    .select('id, name, slug, hourly_rate')
    .eq('id', clientId)
    .maybeSingle();
  return data ?? null;
}

// ── Worker side ─────────────────────────────────────────────────────
export async function submitTodayHours(hours: number, nightHours: number, comment?: string) {
  return supabase.rpc('submit_today_hours', {
    p_hours: hours,
    p_night: nightHours,
    p_comment: comment?.trim() || null,
  });
}

/** Last 7 calendar days (Paris) for the signed-in worker, newest last. */
export async function getMyWeekLogs(): Promise<DailyLog[]> {
  const today = parisNow();
  const from = new Date(today);
  from.setDate(from.getDate() - 6);
  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .gte('log_date', from.toLocaleDateString('en-CA'))
    .order('log_date', { ascending: true });
  return data ?? [];
}

export async function getYesterdayLog(): Promise<DailyLog | null> {
  const y = parisNow();
  y.setDate(y.getDate() - 1);
  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('log_date', y.toLocaleDateString('en-CA'))
    .maybeSingle();
  return data ?? null;
}

// ── Client side ─────────────────────────────────────────────────────
/** All logs for this client's workers over the last 7 days, with worker name. */
export async function getClientWeekLogs(): Promise<(DailyLog & { worker: { name: string } })[]> {
  const today = parisNow();
  const from = new Date(today);
  from.setDate(from.getDate() - 6);
  const { data } = await supabase
    .from('daily_logs')
    .select('*, worker:workers(name)')
    .gte('log_date', from.toLocaleDateString('en-CA'))
    .order('log_date', { ascending: false });
  return (data as (DailyLog & { worker: { name: string } })[]) ?? [];
}

export async function reviewDay(logId: string, confirmed: boolean, comment?: string) {
  return supabase.rpc('review_day', {
    p_log_id: logId,
    p_confirmed: confirmed,
    p_comment: comment?.trim() || null,
  });
}

/** Every worker assigned to this client, regardless of whether they've logged anything. */
export async function getClientRoster(): Promise<Worker[]> {
  const { data } = await supabase
    .from('workers')
    .select('id, name, worker_code, client_id')
    .order('name');
  return data ?? [];
}

/** Live updates: fires `onChange` whenever a log for this client is inserted/updated. */
export function subscribeClientLogs(clientId: string, onChange: () => void) {
  const channel = supabase
    .channel(`client-logs-${clientId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'daily_logs', filter: `client_id=eq.${clientId}` },
      onChange
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
