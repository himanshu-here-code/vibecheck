'use client';
import { useEffect, useState } from 'react';
import { ScoreRing } from './ScoreRing';
import { ClipboardIcon, CheckIcon } from './Icons';
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
    } catch {
      // ignore
    }
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
              // eslint-disable-next-line @next/next/no-img-element
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
                {typeLabel ? (
                  <>
                    Detected as <strong>{typeLabel}</strong>
                    {purposeLabel && (
                      <>
                        {' · '}
                        <strong>{purposeLabel}</strong>
                      </>
                    )}
                    {' · '}
                    {result.fileCount} files
                  </>
                ) : (
                  <>GitHub repo · {result.fileCount} files</>
                )}
              </div>
            </div>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            {verdictCopy(result.score, result.projectPurpose?.purpose)}
          </p>

          {skippedChecks.length > 0 && (
            <div
              className="mt-4 rounded-xl border px-3.5 py-2.5 text-[12px] leading-relaxed"
              style={{
                borderColor: 'rgba(10,10,10,0.1)',
                background: 'rgba(10,10,10,0.03)',
                color: '#6b6b6b',
              }}
            >
              <span className="font-bold" style={{ color: '#0a0a0a' }}>
                {skippedChecks.length} check
                {skippedChecks.length === 1 ? '' : 's'} skipped:{' '}
              </span>
              {skippedChecks.join(', ')}.{' '}
              {skipReason(result.projectType?.type ?? 'unknown')}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={copyFull}
              className="bd bs-sm press-sm inline-flex items-center gap-2 rounded-xl bg-accent-3 px-4 py-2.5 text-[13px] font-bold"
            >
              {copied ? <CheckIcon size={15} /> : <ClipboardIcon size={15} />}
              {copied ? 'Copied' : 'Copy report for AI'}
            </button>

            <ShareButton
              repo={result.repo}
              score={result.score}
              grade={result.grade}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Type-aware explanation for why checks were skipped. Reads better than
 * the generic "not a user-facing product" message.
 */
function skipReason(type: string): string {
  switch (type) {
    case 'library':
      return 'App-level checks (legal, SEO, error states) don\u2019t apply to libraries and SDKs.';
    case 'cli-tool':
      return 'Web-specific checks don\u2019t apply to command-line tools.';
    case 'docs':
      return 'App-level checks don\u2019t apply to documentation sites.';
    case 'api-service':
      return 'Frontend checks don\u2019t apply to backend services.';
    case 'browser-extension':
      return 'Some web checks don\u2019t apply to browser extensions.';
    default:
      return 'Some checks don\u2019t apply to this kind of project.';
  }
}

function verdictCopy(score: number, purpose?: string): string {
  const isLowExpectation =
    purpose === 'learning' ||
    purpose === 'experiment' ||
    purpose === 'docs' ||
    purpose === 'boilerplate';

  if (isLowExpectation) {
    if (score >= 60)
      return 'Rough around the edges, but for a project like this, that\u2019s expected. Focus on the critical issues only.';
    if (score >= 30)
      return 'A few code quality issues, nothing serious for a project with this purpose.';
    if (score >= 15)
      return 'Clean. Nothing worth fixing unless you\u2019re planning to turn this into a product.';
    return 'Very clean. Looks well maintained.';
  }

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