import { NextRequest, NextResponse } from 'next/server';
import { parseRepoUrl, buildRepoContext } from '@/lib/github';
import { runAllChecks } from '@/lib/checks';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();
    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json({ error: 'Missing repoUrl' }, { status: 400 });
    }

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Try "owner/repo" or a full github.com URL.' },
        { status: 400 }
      );
    }

    const ctx = await buildRepoContext(parsed.owner, parsed.repo);
    const result = await runAllChecks(ctx);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Scan failed' },
      { status: 500 }
    );
  }
}