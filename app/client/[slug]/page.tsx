'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BeamsBackground } from '@/components/ui/beams-background';

type LogRow = {
  id: string;
  worker_name: string;
  hours_worked: number;
  comment: string | null;
  status: 'pending' | 'confirmed' | 'disputed';
};

export default function ClientReviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [disputeOpenId, setDisputeOpenId] = useState<string | null>(null);
  const [disputeHours, setDisputeHours] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  const loadLogs = useCallback(async (cId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('daily_logs')
      .select('id, worker_name, hours_worked, comment, status')
      .eq('client_id', cId)
      .eq('log_date', today)
      .order('worker_name');
    setLogs(data ?? []);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: client } = await supabase
        .from('clients')
        .select('id, name')
        .eq('slug', slug)
        .single();

      if (client) {
        setClientName(client.name);
        setClientId(client.id);
        await loadLogs(client.id);
      }
      setLoading(false);
    }
    init();
  }, [slug, loadLogs]);

  async function confirmAll() {
    const pendingIds = logs.filter((l) => l.status === 'pending').map((l) => l.id);
    if (pendingIds.length === 0) return;
    await supabase
      .from('daily_logs')
      .update({ status: 'confirmed', hours_confirmed: null })
      .in('id', pendingIds);
    await loadLogs(clientId);
  }

  async function confirmOne(id: string, hours: number) {
    await supabase
      .from('daily_logs')
      .update({ status: 'confirmed', hours_confirmed: hours })
      .eq('id', id);
    await loadLogs(clientId);
  }

  async function submitDispute(id: string) {
    await supabase
      .from('daily_logs')
      .update({
        status: 'disputed',
        hours_confirmed: parseFloat(disputeHours),
        client_comment: disputeReason,
      })
      .eq('id', id);
    setDisputeOpenId(null);
    setDisputeHours('');
    setDisputeReason('');
    await loadLogs(clientId);
  }

  if (loading) {
    return (
      <BeamsBackground intensity="subtle">
        <p className="text-zinc-400 text-sm">Loading…</p>
      </BeamsBackground>
    );
  }

  if (!clientId) {
    return (
      <BeamsBackground intensity="subtle">
        <p className="text-zinc-400 text-sm">Client not found.</p>
      </BeamsBackground>
    );
  }

  const pendingCount = logs.filter((l) => l.status === 'pending').length;

  const statusStyles: Record<LogRow['status'], string> = {
    pending: 'bg-amber-500 text-white',
    confirmed: 'bg-emerald-500 text-white',
    disputed: 'bg-red-500 text-white',
  };

  return (
    <BeamsBackground intensity="medium">
      <div className="w-full max-w-2xl px-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white mb-1">{clientName} — today&apos;s hours</h1>
          <p className="text-sm text-zinc-400">
            {logs.length === 0 ? 'No entries yet today.' : `${pendingCount} pending review`}
          </p>
        </div>

        {pendingCount > 0 && (
          <button
            onClick={confirmAll}
            className="mb-6 rounded-lg bg-sky-500 text-white text-sm font-semibold px-4 py-2 transition hover:bg-sky-400"
          >
            Confirm all ({pendingCount})
          </button>
        )}

        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border-2 border-zinc-700 bg-zinc-800 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{log.worker_name}</p>
                  <p className="text-sm text-zinc-400">
                    {log.hours_worked}h
                    {log.comment ? ` — "${log.comment}"` : ''}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyles[log.status]}`}>
                  {log.status}
                </span>
              </div>

              {log.status === 'pending' && (
                <div className="mt-3 flex gap-4 text-sm">
                  <button
                    onClick={() => confirmOne(log.id, log.hours_worked)}
                    className="text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDisputeOpenId(log.id)}
                    className="text-red-400 underline underline-offset-4 hover:text-red-300"
                  >
                    Dispute
                  </button>
                </div>
              )}

              {disputeOpenId === log.id && (
                <div className="mt-3 border-t-2 border-zinc-700 pt-3 space-y-2">
                  <input
                    type="number"
                    placeholder="Actual hours"
                    value={disputeHours}
                    onChange={(e) => setDisputeHours(e.target.value)}
                    className="w-full rounded-lg border-2 border-zinc-600 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-400"
                  />
                  <textarea
                    placeholder="Reason"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full rounded-lg border-2 border-zinc-600 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-400"
                  />
                  <button
                    onClick={() => submitDispute(log.id)}
                    className="rounded-lg bg-red-500 text-white text-sm font-semibold px-3 py-1.5 transition hover:bg-red-400"
                  >
                    Submit dispute
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
