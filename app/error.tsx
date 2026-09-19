'use client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Header />
      <main className="container-tight flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <div
          className="bd bs rounded-2xl px-6 py-3 text-sm font-bold uppercase tracking-widest"
          style={{ background: '#ef4444', color: '#fff' }}
        >
          Something broke
        </div>

        <h1 className="headline mt-6 text-5xl sm:text-6xl">
          Not your fault.
        </h1>

        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
          Something on our end crashed. Usually the second try works.
        </p>

        <button
          onClick={reset}
          className="bd bs press mt-8 inline-flex items-center gap-2 rounded-xl bg-accent-3 px-5 py-3 text-sm font-bold"
        >
          Try again
        </button>
      </main>
      <Footer />
    </>
  );
}