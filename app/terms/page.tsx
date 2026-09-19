import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — VibeCheck',
  description: 'The rules for using VibeCheck. Short version: be cool.',
};

export default function TermsPage() {
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

        <h1 className="headline text-5xl sm:text-6xl">Terms of Service</h1>

        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted">
          Last updated: November 2025
        </p>

        <div className="mt-12 space-y-10 text-[16px] leading-relaxed">
          <p className="text-lg">
            VibeCheck is a free tool that reads public GitHub repositories and
            tells you what might make them look unfinished. These are the rules.
            They&apos;re short. There are no surprises hidden in section 14(b).
          </p>

          <Section title="1. What VibeCheck is">
            <p>
              VibeCheck performs <strong>static analysis</strong> on public
              GitHub repositories. It fetches file listings, downloads a
              subset of source files, and runs pattern-matching checks. No
              code is executed. No app is deployed. No AI runs on your code.
            </p>
            <p>
              The results are a <strong>best-effort opinion</strong>, not a
              security audit, not a legal review, and not a guarantee of
              anything. Treat the score as a starting point for reflection,
              not a grade.
            </p>
          </Section>

          <Section title="2. Using VibeCheck">
            <p>You&apos;re free to use VibeCheck for anything legal. That said:</p>
            <ul className="ml-5 mt-4 list-disc space-y-2 text-muted">
              <li>Don&apos;t hammer the API with automated scripts.</li>
              <li>Don&apos;t try to bypass rate limits.</li>
              <li>Don&apos;t attempt to make the service scan private repositories through clever tricks.</li>
              <li>Don&apos;t use it to harass, dox, or publicly shame other developers.</li>
              <li>Don&apos;t scrape results at scale or resell them.</li>
            </ul>
            <p className="mt-4">
              If you need higher limits for a legitimate use case, contact me
              on GitHub and we&apos;ll figure something out.
            </p>
          </Section>

          <Section title="3. What you can and can't do with results">
            <p>
              The reports you generate are yours. Screenshot them, share them
              on X, paste them into Cursor, feed the AI prompt into Claude,
              whatever. <strong>Do that.</strong> That&apos;s the whole point.
            </p>
            <p>
              The only thing I ask: if you&apos;re using a scan to critique
              someone else&apos;s repo publicly, be kind about it. The score
              isn&apos;t a verdict on their ability, and everyone&apos;s
              project is a work in progress.
            </p>
          </Section>

          <Section title="4. No warranty">
            <p>
              VibeCheck is provided <strong>&ldquo;as is&rdquo;</strong> and{' '}
              <strong>&ldquo;as available.&rdquo;</strong> I make no promises
              that it will always work, that the results will be accurate, or
              that it will catch every issue in your app.
            </p>
            <p>
              It might tell you your app is fine when it isn&apos;t. It might
              flag something that isn&apos;t actually a problem. It&apos;s a
              static analyzer, not a psychic. Use judgment.
            </p>
          </Section>

          <Section title="5. No liability">
            <p>
              If you ship an app, deploy something, make a business decision,
              or otherwise do anything based on a VibeCheck report — that&apos;s
              on you. I&apos;m not responsible for any damages, losses, missed
              launches, angry investors, or anything else that happens.
            </p>
            <p>
              This tool is free. The legal standard for free tools is
              correspondingly low. Please don&apos;t sue over a static analysis
              report.
            </p>
          </Section>

          <Section title="6. Third-party services">
            <p>
              VibeCheck relies on the GitHub API to fetch repositories. If
              GitHub is down, changes its API, rate-limits us, or blocks us,
              VibeCheck stops working. Nothing I can do about that.
            </p>
            <p>
              Your use of any repository is still governed by that
              repository&apos;s own license and GitHub&apos;s terms. VibeCheck
              doesn&apos;t grant you any rights to code you don&apos;t own.
            </p>
          </Section>

          <Section title="7. Availability and changes">
            <p>
              VibeCheck might go down. It might change. Features might be added
              or removed. The scoring rubric could shift as I improve the
              checks. A repo that scored 30% today could score 45% tomorrow
              because I added new detections.
            </p>
            <p>
              If the service ever shuts down permanently, I&apos;ll leave the
              source code up on GitHub so you can self-host it. That&apos;s a
              real commitment.
            </p>
          </Section>

          <Section title="8. Termination">
            <p>
              I can block access to VibeCheck if someone is abusing the service,
              attacking the infrastructure, or being a genuine problem. This is
              rare, and it&apos;s mostly about protecting the free tier for
              everyone else.
            </p>
          </Section>

          <Section title="9. Governing law">
            <p>
              These terms are governed by the laws of India (assuming that&apos;s
              where the project owner is based). If you&apos;re somewhere else,
              the local consumer protection laws still apply to you on top.
              Nothing here tries to override your statutory rights.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions, disputes, or just want to talk? Reach out on GitHub —{' '}
              <a
                href="https://github.com/himanshu-here-code"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-2 underline-offset-2 hover:text-accent"
              >
                @himanshu-here-code
              </a>
              . A real human reads every message.
            </p>
          </Section>

          <div
            className="mt-16 rounded-2xl border-2 p-6"
            style={{ borderColor: '#0a0a0a', background: '#fef9ec' }}
          >
            <p className="text-sm font-semibold">
              TL;DR — VibeCheck is free, provided as-is, and you can use the
              reports however you want. Be nice, don&apos;t abuse it, don&apos;t
              sue over a missing 404 page.
            </p>
          </div>
        </div>
      </main>

      <Footer />
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