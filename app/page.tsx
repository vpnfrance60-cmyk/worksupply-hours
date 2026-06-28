'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { BeamsBackground } from '@/components/ui/beams-background';
import { GlowingShadow } from '@/components/ui/glowing-shadow';

const CARDS_START_OFFSET = 0.4;

export default function Home() {
  return (
    <BeamsBackground intensity="medium">
      <div className="flex flex-col items-center w-full -mt-[80px]">
        <div className="relative w-full max-w-md px-4">
          <div className="grid gap-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: CARDS_START_OFFSET, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/worker" className="block transition-transform active:scale-[0.97]">
              <GlowingShadow>
                <div className="flex flex-col items-center text-center px-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 mb-2">
                    <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h2 className="text-base font-semibold text-white">Worker space</h2>
                </div>
              </GlowingShadow>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: CARDS_START_OFFSET + 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/client" className="block transition-transform active:scale-[0.97]">
              <GlowingShadow hue={150}>
                <div className="flex flex-col items-center text-center px-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 mb-2">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-semibold text-white">Client space</h2>
                </div>
              </GlowingShadow>
            </Link>
          </motion.div>
          </div>
        </div>
      </div>
    </BeamsBackground>
  );
}
