'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const lines = [
  { text: 'Quality workers.', color: 'text-white' },
  { text: 'Verified hours.', color: 'text-sky-400' },
  { text: 'Every day.', color: 'text-white' },
];

const LINE_DELAY = 1500;
const HOLD_AFTER_TEXT = 2000;
const LOGO_DURATION = 1800;

export function IntroAnimation() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visibleCount < lines.length) {
      const t = setTimeout(() => setVisibleCount(visibleCount + 1), LINE_DELAY);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowLogo(true), HOLD_AFTER_TEXT);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    if (!showLogo) return;
    const t = setTimeout(() => setDone(true), LOGO_DURATION);
    return () => clearTimeout(t);
  }, [showLogo]);

  if (done) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-neutral-950 px-6"
      initial={{ opacity: 1 }}
      animate={{ opacity: showLogo ? 0 : 1 }}
      transition={{ duration: 0.8, delay: showLogo ? LOGO_DURATION / 1000 - 0.6 : 0 }}
      style={{ pointerEvents: 'none' }}
    >
      {!showLogo ? (
        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2">
          {lines.map((line, i) => (
            <motion.span
              key={line.text}
              className={`text-2xl md:text-4xl font-semibold tracking-tight ${line.color}`}
              initial={{ opacity: 0, y: 14 }}
              animate={i < visibleCount ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            >
              {line.text}
            </motion.span>
          ))}
        </div>
      ) : (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-transparent.png" alt="WorkSupply" className="h-16 w-auto" />
          <p className="mt-2 text-xs tracking-wide text-zinc-400">
            Providing workforce solutions that empower your business
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
