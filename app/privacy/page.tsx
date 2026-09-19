import { Header } from '@/components/Header';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — VibeCheck',
  description: 'What VibeCheck does with your data. Spoiler: almost nothing.',
};

export default function PrivacyPage() {
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

        <h1 className="headline text-5xl sm:text-6xl">Privacy Policy</h1>

        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted">
          Last updated: November 2025
        </p>

        <div className="mt-12 space-y-10 text-[16px] leading-relaxed">
          <p className="text-lg">
            VibeCheck is a small tool built by one developer. The short
            version: we don&apos;t want your data, we don&apos;t sell anything,
            and we don&apos;t keep anything. Here&apos;s the longer version
            so you know exactly what happens when you click Scan.
          </p>

          <Section title="What we actually do when you paste a URL">
            <p>
              When you submit a GitHub repository URL, here&apos;s the exact
              sequence of events:
            </p>
            <ol className="ml-5 mt-4 list-decimal space-y-2 text-muted">
              <li>
                Your browser sends the URL to our server (hosted on Vercel).
              </li>
              <li>
                Our server forwards a request to GitHub&apos;s public API to
                fetch the repository&apos;s file tree and file contents.
              </li>
              <li>
                We run a series of static checks against what we fetched —
                looking for missing privacy pages, default meta titles,
                placeholder text, and so on.
              </li>
              <li>
                We send the results back to your browser and immediately
                discard everything.
              </li>
            </ol>
            <p className="mt-4">
              No database. No logs of what you scanned. No scan history. Once
              the response leaves our server, it&apos;s gone.
            </p>
          </Section>

          <Section title="What we don't store">
            <p>
              We do not store, log, or retain any of the following:
            </p>
            <ul className="ml-5 mt-4 list-disc space-y-2 text-muted">
              <li>The repository URLs you submit</li>
              <li>The code we fetch from those repositories</li>
              <li>The results we generate</li>
              <li>Your IP address (beyond what Vercel needs for basic request routing)</li>
              <li>Any cookies, identifiers, or device fingerprints</li>
            </ul>
            <p className="mt-4">
              There is no user account system, so there&apos;s nothing to tie
              any of this to a person anyway.
            </p>
          </Section>

          <Section title="The one exception: Vercel">
            <p>
              VibeCheck is hosted on Vercel. Like every web host, Vercel
              processes each incoming request and may keep short-lived
              operational logs (IP address, timestamp, status code) for
              security and abuse prevention. These logs are owned and managed
              by Vercel, not us, and we don&apos;t have access to them.
            </p>
            <p className="mt-4">
              You can read more in{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-2 underline-offset-2 hover:text-accent"
              >
                Vercel&apos;s privacy policy
              </a>
              . We don&apos;t run any analytics tools (no Google Analytics, no
              Plausible, no PostHog). Nothing.
            </p>
          </Section>

          <Section title="GitHub">
            <p>
              To analyze a repository, we send requests to GitHub&apos;s public
              API. We use an anonymous public-read access token with zero
              scopes — it can only read public repositories and nothing else.
              If you scan a private repo, it won&apos;t work; that&apos;s by
              design, so we never touch anything you haven&apos;t already made
              public.
            </p>
            <p className="mt-4">
              Your use of GitHub is governed by{' '}
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-2 underline-offset-2 hover:text-accent"
              >
                GitHub&apos;s privacy statement
              </a>
              , which we recommend reading if you care about how they handle
              requests.
            </p>
          </Section>

          <Section title="Your rights (GDPR, CCPA, and common sense)">
            <p>
              Because we don&apos;t collect or store personal data, there&apos;s
              nothing for you to request, delete, or export. If you&apos;re in
              the EU, UK, or California, this meets the requirements of those
              laws automatically — you can&apos;t have rights violated over
              data that doesn&apos;t exist.
            </p>
            <p className="mt-4">
              If you believe we&apos;ve somehow retained something of yours,
              email us and we&apos;ll look into it.
            </p>
          </Section>

          <Section title="Children">
            <p>
              VibeCheck isn&apos;t directed at children under 13. We don&apos;t
              knowingly collect information from anyone, so this is really just
              a formality.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If we ever change how VibeCheck handles data — for example, if we
              add analytics or a database — we&apos;ll update this page and
              bump the date at the top. The current promise is simple: nothing
              is stored, and we intend to keep it that way.
            </p>
          </Section>

          <Section title="Contact">
            <p>
                Questions, concerns, or just want to say hi? Open an issue on our
                GitHub or email us at{' '}
                <a
                href="mailto:hello@vibecheck.dev"
                className="underline decoration-2 underline-offset-2 hover:text-accent"
                >
                hello@vibecheck.dev
                </a>
                . A real human reads every message.
            </p>
            </Section>

          <div
            className="mt-16 rounded-2xl border-2 p-6"
            style={{ borderColor: '#0a0a0a', background: '#fef9ec' }}
          >
            <p className="text-sm font-semibold">
              One last thing — the whole point of VibeCheck is to help people
              ship better software. Reading this page shouldn&apos;t feel like
              a chore. If anything here was unclear, that&apos;s a bug too.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="headline mb-3 text-2xl sm:text-3xl">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}