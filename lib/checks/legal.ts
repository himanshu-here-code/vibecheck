import { Issue, RepoContext } from '../types';
import type { ProjectPurpose } from '../detect/purpose';

// -----------------------------------------------------------------------------
// Content signatures
// -----------------------------------------------------------------------------

function looksLikePrivacyPolicy(content: string): boolean {
  const text = content.toLowerCase();
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

function looksLikeContactPage(content: string): boolean {
  const text = content.toLowerCase();
  const signals = [
    /(get in touch|contact us|reach out|say hi|say hello)/i,
    /(email|mail) us at/i,
    /@[a-z0-9-]+\.[a-z]{2,}/i,
    /(github\.com\/|mailto:|twitter\.com\/|x\.com\/)/i,
  ];
  return signals.filter((r) => r.test(text)).length >= 2;
}

async function findFileWithContent(
  ctx: RepoContext,
  candidates: RegExp[],
  signature: (c: string) => boolean,
  maxFiles = 30
): Promise<string | null> {
  const matches = ctx.files.filter(
    (f) =>
      !f.includes('node_modules') &&
      !f.includes('.next') &&
      !f.includes('venv/') &&
      !f.includes('__pycache__/') &&
      candidates.some((rx) => rx.test(f))
  );

  for (const f of matches.slice(0, maxFiles)) {
    const content = await ctx.getFile(f);
    if (content && signature(content)) return f;
  }

  // Fallback: scan source extension files
  const sourceMatches = ctx.files
    .filter((f) => ctx.lang.sourceExtensions.test(f))
    .filter((f) => !f.includes('node_modules') && !f.includes('venv/'))
    .slice(0, 15);

  for (const f of sourceMatches) {
    const content = await ctx.getFile(f);
    if (content && signature(content)) return f;
  }

  return null;
}

// -----------------------------------------------------------------------------
// Check
// -----------------------------------------------------------------------------

export async function checkLegal(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];
  const { lang, language } = ctx;
  const purpose = ctx.projectPurpose as ProjectPurpose | undefined;

  // -----------------------------------------------------------------------
  // Legal checks apply only to projects that actually face end users:
  // products, templates, and portfolios. Libraries, CLIs, docs, learning
  // repos, and experiments don't collect user data and don't need them.
  // -----------------------------------------------------------------------
  const LEGAL_APPLIES: ProjectPurpose[] = [
    'product',
    'boilerplate',
    'portfolio',
  ];

  if (!purpose || !LEGAL_APPLIES.includes(purpose)) {
    // Silently pass all legal checks — they don't apply here
    passed.push('legal.privacy');
    passed.push('legal.terms');
    passed.push('legal.cookies');
    passed.push('legal.license');
    passed.push('legal.contact');
    return { issues, passed };
  }

  // ---- Privacy policy ------------------------------------------------------
  const privacyFile = await findFileWithContent(
    ctx,
    lang.privacyCandidates,
    looksLikePrivacyPolicy
  );

  if (!privacyFile) {
    issues.push({
      id: 'legal.privacy',
      category: 'legal',
      severity: 'critical',
      title: 'No privacy policy',
      description: `We couldn\u2019t find a privacy policy in this ${language.primary} project. If you collect any user data — analytics, auth, payments — this is legally required in the EU, UK, and California.`,
      fix:
        'Add a privacy page with a policy covering: what data you collect, how it\u2019s used, third parties involved, user rights, and a contact method.',
      docs: 'https://gdpr.eu/privacy-notice/',
    });
  } else {
    passed.push('legal.privacy');
  }

  // ---- Terms of service ----------------------------------------------------
  const termsFile = await findFileWithContent(
    ctx,
    lang.termsCandidates,
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
        'Add a terms page. Link it in the footer and in your signup flow.',
    });
  } else {
    passed.push('legal.terms');
  }

  // ---- Cookie consent ------------------------------------------------------
  const hasTracking = await detectTracking(ctx);
  if (hasTracking) {
    const cookieFile = await findFileWithContent(
      ctx,
      [/cookie/i, /consent/i, /gdpr/i],
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
          'We found analytics or tracking code that sets cookies, but no consent banner. GDPR requires opt-in for tracking cookies.',
        fix:
          'Add a cookie consent component. Options exist for every language.',
      });
    } else {
      passed.push('legal.cookies');
    }
  } else {
    passed.push('legal.cookies');
  }

  // ---- License -------------------------------------------------------------
  const hasLicense = ctx.files.some((f) =>
    /(^|\/)(LICENSE|LICENCE|COPYING)(\.|$)/i.test(f)
  );
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
    lang.contactCandidates,
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
        'Add a contact page, a mailto link in your footer, or a clearly linked GitHub issues URL.',
    });
  } else {
    passed.push('legal.contact');
  }

  return { issues, passed };
}

// -----------------------------------------------------------------------------
// Tracking detection
// -----------------------------------------------------------------------------

async function detectTracking(ctx: RepoContext): Promise<boolean> {
  const trackingLibs = [
    'posthog',
    'mixpanel',
    'amplitude',
    'hotjar',
    'gtag',
    'googletagmanager',
    'matomo',
    '@segment/',
    'analytics-next',
    'sentry',
    'datadog',
    'newrelic',
  ];

  // JS/TS: parse package.json, check dependency NAMES
  const pkg = await ctx.getFile('package.json');
  if (pkg) {
    try {
      const data = JSON.parse(pkg);
      const deps = Object.keys({
        ...(data.dependencies ?? {}),
        ...(data.devDependencies ?? {}),
      }).map((d) => d.toLowerCase());

      for (const lib of trackingLibs) {
        if (deps.some((d) => d.includes(lib))) return true;
      }
    } catch {
      // malformed package.json
    }
  }

  // Python manifests
  const pyManifests = ['requirements.txt', 'Pipfile'];
  for (const manifest of pyManifests) {
    const content = await ctx.getFile(manifest);
    if (!content) continue;
    const lines = content.toLowerCase().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      for (const lib of trackingLibs) {
        if (trimmed.startsWith(lib) || trimmed.includes(`/${lib}`)) return true;
      }
    }
  }

  // Source-level: look for actual API calls (not comments)
  const sourceSample = ctx.files
    .filter((f) => ctx.lang.sourceExtensions.test(f))
    .filter(
      (f) =>
        !f.includes('node_modules') &&
        !f.includes('venv/') &&
        !f.includes('__pycache__/')
    )
    .slice(0, 25);

  const usagePatterns = [
    /gtag\s*\(/,
    /googletagmanager\.com\/gtag/i,
    /posthog\.(capture|identify)\s*\(/,
    /mixpanel\.(track|identify)\s*\(/,
    /hotjar\./i,
    /hj\s*\(/,
    /_paq\.push/,
  ];

  for (const f of sourceSample) {
    const c = await ctx.getFile(f);
    if (!c) continue;
    if (usagePatterns.some((rx) => rx.test(c))) return true;
  }

  return false;
}