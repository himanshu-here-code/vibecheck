import Image from 'next/image';
import Link from 'next/link';
import { GithubIcon } from './Icons';

export function Header() {
  function handleLogoClick() {
    // Tell the home page to reset its scan state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vibecheck:reset'));
    }
  }

  return (
    <header className="site-header">
      <div className="container flex h-[68px] items-center justify-between">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-1.5 text-2xl leading-none"
        >
          <Image
            src="/icon.png"
            alt="VibeCheck"
            width={36}
            height={36}
            className="rounded-md"
            priority
          />
          <span className="flex items-baseline gap-1">
            <span className="font-display">Vibe</span>
            <span className="font-display italic text-accent">Check</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link
            href="/privacy"
            className="hidden rounded-lg px-3 py-2 transition-opacity hover:opacity-60 sm:inline-block"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hidden rounded-lg px-3 py-2 transition-opacity hover:opacity-60 sm:inline-block"
          >
            Terms
          </Link>

          <div
            className="mx-2 hidden h-5 w-px sm:block"
            style={{ background: 'rgba(10,10,10,0.15)' }}
          />

          <a
            href="https://github.com/himanshu-here-code"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-opacity hover:opacity-60"
            aria-label="GitHub profile"
          >
            <GithubIcon size={18} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
}