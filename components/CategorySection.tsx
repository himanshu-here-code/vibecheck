'use client';
import { useState } from 'react';
import { IssueCard } from './IssueCard';

const META: Record<string, { title: string; emoji: string; bg: string }> = {
  legal:      { title: 'Legal & Trust',        emoji: '⚖️', bg: '#8b5cf6' },
  seo:        { title: 'SEO & Meta',           emoji: '🔍', bg: '#38bdf8' },
  errors:     { title: 'Errors & Edge States', emoji: '🐛', bg: '#fbbf24' },
  hygiene:    { title: 'Code Hygiene',         emoji: '🧼', bg: '#34d399' },
  signatures: { title: 'Vibecoded Signs',      emoji: '✨', bg: '#8b5cf6' },
  analytics:  { title: 'Analytics',            emoji: '📊', bg: '#38bdf8' },
};

export function CategorySection({ category, issues }: { category: string; issues: any[] }) {
  const [open, setOpen] = useState(true);
  const meta = META[category] ?? { title: category, emoji: '📋', bg: '#8b5cf6' };

  return (
    <section className="bd bs-lg overflow-hidden rounded-3xl bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-xl border-2 text-lg"
            style={{ width: 44, height: 44, background: meta.bg, borderColor: '#0a0a0a' }}
          >
            {meta.emoji}
          </div>
          <div>
            <h2 className="headline text-2xl">{meta.title}</h2>
            <div className="mt-0.5 text-xs font-semibold text-muted">
              {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
            </div>
          </div>
        </div>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          className="space-y-4 border-t-2 px-6 py-6"
          style={{ borderColor: '#0a0a0a' }}
        >
          {issues.map((i) => <IssueCard key={i.id} issue={i} />)}
        </div>
      )}
    </section>
  );
}