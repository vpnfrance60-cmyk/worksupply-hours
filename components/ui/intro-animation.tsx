'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const lines = [
  { text: 'Providing workforce', color: 'text-white' },
  { text: 'solutions that empower', color: 'text-sky-400' },
  { text: 'your business.', color: 'text-white' },
];

const LINE_DELAY = 1900;
const HOLD_AFTER_TEXT = 2200;
const LOGO_HOLD = 2000;
const FADE_DURATION = 1000;

export const INTRO_TOTAL_MS =
  LINE_DELAY * lines.length + HOLD_AFTER_TEXT + LOGO_HOLD + FADE_DURATION;

export function IntroAnimation() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
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
    const t = setTimeout(() => setFadeOut(true), LOGO_HOLD);
    return () => clearTimeout(t);
  }, [showLogo]);

  useEffect(() => {
    if (!fadeOut) return;
    const t = setTimeout(() => setDone(true), FADE_DURATION);
    return () => clearTimeout(t);
  }, [fadeOut]);

  if (done) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-neutral-950 px-6"
      animate={
        fadeOut
          ? { opacity: 0, scale: 1.08, filter: 'blur(12px)' }
          : { opacity: 1, scale: 1, filter: 'blur(0px)' }
      }
      transition={{ duration: FADE_DURATION / 1000, ease: 'easeInOut' }}
      style={{ pointerEvents: 'none' }}
    >
      {!showLogo ? (
        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2">
          {lines.map((line, i) => (
            <motion.span
              key={line.text}
              className={`text-2xl md:text-4xl font-semibold tracking-tight ${line.color}`}
              initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
              animate={
                i < visibleCount
                  ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                  : {}
              }
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {line.text}
            </motion.span>
          ))}
        </div>
      ) : (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-transparent.png" alt="WorkSupply" className="h-16 w-auto" />
        </motion.div>
      )}
    </motion.div>
  );
}
