'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { BeamsBackground } from '@/components/ui/beams-background';
import { INTRO_TOTAL_MS } from '@/components/ui/intro-animation';

const revealDelay = INTRO_TOTAL_MS / 1000 - 0.5;

export default function Home() {
  return (
    <BeamsBackground intensity="medium">
      <div className="w-full max-w-md px-4">
        <div className="grid gap-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: revealDelay, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href="/worker"
              className="block rounded-2xl border-2 border-zinc-700 bg-zinc-800 shadow-2xl p-6 transition hover:border-sky-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15">
                  <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-white">Worker space</h2>
              </div>
              <p className="text-sm text-zinc-400">Log your hours for today, per client.</p>
            </Link>
          </motion.div>

          <motion.div
            className="rounded-2xl border-2 border-zinc-700 bg-zinc-800 shadow-2xl p-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: revealDelay + 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-white">Client space</h2>
            </div>
            <p className="text-sm text-zinc-400">
              Review and confirm or dispute your workers&apos; hours. Use the dedicated link sent to you directly.
            </p>
          </motion.div>
        </div>
      </div>
    </BeamsBackground>
  );
}
