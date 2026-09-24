import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getCachedScan, decodeScanFromUrl } from '@/lib/cache';

export const runtime = 'edge';

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#fbbf24',
  medium: '#38bdf8',
  low: '#34d399',
};

const THEMES = {
  light: {
    bg: '#f4f1ff',
    card: '#ffffff',
    fg: '#0a0a0a',
    muted: '#6b6b6b',
    border: '#0a0a0a',
    accent: '#8b5cf6',
    shadow: '#0a0a0a',
  },
  dark: {
    bg: '#0a0812',
    card: '#161221',
    fg: '#fafafa',
    muted: '#9d97b3',
    border: '#f4f1ff',
    accent: '#a78bfa',
    shadow: '#a78bfa',
  },
} as const;

function scoreColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 30) return '#fbbf24';
  if (score >= 15) return '#84cc16';
  return '#22c55e';
}

function verdict(score: number): string {
  if (score >= 70) return 'This is a prototype';
  if (score >= 50) return 'Clear vibecoded signals';
  if (score >= 30) return 'Getting close';
  if (score >= 15) return 'Looking solid';
  return 'Looks professional';
}

const TYPE_LABELS: Record<string, string> = {
  'web-app': 'Web app',
  'cli-tool': 'CLI tool',
  library: 'Library',
  'mobile-app': 'Mobile app',
  'browser-extension': 'Extension',
  'api-service': 'API',
  docs: 'Docs',
};

const PURPOSE_LABELS: Record<string, string> = {
  product: 'product',
  learning: 'learning',
  portfolio: 'portfolio',
  docs: 'docs',
  boilerplate: 'template',
  experiment: 'experiment',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo') ?? '';
  const encoded = searchParams.get('d');
  const themeParam = searchParams.get('theme');
  const theme: 'light' | 'dark' = themeParam === 'dark' ? 'dark' : 'light';
  const t = THEMES[theme];

  // ---------------------------------------------------------------------------
  // Decode
  // ---------------------------------------------------------------------------
  let repoName = repo || 'owner/repo';
  let score = 0;
  let issueCount = 0;
  let passedCount = 0;
  let type = '';
  let purpose = '';
  let topSeverity = '';
  let topTitle = '';
  let hasValidData = false;

  if (encoded) {
    const decoded = decodeScanFromUrl(encoded);
    if (decoded && decoded.repo) {
      repoName = decoded.repo;
      score = decoded.score;
      issueCount = decoded.issueCount;
      passedCount = decoded.passedCount;
      type = decoded.type;
      purpose = decoded.purpose;
      topSeverity = decoded.topSeverity;
      topTitle = decoded.topTitle;
      hasValidData = true;
    }
  } else if (repo) {
    const cached = getCachedScan(repo);
    if (cached) {
      repoName = cached.repo;
      score = cached.score;
      issueCount = cached.issues.length;
      passedCount = cached.passed.length;
      type = (cached as any).projectType?.type ?? '';
      purpose = (cached as any).projectPurpose?.purpose ?? '';
      if (cached.issues[0]) {
        topSeverity = cached.issues[0].severity;
        topTitle = cached.issues[0].title;
      }
      hasValidData = true;
    }
  }

  const color = scoreColor(score);
  const verdictText = verdict(score);

  const typeLabel = TYPE_LABELS[type] ?? '';
  const purposeLabel = PURPOSE_LABELS[purpose] ?? '';
  const metaLine = [typeLabel, purposeLabel].filter(Boolean).join(' · ');

  // ---------------------------------------------------------------------------
  // Fallback if we couldn't decode
  // ---------------------------------------------------------------------------
  if (!hasValidData) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: t.bg,
            padding: '80px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
              background: t.card,
              border: `6px solid ${t.border}`,
              borderRadius: '32px',
              boxShadow: `16px 16px 0 0 ${t.shadow}`,
              padding: '72px 96px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: t.accent,
                border: `5px solid ${t.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '44px',
                fontWeight: 900,
              }}
            >
              ✓
            </div>
            <div
              style={{
                fontSize: '52px',
                fontWeight: 900,
                color: t.fg,
                letterSpacing: '-0.03em',
                display: 'flex',
                gap: '12px',
              }}
            >
              <span>Vibe</span>
              <span style={{ color: t.accent, fontStyle: 'italic' }}>Check</span>
            </div>
            <div
              style={{
                fontSize: '22px',
                color: t.muted,
                fontWeight: 600,
                display: 'flex',
                textAlign: 'center',
              }}
            >
              Scan any GitHub repo for vibecoded tells
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // ---------------------------------------------------------------------------
  // Main card
  // ---------------------------------------------------------------------------
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: t.bg,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            background: t.card,
            border: `6px solid ${t.border}`,
            borderRadius: '32px',
            boxShadow: `16px 16px 0 0 ${t.shadow}`,
            padding: '52px 60px',
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '36px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '13px',
                  background: t.accent,
                  border: `4px solid ${t.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '26px',
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                ✓
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  letterSpacing: '-0.025em',
                  color: t.fg,
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <span>Vibe</span>
                <span style={{ color: t.accent, fontStyle: 'italic' }}>
                  Check
                </span>
              </div>
            </div>
            {metaLine && (
              <div
                style={{
                  fontSize: '18px',
                  color: t.muted,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  display: 'flex',
                }}
              >
                {metaLine}
              </div>
            )}
          </div>

          {/* Middle */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              gap: '52px',
              alignItems: 'center',
            }}
          >
            {/* Ring */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '260px',
                height: '260px',
                borderRadius: '50%',
                border: `20px solid ${color}`,
                outline: `8px solid ${t.border}`,
                background: t.card,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: '92px',
                  fontWeight: 900,
                  color: t.fg,
                  lineHeight: 1,
                  letterSpacing: '-0.065em',
                  display: 'flex',
                }}
              >
                {score}
                <span style={{ fontSize: '40px', marginTop: '6px' }}>%</span>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: t.muted,
                  marginTop: '10px',
                  display: 'flex',
                }}
              >
                vibecoded
              </div>
            </div>

            {/* Info */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: t.muted,
                  display: 'flex',
                }}
              >
                Report for
              </div>
              <div
                style={{
                  fontSize: '40px',
                  fontWeight: 900,
                  color: t.fg,
                  marginTop: '10px',
                  lineHeight: 1.05,
                  letterSpacing: '-0.025em',
                  display: 'flex',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {repoName}
              </div>

              {topTitle ? (
                <div
                  style={{
                    marginTop: '26px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: SEV_COLORS[topSeverity] ?? '#999',
                      flexShrink: 0,
                      marginTop: '8px',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: t.fg,
                      lineHeight: 1.25,
                      display: 'flex',
                    }}
                  >
                    {topTitle}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: '26px',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </div>
                  No issues found
                </div>
              )}

              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: t.muted,
                  marginTop: '22px',
                  display: 'flex',
                  gap: '28px',
                }}
              >
                <span style={{ display: 'flex', gap: '8px' }}>
                  <strong style={{ color: t.fg }}>{issueCount}</strong>
                  issue{issueCount === 1 ? '' : 's'}
                </span>
                <span style={{ display: 'flex', gap: '8px' }}>
                  <strong style={{ color: t.fg }}>{passedCount}</strong>
                  passed
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '32px',
              paddingTop: '26px',
              borderTop: `5px solid ${t.border}`,
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: t.fg,
                fontStyle: 'italic',
                letterSpacing: '-0.01em',
                display: 'flex',
              }}
            >
              {verdictText}
            </div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: t.accent,
                display: 'flex',
              }}
            >
              vibecheck-one-swart.vercel.app
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}