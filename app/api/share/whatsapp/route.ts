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

  // Short, conversational. Two lines. URL on its own line.
  let lead: string;

  if (issueCount === 0) {
    lead = `Ran ${repo} through VibeCheck — scored ${score}% (grade ${grade}). No issues found.`;
  } else if (score >= 70) {
    lead = `Ran ${repo} through VibeCheck — scored ${score}% (grade ${grade}). ${issueCount} ${issueWord} worth fixing.`;
  } else if (score >= 50) {
    lead = `${repo} scored ${score}% on VibeCheck — ${issueCount} ${issueWord} to work through.`;
  } else if (score >= 30) {
    lead = `${repo} scored ${score}% on VibeCheck — getting close, ${issueCount} ${issueWord} left.`;
  } else if (score >= 15) {
    lead = `${repo} scored ${score}% on VibeCheck — looking solid, only ${issueCount} minor ${issueWord}.`;
  } else {
    lead = `${repo} scored ${score}% on VibeCheck — this looks professional.`;
  }

  const shareUrl = `${SITE_URL}/?repo=${encodeURIComponent(
    repo
  )}&d=${encoded}`;

  // Newline separates message from URL, giving WhatsApp a clean two-line layout
  const message = `${lead}\n\n${shareUrl}`;

  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return NextResponse.redirect(waUrl, 302);
}