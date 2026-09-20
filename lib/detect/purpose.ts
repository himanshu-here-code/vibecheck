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
 * Determine WHY this repo exists.
 *
 * Only analyzes the first 1000 chars of the README. The top is where
 * intent lives — the rest is usually docs, tutorials, API reference.
 */
export function detectPurpose(
  readme: string,
  projectType: ProjectType,
  fileCount: number
): PurposeDetection {
  const fullText = readme ?? '';
  const text = fullText.slice(0, 1000).toLowerCase();
  const signals: string[] = [];

  // ---------------------------------------------------------------------------
  // Docs type → docs purpose (locked)
  // ---------------------------------------------------------------------------
  if (projectType === 'docs') {
    signals.push('project type is docs');
    return { purpose: 'docs', confidence: 0.95, signals };
  }

  // ---------------------------------------------------------------------------
  // 1. Learning — needs 2+ strong signals
  // ---------------------------------------------------------------------------
  const learningSignals = [
    /\b\d+\s*(day|week|month)s?\s+of\b/i,
    /\b(learn|learning) (python|javascript|react|programming|to code|rust|go)\b/i,
    /\b(tutorial series|course materials|curriculum|bootcamp|course)\b/i,
    /\b(for beginners|beginner['']?s? (guide|tutorial))\b/i,
    /\bhands[- ]on (tutorial|guide|course)\b/i,
  ];
  const learningHits = learningSignals.filter((r) => r.test(text)).length;
  if (learningHits >= 2) {
    signals.push(`${learningHits} learning signals`);
    return { purpose: 'learning', confidence: 0.9, signals };
  }

  // ---------------------------------------------------------------------------
  // 2. Portfolio — needs 2+
  // ---------------------------------------------------------------------------
  const portfolioSignals = [
    /\b(portfolio|personal (site|website|blog)|my (site|website|blog))\b/i,
    /\b(showcase|projects? i('ve| have) (built|made|worked on))\b/i,
    /\b(about me|hire me|resume|curriculum vitae)\b/i,
  ];
  const portfolioHits = portfolioSignals.filter((r) => r.test(text)).length;
  if (portfolioHits >= 2) {
    signals.push(`${portfolioHits} portfolio signals`);
    return { purpose: 'portfolio', confidence: 0.85, signals };
  }

  // ---------------------------------------------------------------------------
  // 3. Boilerplate — needs 2+
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
  // 4. Product — checked before experiment
  // ---------------------------------------------------------------------------
  const productSignals = [
    /\b(sign up|signup|log in|login|dashboard|pricing|subscription|saas|free trial)\b/i,
    /\b(users|accounts|customers|teams|organizations|workspaces)\b/i,
    /\b(get started|try it now|scan your|paste a|your app)\b/i,
    /\b(privacy policy|terms of service)\b/i,
    /\b(framework|library|sdk|package|toolkit|api)\b/i,
    /\b(production[- ]ready|high[- ]performance|fast|secure|reliable|modern)\b/i,
  ];
  const productHits = productSignals.filter((r) => r.test(text)).length;

  const isProductType =
    projectType === 'web-app' ||
    projectType === 'api-service' ||
    projectType === 'mobile-app' ||
    projectType === 'library' ||
    projectType === 'cli-tool';

  if (productHits >= 1 && isProductType) {
    signals.push(`${productHits} product signals`);
    return { purpose: 'product', confidence: 0.8, signals };
  }

  // ---------------------------------------------------------------------------
  // 5. Experiment — needs 2+
  // ---------------------------------------------------------------------------
  const experimentSignals = [
    /\b(experiment(al)? (project|repo|codebase|thing))\b/i,
    /\b(scratch|playground|sandbox|just testing|misc|assorted)\b/i,
    /\bpoc\b/i,
    /\bproof[- ]of[- ]concept\b/i,
  ];
  const experimentHits = experimentSignals.filter((r) => r.test(text)).length;
  if (experimentHits >= 2) {
    signals.push(`${experimentHits} experiment signals`);
    return { purpose: 'experiment', confidence: 0.8, signals };
  }

  // ---------------------------------------------------------------------------
  // 6. Fallbacks — prefer product for anything with real code
  // ---------------------------------------------------------------------------
  if (projectType === 'library' || projectType === 'cli-tool') {
    signals.push('library/cli — default to product');
    return { purpose: 'product', confidence: 0.6, signals };
  }
  if (isProductType) {
    signals.push('app-like type — default to product');
    return { purpose: 'product', confidence: 0.6, signals };
  }
  if (fileCount < 20 && fullText.length < 400) {
    signals.push('small repo, minimal README');
    return { purpose: 'experiment', confidence: 0.6, signals };
  }

  signals.push('no strong signals');
  return { purpose: 'unknown', confidence: 0.5, signals };
}