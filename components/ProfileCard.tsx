'use client';
import { useEffect, useState } from 'react';
import { ScoreRing } from './ScoreRing';
import { ClipboardIcon, CheckIcon, LockIcon } from './Icons';
import { ShareButton } from './ShareButton';
import { PURPOSE_LABELS } from '@/lib/detect/checks-by-purpose';
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
  const [showPrivate, setShowPrivate] = useState(false);

  useEffect(() => {
    const [ownerLogin] = (result.repo as string).split('/');
    setOwner(ownerLogin);

    fetch(`https://api.github.com/users/${ownerLogin}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.avatar_url) setAvatar(d.avatar_url);
      })
      .catch(() => {});
  }, [result.repo]);

  async function copyFull() {
    try {
      await navigator.clipboard.writeText(buildFullReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  }

  const typeLabel =
    result.projectType?.type && result.projectType.type !== 'unknown'
      ? TYPE_LABELS[result.projectType.type as keyof typeof TYPE_LABELS]
      : null;

  const purposeLabel =
    result.projectPurpose?.purpose &&
    result.projectPurpose.purpose !== 'unknown'
      ? PURPOSE_LABELS[
          result.projectPurpose.purpose as keyof typeof PURPOSE_LABELS
        ]
      : null;

  const skippedChecks: string[] = result.skippedChecks ?? [];
  const isPrivate = !!result.private;

  return (
    <div className="bd bs-lg rounded-3xl bg-card p-8 md:p-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        <ScoreRing score={result.score} />

        <div className="min-w-0 flex-1">
          {/* Report label + private badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Report for
            </div>
            {isPrivate && (
              <button
                onClick={() => setShowPrivate(!showPrivate)}
                className="inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{
                  background: '#fbbf24',
                  borderColor: '#0a0a0a',
                  color: '#0a0a0a',
                }}
              >
                <LockIcon size={10} />
                Private
              </button>
            )}
          </div>

          {/* Repo identity */}
          <div className="mt-3 flex items-center gap-3">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={owner}
                width={40}
                height={40}
                className="bd shrink-0 rounded-full"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div
                className="bd flex shrink-0 items-center justify-center rounded-full bg-accent-2 font-bold"
                style={{ width: 40, height: 40 }}
              >
                {owner[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate font-mono text-lg font-bold leading-tight">
                {result.repo}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {typeLabel ? (
                  <>
                    {typeLabel}
                    {purposeLabel && <> · {purposeLabel}</>}
                    {' · '}
                    {result.fileCount} files
                  </>
                ) : (
                  <>{result.fileCount} files analyzed</>
                )}
              </div>
            </div>
          </div>

          {/* Verdict */}
          <p className="mt-5 text-[15px] leading-relaxed">
            {verdictCopy(result.score, result.projectPurpose?.purpose)}
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={copyFull}
              className="bd bs-sm press-sm inline-flex items-center gap-2 rounded-xl bg-accent-3 px-4 py-2.5 text-[13px] font-bold"
            >
              {copied ? <CheckIcon size={15} /> : <ClipboardIcon size={15} />}
              {copied ? 'Copied' : 'Copy fix prompt for AI'}
            </button>

            {!isPrivate && (
              <ShareButton
                repo={result.repo}
                score={result.score}
                grade={result.grade}
              />
            )}

            {isPrivate && (
              <button
                onClick={() => setShowPrivate(!showPrivate)}
                className="bd bs-sm press-sm inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-[13px] font-bold"
              >
                <LockIcon size={14} />
                Why no share?
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Private scan info panel */}
      {isPrivate && showPrivate && (
        <div
          className="pop mt-6 rounded-xl border-2 px-4 py-3 text-[13px] leading-relaxed"
          style={{ borderColor: '#0a0a0a', background: '#fef9ec' }}
        >
          <p>
            <strong>This was a private scan.</strong> Your GitHub token was
            used for this request only and was not stored. The result is not
            cached, so this report exists only in your browser tab.
          </p>
        </div>
      )}

      {/* Skipped checks — a single quiet line */}
      {skippedChecks.length > 0 && (
        <div
          className="mt-6 flex items-start gap-2 text-[12px] leading-relaxed"
          style={{ color: '#6b6b6b' }}
        >
          <span
            className="shrink-0 mt-[3px] h-1.5 w-1.5 rounded-full"
            style={{ background: 'rgba(10,10,10,0.2)' }}
          />
          <span>
            <strong style={{ color: '#0a0a0a' }}>
              {skippedChecks.length} check
              {skippedChecks.length === 1 ? '' : 's'} skipped.
            </strong>{' '}
            {skipReason(result.projectType?.type ?? 'unknown')}
          </span>
        </div>
      )}
    </div>
  );
}

function skipReason(type: string): string {
  switch (type) {
    case 'library':
      return 'App-level checks don\u2019t apply to libraries and SDKs.';
    case 'cli-tool':
      return 'Web checks don\u2019t apply to CLI tools.';
    case 'docs':
      return 'App-level checks don\u2019t apply to documentation.';
    case 'api-service':
      return 'Frontend checks don\u2019t apply to backend services.';
    case 'browser-extension':
      return 'Some web checks don\u2019t apply to browser extensions.';
    default:
      return 'Some checks don\u2019t apply to this kind of project.';
  }
}

function verdictCopy(score: number, purpose?: string): string {
  const isLow =
    purpose === 'learning' ||
    purpose === 'experiment' ||
    purpose === 'docs' ||
    purpose === 'boilerplate';

  if (isLow) {
    if (score >= 60)
      return 'Rough around the edges, but expected for a project with this purpose. Fix the criticals if you care about polish.';
    if (score >= 30)
      return 'A few code quality issues, nothing serious for this kind of project.';
    if (score >= 15)
      return 'Clean. Nothing to fix unless you plan to ship this as a product.';
    return 'Very clean. Well maintained.';
  }

  if (score >= 70)
    return 'This is a prototype, not a product. The issues below are why people bounce — fix the criticals first.';
  if (score >= 50)
    return 'Clear vibecoded signals. Work through the critical issues before sharing this link.';
  if (score >= 30)
    return 'Getting close. A few rough edges are keeping this from feeling finished.';
  if (score >= 15)
    return 'Looking solid. Polish the remaining items and ship it.';
  return 'This looks professional. The remaining items are minor.';
}