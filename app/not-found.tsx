import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container-tight flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="headline text-[120px] leading-none">404</div>
        <h1 className="headline mt-2 text-3xl">This page doesn&apos;t exist</h1>
        <p className="mt-4 max-w-md text-[15px] text-muted">
          Either the URL is wrong or we deleted something by accident.
          Either way, let&apos;s get you back to the tool.
        </p>
        <Link
          href="/"
          className="bd bs press mt-8 inline-flex items-center gap-2 rounded-xl bg-accent-3 px-5 py-3 text-sm font-bold"
        >
          Go home
        </Link>
      </main>
      <Footer />
    </>
  );
}