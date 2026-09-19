import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="border-t-2"
      style={{ borderColor: '#0a0a0a' }}
    >
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="text-sm font-semibold text-muted">
          © {new Date().getFullYear()} VibeCheck — built by{' '}
          <a
            href="https://github.com/himanshu-here-code"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-2 underline-offset-2 hover:text-accent"
          >
            Himanshu
          </a>
        </div>

        <div className="flex gap-6 text-sm font-semibold">
          <Link href="/privacy" className="hover:text-accent">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-accent">
            Terms
          </Link>
          <a
            href="https://github.com/himanshu-here-code"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}