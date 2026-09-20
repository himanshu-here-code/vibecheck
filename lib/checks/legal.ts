import { Issue, RepoContext } from '../types';
import type { ProjectPurpose } from '../detect/purpose';

// -----------------------------------------------------------------------------
// Privacy policy detection
// -----------------------------------------------------------------------------

/**
 * Detects real privacy policies. Accepts:
 *   - Pages titled "Privacy Policy" / "Privacy Notice" / "Privacy Statement"
 *   - Standard legal language ("we collect", "GDPR", "you have the right")
 *   - Denial policies ("we don't store", "no data is retained")
 *   - Short policies that describe a stateless tool
 */
function looksLikePrivacyPolicy(content: string): boolean {
  const text = content.toLowerCase();

  // Strong signal #1 — page header says "privacy policy"
  if (
    /(^|>|\s|["'])privacy\s+(policy|notice|statement)(<|\s|$|["',.])/i.test(
      text
    )
  ) {
    return true;
  }

  // Strong signal #2 — common heading patterns
  if (
    /<h1[^>]*>\s*privacy\s*<\/h1>/i.test(text) ||
    /"title"\s*:\s*["'][^"']*privacy/i.test(text)
  ) {
    return true;
  }

  // Weaker signals — need 2+
  const signals = [
    // Positive voice
    /we (collect|process|store|handle|share|retain) (your|personal|user|any)/i,
    /(gdpr|ccpa|california consumer privacy|pipeda)/i,
    /you (have the right|can request|may opt out|can delete|can access)/i,
    /(cookie|tracking) (policy|preferences|consent)/i,
    /data (controller|processor|protection officer)/i,
    /(opt[- ]out|unsubscribe|delete your account|right to erasure)/i,
    /third[- ]party (services|providers|processors)/i,
    // Negative voice — privacy-respecting tools
    /we (do not|don'?t|never)\s+(collect|store|share|sell|track|retain|use)/i,
    /(no|zero|nothing)\s+(data|information|personal data|user data|analytics)\s+(is|are|is)\s*(stored|collected|retained|saved|kept)/i,
    /we (don'?t|do not)\s+(have|use|keep)\s+(a\s+)?(database|logs?|accounts?)/i,
    // Meta
    /this (privacy )?(policy|notice) (explains|describes|covers|applies)/i,
    /(how|what) (we|this (site|app|service)) (handle|use|do with|collect)/i,
  ];
  return signals.filter((r) => r.test(text)).length >= 2;
}

// -----------------------------------------------------------------------------
// Terms of service detection
// -----------------------------------------------------------------------------

function looksLikeTerms(content: string): boolean {
  const text = content.toLowerCase();

  // Strong signal — page header
  if (
    /(^|>|\s|["'])terms\s+(of\s+(service|use)|and\s+conditions|& ?conditions)(<|\s|$|["',.])/i.test(
      text
    )
  ) {
    return true;
  }

  if (
    /<h1[^>]*>\s*terms[^<]*<\/h1>/i.test(text) ||
    /"title"\s*:\s*["'][^"']*terms/i.test(text)
  ) {
    return true;
  }

  const signals = [
    /(terms (of|and) (service|use)|terms & conditions|tos\b)/i,
    /you (agree|acknowledge|warrant|covenant) (to|that|not)/i,
    /(governing law|jurisdiction|venue|arbitration)/i,
    /(limitation of liability|limitation on liability|indemnif|hold harmless)/i,
    /we (reserve|may)\s+(the right|terminate|suspend|modify|update)/i,
    /(acceptable use|prohibited (conduct|uses|activities))/i,
    /(intellectual property|ip ownership|user content)/i,
    /(warranty disclaimer|as[- ]is|no warranties)/i,
  ];
  return signals.filter((r) => r.test(text)).length >= 2;
}

// -----------------------------------------------------------------------------
// Contact page detection
// -----------------------------------------------------------------------------

function looksLikeContactPage(content: string): boolean {
  const text = content.toLowerCase();

  // Strong signal — page header
  if (/(^|>|\s|["'])contact(\s+us)?(<|\s|$|["',.])/i.test(text)) {
    return true;
  }

  const signals = [
    /(get in touch|reach out|say hi|say hello|drop us a line)/i,
    /(email|mail|write|message) us (at|via)/i,
    /@[a-z0-9-]+\.[a-z]{2,}/i,
    /(github\.com\/|gitlab\.com\/|mailto:|twitter\.com\/|x\.com\/|linkedin\.com\/)/i,
    /(contact (form|page|info|details))/i,
  ];
  return signals.filter((r) => r.test(text)).length >= 2;
}

// -----------------------------------------------------------------------------
// File finder
// -----------------------------------------------------------------------------

async function findFileWithContent(
  ctx: RepoContext,
  candidates: RegExp[],
  signature: (c: string) => boolean,
  maxFiles = 40
): Promise<string | null> {
  const SKIP = [
    'node_modules',
    '.next',
    'dist/',
    'build/',
    'venv/',
    '.venv/',
    '__pycache__/',
    'target/',
    'vendor/',
  ];

  // Pass 1 — files matching candidate patterns
  const matches = ctx.files.filter(
    (f) => !SKIP.some((s) => f.includes(s)) && candidates.some((rx) => rx.test(f))
  );

  for (const f of matches.slice(0, maxFiles)) {
    const content = await ctx.getFile(f);
    if (content && signature(content)) return f;
  }

  // Pass 2 — fallback: any file with the right source extension
  const sourceMatches = ctx.files
    .filter((f) => ctx.lang.sourceExtensions.test(f))
    .filter((f) => !SKIP.some((s) => f.includes(s)))
    .slice(0, 20);

  for (const f of sourceMatches) {
    const content = await ctx.getFile(f);
    if (content && signature(content)) return f;
  }

  return null;
}

// -----------------------------------------------------------------------------
// Main check
// -----------------------------------------------------------------------------

export async function checkLegal(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];
  const { lang, language } = ctx;
  const purpose = ctx.projectPurpose as ProjectPurpose | undefined;

  // Legal checks apply only to user-facing projects
  const APPLIES: ProjectPurpose[] = ['product', 'boilerplate', 'portfolio'];
  if (!purpose || !APPLIES.includes(purpose)) {
    passed.push(
      'legal.privacy',
      'legal.terms',
      'legal.cookies',
      'legal.license',
      'legal.contact'
    );
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
      description: `We couldn't find a privacy policy in this ${language.primary} project. If you collect any user data — analytics, auth, payments — this is legally required in the EU, UK, and California.`,
      fix:
        'Add a privacy page with a policy covering: what data you collect, how it\'s used, third parties involved, user rights, and a contact method.',
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
        /(cookie (consent|banner|policy)|accept (all )?cookies|gdpr (consent|banner)|consent (to|for) cookies)/i.test(
          c
        ),
      20
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
    /(^|\/)(LICENSE|LICENCE|COPYING|UNLICENSE)(\.|$)/i.test(f)
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
        'Add a LICENSE at your repo root. MIT if you want it open, or a proprietary notice if you don\'t.',
    });
  } else {
    passed.push('legal.license');
  }

  // ---- Contact -------------------------------------------------------------
  const contactFile = await findFileWithContent(
    ctx,
    lang.contactCandidates,
    looksLikeContactPage,
    20
  );

  // Fallback: check the footer for a contact link (mailto, GitHub issues, etc.)
  const footerHasContact = !contactFile
    ? await footerHasContactLink(ctx)
    : false;

  if (!contactFile && !footerHasContact) {
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
// Footer fallback — sometimes contact lives in the footer, not a page
// -----------------------------------------------------------------------------

async function footerHasContactLink(ctx: RepoContext): Promise<boolean> {
  const footerCandidates = ctx.files.filter((f) =>
    /footer|layout/i.test(f)
  );

  for (const f of footerCandidates.slice(0, 8)) {
    const content = await ctx.getFile(f);
    if (!content) continue;
    if (
      /(mailto:|href\s*=\s*["']\/contact|href\s*=\s*["'][^"']*github\.com\/[^"']*\/issues)/i.test(
        content
      )
    ) {
      return true;
    }
  }
  return false;
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
    'google-analytics',
    'googletagmanager',
    'matomo',
    '@segment/',
    'analytics-next',
    'sentry',
    'datadog',
    'newrelic',
    'fullstory',
    'logrocket',
  ];

  // package.json — dependency names only
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
      // skip
    }
  }

  // Python manifests
  for (const manifest of ['requirements.txt', 'Pipfile', 'pyproject.toml']) {
    const content = await ctx.getFile(manifest);
    if (!content) continue;
    const lower = content.toLowerCase();
    for (const lib of trackingLibs) {
      if (lower.includes(lib)) return true;
    }
  }

  // Source-level: actual API calls
  const usagePatterns = [
    /gtag\s*\(/,
    /googletagmanager\.com\/gtag/i,
    /posthog\.(capture|identify)\s*\(/,
    /mixpanel\.(track|identify)\s*\(/,
    /hotjar\./i,
    /hj\s*\(/,
    /_paq\.push/,
    /LogRocket\.init/i,
    /FullStory\.init/i,
  ];

  const sourceSample = ctx.files
    .filter((f) => ctx.lang.sourceExtensions.test(f))
    .filter((f) => !/node_modules|venv\/|__pycache__/.test(f))
    .slice(0, 30);

  for (const f of sourceSample) {
    const c = await ctx.getFile(f);
    if (!c) continue;
    if (usagePatterns.some((rx) => rx.test(c))) return true;
  }

  return false;
}