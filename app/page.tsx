'use client';
import { useEffect, useMemo, useState } from 'react';
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

  async function scan(repoUrl: string, authToken?: string) {
  setLoading(true);
  setError(null);
  setResult(null);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl, authToken }),
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

  // Auto-scan if a ?repo= param is present (from a shared link)
  // Reset scan when the logo is clicked
useEffect(() => {
  function handleReset() {
    setResult(null);
    setError(null);
    setLoading(false);
    // Clear the ?repo= URL param so refresh doesn't re-scan
    if (window.location.search) {
      window.history.replaceState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('vibecheck:reset', handleReset);
  return () => window.removeEventListener('vibecheck:reset', handleReset);
}, []);

  const grouped = useMemo(() => {
    if (!result) return [];
    const order = [
      'legal',
      'seo',
      'errors',
      'hygiene',
      'signatures',
      'quality',
      'analytics',
    ];
    const map = new Map<string, any[]>();
    for (const issue of result.issues) {
      if (!map.has(issue.category)) map.set(issue.category, []);
      map.get(issue.category)!.push(issue);
    }
    return order
      .filter((c) => map.has(c))
      .map((c) => ({ category: c, issues: map.get(c)! }));
  }, [result]);

  const buildFullReport = () => {
    if (!result) return '';
    const lines: string[] = [];

    const detectedType =
      result.projectType?.type && result.projectType.type !== 'unknown'
        ? result.projectType.type
        : null;

    const typeLabel: Record<string, string> = {
      'web-app': 'a web application',
      'cli-tool': 'a command-line tool',
      library: 'a library / SDK',
      'mobile-app': 'a mobile app',
      'browser-extension': 'a browser extension',
      'api-service': 'an API service',
    };

    const categoryTitles: Record<string, string> = {
      legal: 'Legal & Trust',
      seo: 'SEO & Meta',
      errors: 'Errors & Edge States',
      hygiene: 'Code Hygiene',
      signatures: 'Vibecoded Signatures',
      quality: 'Code Quality',
      analytics: 'Analytics',
    };

    const severities = ['critical', 'high', 'medium', 'low'];

    // ---- Header -----------------------------------------------------------
    lines.push(`# Code Quality Fix Request`);
    lines.push('');
    lines.push(
      `I ran my GitHub repo through **VibeCheck**, a static analysis tool that finds the small things that make an app look like a prototype instead of a finished product. Below is the full report.`
    );
    lines.push('');
    lines.push('---');
    lines.push('');

    // ---- Repo context -----------------------------------------------------
    lines.push('## About this project');
    lines.push('');
    lines.push(`- **Repository:** \`${result.repo}\``);
    lines.push(`- **Files analyzed:** ${result.fileCount}`);
    if (detectedType) {
      lines.push(
        `- **Detected project type:** ${typeLabel[detectedType] ?? detectedType}`
      );
    }
    lines.push(
      `- **Vibecoded score:** ${result.score}% (grade ${result.grade}) — lower is better`
    );
    lines.push(
      `- **Issues found:** ${result.issues.length} (${result.issues.filter((i: any) => i.severity === 'critical').length} critical, ${result.issues.filter((i: any) => i.severity === 'high').length} high)`
    );
    lines.push(`- **Checks passed:** ${result.passed.length}`);
    lines.push('');
    lines.push(
      `If you need more context about any of this, read the repo's README.md first — it will tell you what the app actually does.`
    );
    lines.push('');
    lines.push('---');
    lines.push('');

    // ---- Instructions for the AI ------------------------------------------
    lines.push('## What I need you to do');
    lines.push('');
    lines.push(
      `Go through the issues below one by one and fix them in my codebase. Please follow these rules:`
    );
    lines.push('');
    lines.push(
      `1. **Work in priority order.** Critical → High → Medium → Low. Stop and let me review after each severity tier before moving to the next.`
    );
    lines.push(
      `2. **Don't rewrite what isn't broken.** Keep my existing design system, tech stack, file structure, and code style. The fix for each issue should be additive and surgical, not a refactor.`
    );
    lines.push(
      `3. **If an issue doesn't apply, say so and skip it.** VibeCheck is a static analyzer — it makes mistakes. If you see something flagged that's actually fine (or the fix would break something), tell me why before skipping it.`
    );
    lines.push(
      `4. **Group related fixes into the same change.** If three issues are all about the same component, one change-set for all three, not three separate edits.`
    );
    lines.push(
      `5. **After each fix, briefly explain what you changed and why.** One or two sentences per fix is enough. I want to learn from this, not just have the code changed.`
    );
    lines.push(
      `6. **Ask before installing new dependencies.** Some fixes (like adding a cookie banner) may require a library. Show me the package and version before you add it.`
    );
    lines.push(
      `7. **If you're unsure about scope, ask.** It's better to check than to guess and rewrite half my app.`
    );
    lines.push('');
    lines.push('---');
    lines.push('');

    // ---- Issues -----------------------------------------------------------
    lines.push('## Issues to fix');
    lines.push('');

    const order = [
      'legal',
      'seo',
      'errors',
      'hygiene',
      'signatures',
      'quality',
      'analytics',
    ];

    for (const category of order) {
      const issues = grouped.find((g) => g.category === category)?.issues;
      if (!issues || issues.length === 0) continue;

      lines.push(`### ${categoryTitles[category] ?? category}`);
      lines.push('');

      const sorted = [...issues].sort(
        (a, b) =>
          severities.indexOf(a.severity) - severities.indexOf(b.severity)
      );

      sorted.forEach((issue, idx) => {
        lines.push(
          `#### ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`
        );
        lines.push('');
        lines.push(`**What it is:** ${issue.description}`);
        lines.push('');
        if (issue.affectedFiles?.length) {
          lines.push(`**Where:**`);
          issue.affectedFiles.forEach((f: string) =>
            lines.push(`  - \`${f}\``)
          );
          lines.push('');
        }
        lines.push(`**Suggested fix:** ${issue.fix}`);
        lines.push('');
        if (issue.docs) {
          lines.push(`**Reference:** ${issue.docs}`);
          lines.push('');
        }
      });
    }

    // ---- Passed checks ----------------------------------------------------
    if (result.passed.length > 0) {
      lines.push('---');
      lines.push('');
      lines.push('## What VibeCheck already approved');
      lines.push('');
      lines.push(
        `These checks passed. No action needed — but don't accidentally break them while fixing the rest.`
      );
      lines.push('');
      const byCategory: Record<string, string[]> = {
        legal: [],
        seo: [],
        errors: [],
        hygiene: [],
        signatures: [],
        quality: [],
        analytics: [],
      };
      for (const checkId of result.passed) {
        const [category] = checkId.split('.');
        if (byCategory[category]) byCategory[category].push(checkId);
      }
      for (const [category, checks] of Object.entries(byCategory)) {
        if (checks.length === 0) continue;
        lines.push(
          `- **${categoryTitles[category] ?? category}**: ${checks.join(', ')}`
        );
      }
      lines.push('');
    }

    // ---- Deliverable ------------------------------------------------------
    lines.push('---');
    lines.push('');
    lines.push('## What I want back from you');
    lines.push('');

    const firstTier =
      severities.find((sev) =>
        result.issues.some((i: any) => i.severity === sev)
      ) ?? 'low';
    const firstTierCount = result.issues.filter(
      (i: any) => i.severity === firstTier
    ).length;

    lines.push(
      `Start with the **${firstTier.toUpperCase()}** issues (${firstTierCount} of them). For each one, show me the file, the diff, and a one-line explanation of what changed. When you finish all ${firstTier}s, stop and wait for me to review before moving to the next tier.`
    );
    lines.push('');
    lines.push(
      `If you have questions about any issue, ask them upfront before starting. I'd rather answer three questions than watch you rewrite the wrong thing.`
    );
    lines.push('');

    return lines.join('\n');
  };

  const showHero = !result && !loading;
  const showReport = result && !loading;

  return (
    <>
      <Header />
      <main className="pb-32">
        {showHero && <Hero />}
        {!showHero && <div className="pt-20" />}

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
                    <CategorySection
                      key={category}
                      category={category}
                      issues={issues}
                    />
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
                      style={{
                        borderColor: 'rgba(10,10,10,0.15)',
                        color: '#6b6b6b',
                      }}
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