import Link from 'next/link';
import { BeamsBackground } from '@/components/ui/beams-background';

export default function Home() {
  return (
    <BeamsBackground intensity="medium">
      <div className="w-full max-w-sm px-4 text-center">
        <div className="rounded-2xl border-2 border-zinc-700 bg-zinc-800 shadow-2xl p-7">
          <h1 className="text-lg font-semibold text-white mb-1">WorkSupply Hours</h1>
          <p className="text-sm text-zinc-400 mb-6">Daily hours logging and confirmation.</p>

          <Link
            href="/worker"
            className="block w-full rounded-lg bg-sky-500 text-white py-2.5 text-sm font-semibold transition hover:bg-sky-400 mb-3"
          >
            I&apos;m a worker — log my hours
          </Link>

          <p className="text-xs text-zinc-500">
            Clients use the dedicated link sent to them directly.
          </p>
        </div>
      </div>
    </BeamsBackground>
  );
}
