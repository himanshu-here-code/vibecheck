'use client';
import { useEffect, useState } from 'react';
import { ScoreRing } from './ScoreRing';
import { ClipboardIcon, CheckIcon } from './Icons';
import { TYPE_LABELS } from '@/lib/detect/checks-by-type';

export function ProfileCard({
  result,
  buildFullReport,
}: {
  result: any;
  buildFullReport: () => string;
}) {
  const [copied, setCopied] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [owner, setOwner] = useState<string>('');

  useEffect(() => {
    const [ownerLogin] = (result.repo as string).split('/');
    setOwner(ownerLogin);

    // Fetch owner's avatar from GitHub public API (no auth needed)
    fetch(`https://api.github.com/users/${ownerLogin}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.avatar_url) setAvatar(d.avatar_url);
      })
      .catch(() => {});
  }, [result.repo]);

  async function copyFull() {
    await navigator.clipboard.writeText(buildFullReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="bd bs-lg rounded-3xl bg-card p-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        <ScoreRing score={result.score} />

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            Report for
          </div>

          <div className="mt-2 flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt={owner}
                width={36}
                height={36}
                className="bd shrink-0 rounded-full"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div
                className="bd flex shrink-0 items-center justify-center rounded-full bg-accent-2 font-bold text-sm"
                style={{ width: 36, height: 36 }}
              >
                {owner[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate font-mono text-base font-bold">
                {result.repo}
              </div>
              <div className="text-xs text-muted">
                {result.projectType?.type && result.projectType.type !== 'unknown' ? (
                  <>
                    Detected as <strong>{TYPE_LABELS[result.projectType.type as keyof typeof TYPE_LABELS]}</strong> ·{' '}
                    {result.fileCount} files
                  </>
                ) : (
                  <>GitHub repo · {result.fileCount} files</>
                )}
              </div>
            </div>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            {verdictCopy(result.score)}
          </p>

          <button
            onClick={copyFull}
            className="bd bs press mt-6 inline-flex items-center gap-2 rounded-xl bg-accent-3 px-4 py-2.5 text-[13px] font-bold"
          >
            {copied ? <CheckIcon size={15} /> : <ClipboardIcon size={15} />}
            {copied ? 'Copied to clipboard' : 'Copy full report for AI'}
          </button>
        </div>
      </div>
    </div>
  );
}

function verdictCopy(score: number): string {
  if (score >= 70)
    return 'This is a prototype, not a product. The issues below are why people bounce. Fix the red ones first.';
  if (score >= 50)
    return 'Clear vibecoded signals. Work through the critical issues before you share this link with anyone.';
  if (score >= 30)
    return 'Getting close. A few rough edges are keeping this from feeling finished.';
  if (score >= 15)
    return 'Looking solid. Polish the remaining items and ship it.';
  return 'This looks professional. The remaining items are minor — you can ship.';
}