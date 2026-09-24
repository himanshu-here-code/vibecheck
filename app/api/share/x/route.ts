import { NextRequest, NextResponse } from 'next/server';
import { decodeScanFromUrl } from '@/lib/cache';

export const runtime = 'edge';

const SITE_URL = 'https://vibecheck-one-swart.vercel.app';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encoded = searchParams.get('d');

  if (!encoded) {
    return NextResponse.redirect(SITE_URL, 302);
  }

  const data = decodeScanFromUrl(encoded);
  if (!data) {
    return NextResponse.redirect(SITE_URL, 302);
  }

  const { repo, score, grade, issueCount } = data;
  const issueWord = issueCount === 1 ? 'issue' : 'issues';

  // Shorter tweet. The URL param is handled by Twitter's intent.
  // Keeps total character count under 280 for most repos.
  let text: string;

  if (issueCount === 0) {
    text = `${repo} scored ${score}% on VibeCheck (grade ${grade}) — clean project.`;
  } else if (score >= 70) {
    text = `${repo} scored ${score}% on VibeCheck (grade ${grade}). ${issueCount} ${issueWord} — this is a prototype, not a product.`;
  } else if (score >= 50) {
    text = `${repo} scored ${score}% on VibeCheck (grade ${grade}). ${issueCount} ${issueWord} worth fixing before launch.`;
  } else if (score >= 30) {
    text = `${repo} scored ${score}% on VibeCheck (grade ${grade}). ${issueCount} ${issueWord} left. Getting close.`;
  } else if (score >= 15) {
    text = `${repo} scored ${score}% on VibeCheck (grade ${grade}) — looking solid. ${issueCount} minor ${issueWord}.`;
  } else {
    text = `${repo} scored ${score}% on VibeCheck (grade ${grade}) — looks professional.`;
  }

  const shareUrl = `${SITE_URL}/?repo=${encodeURIComponent(
    repo
  )}&d=${encoded}`;

  const intent = new URL('https://twitter.com/intent/tweet');
  intent.searchParams.set('text', text);
  intent.searchParams.set('url', shareUrl);

  return NextResponse.redirect(intent.toString(), 302);
}