'use client';

import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="absolute top-4 right-4 z-20 flex items-center rounded-full border-2 border-zinc-700 bg-zinc-900/80 p-0.5 text-xs font-semibold backdrop-blur">
      <button
        onClick={() => setLang('en')}
        className={cn(
          'rounded-full px-2.5 py-1 transition',
          lang === 'en' ? 'bg-sky-500 text-white' : 'text-zinc-400 hover:text-white'
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLang('fr')}
        className={cn(
          'rounded-full px-2.5 py-1 transition',
          lang === 'fr' ? 'bg-sky-500 text-white' : 'text-zinc-400 hover:text-white'
        )}
      >
        FR
      </button>
    </div>
  );
}
