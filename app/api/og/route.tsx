import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getCachedScan } from '@/lib/cache';

export const runtime = 'edge';

const SEV_COLORS = {
  critical: '#ef4444',
  high:     '#fbbf24',
  medium:   '#38bdf8',
  low:      '#34d399',
} as const;

function scoreColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#fbbf24';
  if (score >= 30) return '#fbbf24';
  return '#34d399';
}

function verdict(score: number): string {
  if (score >= 70) return 'This is a prototype';
  if (score >= 50) return 'Clear vibecoded signals';
  if (score >= 30) return 'Getting close';
  if (score >= 15) return 'Looking solid';
  return 'Looks professional';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const repoParam = searchParams.get('repo') ?? 'owner/repo';

  // Try cache first — this is the whole point of sharing
  const cached = getCachedScan(repoParam);

  const repo = cached?.repo ?? repoParam;
  const score = cached?.score ?? parseInt(searchParams.get('score') ?? '0', 10);
  const issueCount = cached?.issues.length ?? parseInt(searchParams.get('issues') ?? '0', 10);
  const passedCount = cached?.passed.length ?? parseInt(searchParams.get('passed') ?? '0', 10);
  const type = (cached as any)?.projectType?.type ?? searchParams.get('type') ?? '';
  const purpose = (cached as any)?.projectPurpose?.purpose ?? searchParams.get('purpose') ?? '';

  let topIssues: { title: string; severity: keyof typeof SEV_COLORS }[] = [];
  if (cached) {
    topIssues = cached.issues.slice(0, 3).map((i: any) => ({
      title: i.title,
      severity: i.severity,
    }));
  } else {
    try {
      const raw = searchParams.get('top') ?? '[]';
      topIssues = JSON.parse(raw).slice(0, 3);
    } catch {
      // ignore
    }
  }

  const color = scoreColor(score);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#f4f1ff',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: '4px solid #0a0a0a',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            padding: '48px 56px',
            background: '#ffffff',
            boxShadow: '12px 12px 0 0 #0a0a0a',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#8b5cf6',
                  border: '3px solid #0a0a0a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '22px',
                  fontWeight: 900,
                }}
              >
                ✓
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#0a0a0a',
                  display: 'flex',
                  gap: '4px',
                }}
              >
                <span>Vibe</span>
                <span style={{ color: '#8b5cf6', fontStyle: 'italic' }}>Check</span>
              </div>
            </div>
            {type && (
              <div
                style={{
                  fontSize: '18px',
                  color: '#6b6b6b',
                  fontWeight: 600,
                  display: 'flex',
                }}
              >
                {purpose ? `${type} · ${purpose}` : type}
              </div>
            )}
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', flex: 1, gap: '48px', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '260px',
                height: '260px',
                borderRadius: '50%',
                border: `16px solid ${color}`,
                outline: '6px solid #0a0a0a',
                background: '#fff',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: '88px',
                  fontWeight: 900,
                  color: '#0a0a0a',
                  lineHeight: 1,
                  letterSpacing: '-0.05em',
                  display: 'flex',
                }}
              >
                {score}
                <span style={{ fontSize: '40px' }}>%</span>
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#6b6b6b',
                  marginTop: '8px',
                  display: 'flex',
                }}
              >
                vibecoded
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#6b6b6b',
                  display: 'flex',
                }}
              >
                Report for
              </div>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  color: '#0a0a0a',
                  marginTop: '8px',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {repo}
              </div>

              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#0a0a0a',
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span
                  style={{
                    padding: '6px 14px',
                    background: color,
                    color: score >= 50 && score < 70 ? '#0a0a0a' : '#fff',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 900,
                    border: '3px solid #0a0a0a',
                    display: 'flex',
                  }}
                >
                  {issueCount} issue{issueCount === 1 ? '' : 's'}
                </span>
                <span
                  style={{
                    padding: '6px 14px',
                    background: '#34d399',
                    color: '#0a0a0a',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 900,
                    border: '3px solid #0a0a0a',
                    display: 'flex',
                  }}
                >
                  {passedCount} passed
                </span>
              </div>

              {topIssues.length > 0 && (
                <div
                  style={{
                    marginTop: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {topIssues.map((issue, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '16px',
                        color: '#0a0a0a',
                        fontWeight: 500,
                      }}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: SEV_COLORS[issue.severity] ?? '#999',
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {issue.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '3px solid #0a0a0a',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0a0a0a',
                display: 'flex',
              }}
            >
              {verdict(score)}
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#8b5cf6',
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