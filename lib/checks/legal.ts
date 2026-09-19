import { Issue, RepoContext } from '../types';

export async function checkLegal(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];

  const hasPath = (re: RegExp) => ctx.files.some((f) => re.test(f));

  // Privacy policy
  if (!hasPath(/privacy/i)) {
    issues.push({
      id: 'legal.privacy',
      category: 'legal',
      severity: 'critical',
      title: 'No privacy policy',
      description:
        'You have no privacy page. If you collect ANY user data (analytics, auth, cookies), this is legally required in the EU/UK/California and most app stores.',
      fix: 'Add `/privacy` page. Use a generator like termly.io or freeprivacypolicy.com, or write your own. Link it in your footer.',
      docs: 'https://gdpr.eu/privacy-notice/',
    });
  } else passed.push('legal.privacy');

  // Terms
  if (!hasPath(/terms|tos/i)) {
    issues.push({
      id: 'legal.terms',
      category: 'legal',
      severity: 'critical',
      title: 'No terms of service',
      description:
        'No terms page found. You need this to limit liability, define acceptable use, and handle account termination.',
      fix: 'Add `/terms` page. Link in footer + signup flow.',
    });
  } else passed.push('legal.terms');

  // Cookie banner — search source
  const sourceFiles = ctx.files.filter((f) =>
    /\.(tsx?|jsx?|vue|svelte|html)$/.test(f) &&
    !f.includes('node_modules')
  );
  let hasCookieBanner = false;
  // Only sample a subset to avoid hammering
  for (const f of sourceFiles.slice(0, 40)) {
    const content = await ctx.getFile(f);
    if (!content) continue;
    if (/cookie[- ]?(consent|banner|notice)|CookieConsent|react-cookie-consent/i.test(content)) {
      hasCookieBanner = true;
      break;
    }
  }
  if (!hasCookieBanner) {
    issues.push({
      id: 'legal.cookies',
      category: 'legal',
      severity: 'high',
      title: 'No cookie consent banner detected',
      description:
        'If you use any analytics or tracking cookies, GDPR requires an opt-in banner. Even Vercel Analytics with cookies counts.',
      fix: 'Add a cookie consent component. `react-cookie-consent` is free and works. Or use a hosted banner.',
    });
  } else passed.push('legal.cookies');

  // License
  if (!hasPath(/^LICENSE/i)) {
    issues.push({
      id: 'legal.license',
      category: 'legal',
      severity: 'low',
      title: 'No LICENSE file',
      description:
        'Without a license, others can\'t legally use your code, and it looks unfinished to contributors.',
      fix: 'Add a LICENSE file. MIT if open source, or "All rights reserved" if proprietary.',
    });
  } else passed.push('legal.license');

  // Contact
  if (!hasPath(/contact/i)) {
    issues.push({
      id: 'legal.contact',
      category: 'legal',
      severity: 'medium',
      title: 'No contact page or email',
      description:
        'Users and legal authorities need a way to reach you. Payment processors (Stripe) also require this.',
      fix: 'Add `/contact` page or mailto link in footer.',
    });
  } else passed.push('legal.contact');

  return { issues, passed };
}