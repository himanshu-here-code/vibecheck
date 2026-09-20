import { NextRequest, NextResponse } from 'next/server';
import { parseRepoUrl, buildRepoContext } from '@/lib/github';
import { runAllChecks } from '@/lib/checks';
import { cacheScan, getCachedScan } from '@/lib/cache';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Used by the share preview route to fetch a cached result
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  if (!repo) {
    return NextResponse.json({ error: 'Missing repo' }, { status: 400 });
  }
  const cached = getCachedScan(repo);
  if (!cached) {
    return NextResponse.json({ error: 'Not cached' }, { status: 404 });
  }
  return NextResponse.json(cached);
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body — expected JSON' },
        { status: 400 }
      );
    }

    const { repoUrl } = body;
    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json(
        { error: 'Missing repoUrl in request body' },
        { status: 400 }
      );
    }

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Try "owner/repo" or a github.com URL.' },
        { status: 400 }
      );
    }

    let ctx;
    try {
      ctx = await buildRepoContext(parsed.owner, parsed.repo);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? 'Failed to fetch repository from GitHub.' },
        { status: 400 }
      );
    }

    let result;
    try {
      result = await runAllChecks(ctx);
    } catch (e: any) {
      console.error('[scan] check failed:', e);
      return NextResponse.json(
        {
          error: 'Analysis failed.',
          detail: e?.message ?? String(e),
        },
        { status: 500 }
      );
    }

    // Cache it for sharing
    cacheScan(result.repo, result);

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[scan] unexpected error:', e);
    return NextResponse.json(
      { error: 'Unexpected server error', detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}