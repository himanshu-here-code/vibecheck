import { NextRequest, NextResponse } from 'next/server';
import { decodeScanFromUrl } from '@/lib/cache';

export const runtime = 'edge';

const SITE_URL = 'https://vibecheck-one-swart.vercel.app';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encoded = searchParams.get('d');

  if (!encoded) return NextResponse.redirect(SITE_URL, 302);

  const data = decodeScanFromUrl(encoded);
  if (!data) return NextResponse.redirect(SITE_URL, 302);

  const { repo, score, grade, issueCount } = data;
  const issueWord = issueCount === 1 ? 'issue' : 'issues';

  // Reddit title — factual, no marketing. r/SideProject and r/webdev
  // prefer specifics. Keep it under 300 chars (Reddit's limit).
  let title: string;

  if (issueCount === 0) {
    title = `Ran ${repo} through VibeCheck — clean project, 0 issues`;
  } else if (score >= 70) {
    title = `${repo} scored ${score}% on VibeCheck — ${issueCount} ${issueWord} to fix`;
  } else if (score >= 50) {
    title = `${repo} came back at ${score}% vibecoded — ${issueCount} ${issueWord} worth a look`;
  } else if (score >= 30) {
    title = `${repo} scored ${score}% vibecoded — ${issueCount} ${issueWord} left`;
  } else if (score >= 15) {
    title = `${repo} scored ${score}% vibecoded — ${issueCount} minor ${issueWord}`;
  } else {
    title = `${repo} scored ${score}% vibecoded — looks professional`;
  }

  const shareUrl = `${SITE_URL}/?repo=${encodeURIComponent(
    repo
  )}&d=${encoded}`;

  const intent = new URL('https://www.reddit.com/submit');
  intent.searchParams.set('url', shareUrl);
  intent.searchParams.set('title', title);

  return NextResponse.redirect(intent.toString(), 302);
}