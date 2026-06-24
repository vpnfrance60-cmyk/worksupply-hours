'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BeamsBackground } from '@/components/ui/beams-background';

type Client = { id: string; name: string };

export default function WorkerPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [hours, setHours] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name')
      .order('name')
      .then(({ data }) => setClients(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from('daily_logs').upsert(
      {
        worker_name: workerName.trim(),
        worker_email: workerEmail.trim().toLowerCase(),
        client_id: clientId,
        log_date: today,
        hours_worked: parseFloat(hours),
        comment: comment.trim() || null,
        status: 'pending',
      },
      { onConflict: 'worker_email,client_id,log_date' }
    );

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('success');
    }
  }

  if (status === 'success') {
    return (
      <BeamsBackground intensity="medium">
        <div className="max-w-sm text-center px-4">
          <div className="rounded-2xl border-2 border-zinc-700 bg-zinc-800 shadow-2xl p-7">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Hours logged for today</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Submitted again today? It just updates your existing entry — no duplicates.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="text-sm text-zinc-200 underline underline-offset-4 hover:text-white"
            >
              Submit another entry
            </button>
          </div>
        </div>
      </BeamsBackground>
    );
  }

  return (
    <BeamsBackground intensity="medium">
      <div className="w-full max-w-sm px-4">
        <div className="rounded-2xl border-2 border-zinc-700 bg-zinc-800 shadow-2xl p-7">
          <h1 className="text-lg font-semibold text-white mb-1">Log today&apos;s hours</h1>
          <p className="text-sm text-zinc-400 mb-6">Fill this in once per day.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your name</label>
              <input
                required
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="w-full rounded-lg border-2 border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your email</label>
              <input
                required
                type="email"
                value={workerEmail}
                onChange={(e) => setWorkerEmail(e.target.value)}
                className="w-full rounded-lg border-2 border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Client</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border-2 border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition focus:border-zinc-400 [&>option]:bg-zinc-900"
              >
                <option value="" disabled>
                  Select client
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Hours worked</label>
              <input
                required
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full rounded-lg border-2 border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-lg border-2 border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-400"
                rows={2}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-400">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full rounded-lg bg-sky-500 text-white py-2.5 text-sm font-semibold transition hover:bg-sky-400 disabled:opacity-50"
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit hours'}
            </button>
          </form>
        </div>
      </div>
    </BeamsBackground>
  );
}
