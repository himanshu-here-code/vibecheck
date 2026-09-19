import { Issue, RepoContext } from '../types';

/**
 * Legal & Trust checks.
 *
 * Instead of relying on filenames alone, we inspect file *content* for the
 * language that privacy policies, terms, and contact pages actually use.
 *
 * Why: a file called `pp.tsx` is a privacy policy. A file called
 * `privacy.tsx` that contains "Coming soon" is not.
 */

// -----------------------------------------------------------------------------
// Content signature helpers
// -----------------------------------------------------------------------------

/** Strong signals that a file is a real privacy policy. */
function looksLikePrivacyPolicy(content: string): boolean {
  const text = content.toLowerCase();
  // Must have at least 2 of these to count — one could be a stray word
  const signals = [
    /we (collect|process|store|handle|share) (your|personal|user)/i,
    /(gdpr|ccpa|california consumer privacy)/i,
    /you (have the right|can request|may opt out|can delete)/i,
    /(cookie|tracking) (policy|preferences|consent)/i,
    /data (controller|processor|protection officer)/i,
    /(opt[- ]out|unsubscribe|delete your account)/i,
  ];
  return signals.filter((r) => r.test(text)).length >= 2;
}

/** Strong signals that a file is a real terms of service. */
function looksLikeTerms(content: string): boolean {
  const text = content.toLowerCase();
  const signals = [
    /(terms (of|and) (service|use)|terms & conditions)/i,
    /you (agree|acknowledge|warrant) (to|that)/i,
    /(governing law|jurisdiction|venue)/i,
    /(limitation of liability|limitation on liability)/i,
    /we (reserve|may) (the right|terminate|suspend)/i,
    /(indemnif|hold harmless)/i,
  ];
  return signals.filter((r) => r.test(text)).length >= 2;
}

/** Is this a real contact page (as opposed to a nav item)? */
function looksLikeContactPage(content: string): boolean {
  const text = content.toLowerCase();
  const signals = [
    /(get in touch|contact us|reach out|say hi|say hello)/i,
    /(email|mail) us at/i,
    /@[a-z0-9-]+\.[a-z]{2,}/i, // has an actual email address
    /(github\.com\/|mailto:|twitter\.com\/|x\.com\/)/i, // has a real contact link
  ];
  return signals.filter((r) => r.test(text)).length >= 2;
}

// -----------------------------------------------------------------------------
// Multi-file detection
// -----------------------------------------------------------------------------

/**
 * Scan candidate files for a content signature.
 *
 * @param ctx       The repo context
 * @param filenameRe  Which files are worth opening (loose match)
 * @param signature   The content test to run
 * @param maxFiles    Upper limit on files to open (rate-limit safety)
 */
async function findFileWithContent(
  ctx: RepoContext,
  filenameRe: RegExp,
  signature: (c: string) => boolean,
  maxFiles = 25
): Promise<string | null> {
  // Look for both filename matches AND common content files
  const candidates = ctx.files
    .filter((f) => !f.includes('node_modules') && !f.includes('.next'))
    .filter((f) => /\.(tsx?|jsx?|vue|svelte|mdx?|html)$/i.test(f))
    .filter(
      (f) =>
        filenameRe.test(f) ||
        // Also open likely locations even if the filename doesn't match
        /(^|\/)(pages?|app|routes?|legal|about)\//i.test(f)
    )
    .slice(0, maxFiles);

  for (const f of candidates) {
    const content = await ctx.getFile(f);
    if (content && signature(content)) {
      return f;
    }
  }
  return null;
}

// -----------------------------------------------------------------------------
// The check
// -----------------------------------------------------------------------------

export async function checkLegal(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];

  // ---- Privacy policy ------------------------------------------------------
  const privacyFile = await findFileWithContent(
    ctx,
    /(privacy|^pp\.|[/_-]pp\.|legal)/i,
    looksLikePrivacyPolicy
  );

  if (!privacyFile) {
    issues.push({
      id: 'legal.privacy',
      category: 'legal',
      severity: 'critical',
      title: 'No privacy policy',
      description:
        'We couldn\u2019t find any file that reads like a real privacy policy. If you collect any user data — analytics, auth, payments — this is legally required in the EU, UK, and California.',
      fix:
        'Add a `/privacy` page with a policy covering: what data you collect, how it\u2019s used, third parties involved, user rights, and a contact method. A generator like termly.io works fine.',
      docs: 'https://gdpr.eu/privacy-notice/',
    });
  } else {
    passed.push('legal.privacy');
  }

  // ---- Terms of service ----------------------------------------------------
  const termsFile = await findFileWithContent(
    ctx,
    /(terms|tos|^tos\.|legal)/i,
    looksLikeTerms
  );

  if (!termsFile) {
    issues.push({
      id: 'legal.terms',
      category: 'legal',
      severity: 'critical',
      title: 'No terms of service',
      description:
        'No file reads like real terms. You need these to define acceptable use, limit liability, and handle account termination.',
      fix:
        'Add a `/terms` page. Link it in the footer and in your signup flow. Cover: acceptable use, account rules, IP ownership, liability limits, and governing law.',
    });
  } else {
    passed.push('legal.terms');
  }

  // ---- Cookie consent ------------------------------------------------------
  // Only check if there's actual tracking in the codebase
  const hasTracking = await detectTracking(ctx);
  if (hasTracking) {
    const cookieFile = await findFileWithContent(
      ctx,
      /cookie|consent|gdpr/i,
      (c) =>
        /(cookie (consent|banner|policy)|accept (all )?cookies|gdpr (consent|banner))/i.test(
          c
        ),
      15
    );
    if (!cookieFile) {
      issues.push({
        id: 'legal.cookies',
        category: 'legal',
        severity: 'high',
        title: 'Tracking detected, but no cookie consent',
        description:
          'We found analytics or tracking code, but no consent banner. GDPR requires opt-in for tracking cookies.',
        fix:
          'Add a cookie consent component. `react-cookie-consent` is free and works with any framework.',
      });
    } else {
      passed.push('legal.cookies');
    }
  }

  // ---- License -------------------------------------------------------------
  const hasLicense = ctx.files.some((f) => /(^|\/)LICENSE(\.|$)/i.test(f));
  if (!hasLicense) {
    issues.push({
      id: 'legal.license',
      category: 'legal',
      severity: 'low',
      title: 'No LICENSE file',
      description:
        "Without a license, others can't legally use or contribute to your code.",
      fix:
        'Add a LICENSE at your repo root. MIT if you want it open, or a proprietary notice if you don\u2019t.',
    });
  } else {
    passed.push('legal.license');
  }

  // ---- Contact -------------------------------------------------------------
  const contactFile = await findFileWithContent(
    ctx,
    /contact/i,
    looksLikeContactPage,
    15
  );
  if (!contactFile) {
    issues.push({
      id: 'legal.contact',
      category: 'legal',
      severity: 'medium',
      title: 'No contact page or email',
      description:
        'Users need a way to reach you. Payment processors and app stores also require this.',
      fix:
        'Add a `/contact` page, a mailto link in your footer, or a clearly linked GitHub issues URL.',
    });
  } else {
    passed.push('legal.contact');
  }

  return { issues, passed };
}

// -----------------------------------------------------------------------------
// Helper: does the repo actually track anything?
// -----------------------------------------------------------------------------

async function detectTracking(ctx: RepoContext): Promise<boolean> {
  const pkg = await ctx.getFile('package.json');
  if (pkg) {
    const trackingLibs = [
      'analytics',
      'posthog',
      'mixpanel',
      'amplitude',
      'hotjar',
      'gtag',
      'plausible',
      'umami',
      'matomo',
      'segment',
    ];
    const lower = pkg.toLowerCase();
    if (trackingLibs.some((lib) => lower.includes(lib))) return true;
  }
  // Look for tracking in the actual source
  const sample = ctx.files
    .filter((f) => /\.(tsx?|jsx?|html)$/i.test(f) && !f.includes('node_modules'))
    .slice(0, 20);
  for (const f of sample) {
    const c = await ctx.getFile(f);
    if (!c) continue;
    if (
      /(gtag|googletagmanager|plausible\.io|posthog\.|mixpanel\.|hotjar\.|@vercel\/analytics|umami\.)/i.test(
        c
      )
    ) {
      return true;
    }
  }
  return false;
}