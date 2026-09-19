'use client';
import { useState } from 'react';
import { CopyIcon, CheckIcon } from './Icons';

const SEV = {
  critical: { label: 'Critical', bg: '#ef4444', text: '#ffffff' },
  high:     { label: 'High',     bg: '#fbbf24', text: '#0a0a0a' },
  medium:   { label: 'Medium',   bg: '#38bdf8', text: '#0a0a0a' },
  low:      { label: 'Low',      bg: '#34d399', text: '#0a0a0a' },
} as const;

export function IssueCard({ issue }: { issue: any }) {
  const [copied, setCopied] = useState(false);
  const sev = SEV[issue.severity as keyof typeof SEV] ?? SEV.low;

  const prompt = `Fix this issue in my app: ${issue.title}

${issue.description}

Suggested approach: ${issue.fix}

Please make the change, keeping the existing design system and code style.`;

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="bd rounded-2xl bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-[17px] font-bold leading-snug" style={{ flex: '1 1 240px' }}>
          {issue.title}
        </h3>
        <span
          className="shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ background: sev.bg, color: sev.text, borderColor: '#0a0a0a' }}
        >
          {sev.label}
        </span>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        {issue.description}
      </p>

      <div
        className="mt-4 rounded-xl border-2 p-4"
        style={{ borderColor: '#0a0a0a', background: '#fef9ec' }}
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          How to fix
        </div>
        <p className="mt-2 text-[15px] leading-relaxed font-medium">
          {issue.fix}
        </p>
      </div>

      <button
        onClick={copy}
        className="bd bs-sm press-sm mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-3 px-3.5 py-2 text-[13px] font-bold"
      >
        {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        {copied ? 'Copied!' : 'Copy fix prompt'}
      </button>
    </article>
  );
}