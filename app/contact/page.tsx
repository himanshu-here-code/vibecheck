import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Contact — VibeCheck',
  description: 'Get in touch about VibeCheck.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="container-tight pt-16 pb-32">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-opacity hover:opacity-60"
        >
          ← Back to VibeCheck
        </Link>

        <h1 className="headline text-5xl sm:text-6xl">Contact</h1>

        <p className="mt-4 text-lg leading-relaxed">
          VibeCheck is built by one person. If you found a bug, have an idea,
          or just want to say hi — the fastest way to reach me is GitHub.
        </p>

        <div className="mt-10 space-y-4">
          <a
            href="https://github.com/himanshu-here-code/vibecheck/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="bd bs press flex items-center justify-between rounded-2xl bg-card p-5"
          >
            <div>
              <div className="font-bold">Open an issue</div>
              <div className="text-sm text-muted">
                Bugs, feature requests, questions — all welcome
              </div>
            </div>
            <span className="text-sm font-bold">→</span>
          </a>

          <a
            href="https://github.com/himanshu-here-code"
            target="_blank"
            rel="noopener noreferrer"
            className="bd bs press flex items-center justify-between rounded-2xl bg-card p-5"
          >
            <div>
              <div className="font-bold">Follow on GitHub</div>
              <div className="text-sm text-muted">
                @himanshu-here-code
              </div>
            </div>
            <span className="text-sm font-bold">→</span>
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}