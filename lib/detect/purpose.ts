import { ProjectType } from './project-type';

export type ProjectPurpose =
  | 'product'
  | 'learning'
  | 'portfolio'
  | 'docs'
  | 'boilerplate'
  | 'experiment'
  | 'unknown';

export interface PurposeDetection {
  purpose: ProjectPurpose;
  confidence: number;
  signals: string[];
}

/**
 * Determine WHY this repo exists — separate from what it technically is.
 *
 * A Python "30 days of X" repo and a Python SaaS app are both `library` and
 * `web-app` respectively on the type axis, but their purpose is completely
 * different. The first shouldn't be checked for privacy policies; the second
 * should.
 */
export function detectPurpose(
  readme: string,
  projectType: ProjectType,
  fileCount: number
): PurposeDetection {
  const text = readme.toLowerCase();
  const signals: string[] = [];

  // ---------------------------------------------------------------------------
  // Learning / curriculum
  // ---------------------------------------------------------------------------
  const learningSignals = [
    /\b(learn|learning|tutorial|course|curriculum|bootcamp|lesson|chapter|exercise|practice|training)\b/i,
    /\b\d+\s*(day|week|month)s?\s+of\b/i,                       // "30 days of X"
    /\b(challenge|workshop|guide|walkthrough|step.by.step)\b/i,
    /\b(follow along|clone and run|for beginners|getting started with)\b/i,
    /\b(how to|learn to|teach|study)\b/i,
  ];
  const learningHits = learningSignals.filter((r) => r.test(text)).length;
  if (learningHits >= 2) {
    signals.push(`${learningHits} learning signals`);
    return { purpose: 'learning', confidence: 0.9, signals };
  }

  // ---------------------------------------------------------------------------
  // Portfolio / personal site
  // ---------------------------------------------------------------------------
  const portfolioSignals = [
    /\b(portfolio|personal (site|website|blog)|my (site|website|blog|project))\b/i,
    /\b(showcase|projects? i('ve| have) (built|made|worked on))\b/i,
    /\b(about me|hire me|resume|curriculum vitae)\b/i,
    /\b(built with .*(next|astro|svelte|gatsby|hugo))/i,
  ];
  const portfolioHits = portfolioSignals.filter((r) => r.test(text)).length;
  if (portfolioHits >= 2) {
    signals.push(`${portfolioHits} portfolio signals`);
    return { purpose: 'portfolio', confidence: 0.85, signals };
  }

  // ---------------------------------------------------------------------------
  // Docs / knowledge base
  // ---------------------------------------------------------------------------
  const docsSignals = [
    /\b(documentation|docs|wiki|knowledge base|handbook|reference)\b/i,
    /\b(api reference|getting started|installation guide)\b/i,
    /\b(docusaurus|vitepress|mkdocs|readthedocs|gitbook)\b/i,
  ];
  const docsHits = docsSignals.filter((r) => r.test(text)).length;
  if (docsHits >= 2) {
    signals.push(`${docsHits} docs signals`);
    return { purpose: 'docs', confidence: 0.85, signals };
  }

  // ---------------------------------------------------------------------------
  // Boilerplate / starter template
  // ---------------------------------------------------------------------------
  const boilerplateSignals = [
    /\b(boilerplate|starter|template|scaffold|kickstart|skeleton)\b/i,
    /\b(clone this template|use this template|fork and customize)\b/i,
    /\b(create .* from this template)\b/i,
  ];
  const boilerplateHits = boilerplateSignals.filter((r) => r.test(text)).length;
  if (boilerplateHits >= 2) {
    signals.push(`${boilerplateHits} boilerplate signals`);
    return { purpose: 'boilerplate', confidence: 0.9, signals };
  }

  // ---------------------------------------------------------------------------
  // Experiment / scratch
  // ---------------------------------------------------------------------------
  const experimentSignals = [
    /\b(experiment|experimental|scratch|playground|sandbox|prototype|poc|proof of concept)\b/i,
    /\b(just (testing|playing)|random|misc|assorted)\b/i,
  ];
  const experimentHits = experimentSignals.filter((r) => r.test(text)).length;
  if (experimentHits >= 1) {
    signals.push(`${experimentHits} experiment signals`);
    return { purpose: 'experiment', confidence: 0.8, signals };
  }

  // ---------------------------------------------------------------------------
  // Product / SaaS — the default when it looks like a real thing
  // ---------------------------------------------------------------------------
  const productSignals = [
    /\b(sign up|signup|log in|login|dashboard|pricing|subscription|saas|paid|free trial)\b/i,
    /\b(users|accounts|customers|teams|organizations|workspaces)\b/i,
    /\b(privacy policy|terms of service|paid plan)\b/i,
  ];
  const productHits = productSignals.filter((r) => r.test(text)).length;

  if (
    productHits >= 2 &&
    (projectType === 'web-app' || projectType === 'api-service' || projectType === 'mobile-app')
  ) {
    signals.push(`${productHits} product signals`);
    return { purpose: 'product', confidence: 0.85, signals };
  }

  // ---------------------------------------------------------------------------
  // Fallbacks
  // ---------------------------------------------------------------------------

  // Small repos with no signals → likely an experiment
  if (fileCount < 30 && text.length < 500) {
    signals.push('small repo, minimal README');
    return { purpose: 'experiment', confidence: 0.6, signals };
  }

  // Web app or mobile app with no learning/portfolio signals → treat as product
  if (projectType === 'web-app' || projectType === 'mobile-app') {
    signals.push('web/mobile type with no counter-signals');
    return { purpose: 'product', confidence: 0.6, signals };
  }

  // Library / CLI with no learning signals → boilerplate-adjacent, treat as product
  if (projectType === 'library' || projectType === 'cli-tool') {
    signals.push('library/cli type — general expectations');
    return { purpose: 'product', confidence: 0.5, signals };
  }

  signals.push('no strong signals');
  return { purpose: 'unknown', confidence: 0.5, signals };
}