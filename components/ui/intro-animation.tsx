'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const lines = [
  { text: 'Quality workers.', color: 'text-white' },
  { text: 'Verified hours.', color: 'text-sky-400' },
  { text: 'Every day.', color: 'text-white' },
];

export function IntroAnimation() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step < lines.length) {
      const t = setTimeout(() => setStep(step + 1), 850);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone(true), 1300);
    return () => clearTimeout(t);
  }, [step]);

  if (done) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950"
      initial={{ opacity: 1 }}
      animate={{ opacity: step >= lines.length ? 0 : 1 }}
      transition={{ duration: 0.6, delay: step >= lines.length ? 0.7 : 0 }}
      style={{ pointerEvents: done ? 'none' : 'auto' }}
    >
      <AnimatePresence mode="wait">
        {step < lines.length ? (
          <motion.h1
            key={step}
            className={`text-3xl md:text-4xl font-semibold tracking-tight ${lines[step].color}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
          >
            {lines[step].text}
          </motion.h1>
        ) : (
          <motion.div
            key="logo"
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-transparent.png" alt="WorkSupply" className="h-16 w-auto" />
            <p className="mt-2 text-xs tracking-wide text-zinc-400">
              Providing workforce solutions that empower your business
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
