'use client';
import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ScanInput } from '@/components/ScanInput';
import { LoadingScan } from '@/components/LoadingScan';
import { ProfileCard } from '@/components/ProfileCard';
import { StatGrid } from '@/components/StatGrid';
import { CategorySection } from '@/components/CategorySection';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function scan(repoUrl: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    if (!result) return [];
    const order = ['legal', 'seo', 'errors', 'hygiene', 'signatures', 'analytics'];
    const map = new Map<string, any[]>();
    for (const issue of result.issues) {
      if (!map.has(issue.category)) map.set(issue.category, []);
      map.get(issue.category)!.push(issue);
    }
    return order.filter((c) => map.has(c)).map((c) => ({ category: c, issues: map.get(c)! }));
  }, [result]);

  const buildFullReport = () => {
    if (!result) return '';
    const lines: string[] = [];

    lines.push(`# VibeCheck Report — ${result.repo}`);
    lines.push('');
    lines.push(`Vibecoded score: ${result.score}% (grade: ${result.grade})`);
    lines.push(`Files scanned: ${result.fileCount}`);
    lines.push(`Issues found: ${result.issues.length} · Checks passed: ${result.passed.length}`);
    lines.push('');
    lines.push('## Context for the AI');
    lines.push('');
    lines.push(
      `I ran my GitHub repo through VibeCheck, a static analysis tool that finds the small things that make an app look like a prototype instead of a finished product. ` +
      `The report below lists each issue with severity, what it means, and how to fix it.`
    );
    lines.push('');
    lines.push(
      `Please go through these issues one by one and fix them in my codebase. ` +
      `Keep my existing design system, tech stack, and code style — don't rewrite anything that isn't broken. ` +
      `If an issue doesn't apply to this project, say so and skip it. ` +
      `Group related fixes into the same change so I can review them together. ` +
      `After each fix, briefly explain what you changed and why.`
    );
    lines.push('');

    const categoryTitles: Record<string, string> = {
      legal: 'Legal & Trust',
      seo: 'SEO & Meta',
      errors: 'Errors & Edge States',
      hygiene: 'Code Hygiene',
      signatures: 'Vibecoded Signatures',
      analytics: 'Analytics',
    };

    const categories = new Map<string, any[]>();
    for (const issue of result.issues) {
      if (!categories.has(issue.category)) categories.set(issue.category, []);
      categories.get(issue.category)!.push(issue);
    }

    lines.push('## Issues to fix');
    lines.push('');
    for (const [category, issues] of categories.entries()) {
      lines.push(`### ${categoryTitles[category] ?? category}`);
      lines.push('');
      issues.forEach((issue, i) => {
        lines.push(`${i + 1}. **[${issue.severity.toUpperCase()}] ${issue.title}**`);
        lines.push(`   - Problem: ${issue.description}`);
        lines.push(`   - Fix: ${issue.fix}`);
        lines.push('');
      });
    }

    lines.push('---');
    lines.push('');
    lines.push('Start with the CRITICAL issues, then HIGH, then the rest.');

    return lines.join('\n');
  };

  const showHero = !result && !loading;
  const showReport = result && !loading;

  return (
    <>
      <Header />
      <main className="pb-32">
        {showHero && <Hero />}
        {!showHero && <div className="pt-12" />}

        <ScanInput onScan={scan} loading={loading} />

        {loading && <LoadingScan />}

        {error && (
          <div className="container-tight pop">
            <div className="bd bs bg-danger rounded-2xl px-6 py-5 font-bold text-white">
              {error}
            </div>
          </div>
        )}

        {showReport && (
          <div className="container pop space-y-8">
            <ProfileCard result={result} buildFullReport={buildFullReport} />

            <StatGrid
              issues={result.issues.length}
              passed={result.passed.length}
              files={result.fileCount}
            />

            {grouped.length > 0 && (
              <div className="pt-6">
                <h2 className="headline mb-6 text-4xl">The full report</h2>
                <div className="space-y-6">
                  {grouped.map(({ category, issues }) => (
                    <CategorySection key={category} category={category} issues={issues} />
                  ))}
                </div>
              </div>
            )}

            {result.passed.length > 0 && (
              <details className="bd bs-sm rounded-2xl bg-card p-5">
                <summary className="font-bold text-sm">
                  ✓ {result.passed.length} checks passed — see them
                </summary>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.passed.map((p: string) => (
                    <span
                      key={p}
                      className="rounded-md border px-2.5 py-1 font-mono text-[11px]"
                      style={{ borderColor: 'rgba(10,10,10,0.15)', color: '#6b6b6b' }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </main>
    </>
  );
}