import { ProjectType } from './project-type';
import { ProjectPurpose } from './purpose';

/**
 * Checks to run for a given (project type, project purpose) combination.
 *
 * Purpose overrides type in some cases — a "learning" web app is treated
 * more like a library, because there's no product to check.
 */
export function resolveChecks(
  type: ProjectType,
  purpose: ProjectPurpose
): string[] {
  // ---------------------------------------------------------------------------
  // Purpose overrides first — these trump everything
  // ---------------------------------------------------------------------------

  if (purpose === 'learning') {
    // Curriculum, tutorial, or challenge repos don't have users, so no legal,
    // SEO, or error-state checks matter. Only code quality.
    return ['hygiene', 'signatures', 'quality'];
  }

  if (purpose === 'experiment') {
    // Scratch repos — no expectations. Just flag obvious signatures and
    // quality issues.
    return ['signatures', 'quality'];
  }

  if (purpose === 'portfolio') {
    // Personal showcase — treat like a light web app. Legal isn't needed
    // (no data collection), but SEO matters (people find these via search).
    return ['seo', 'errors', 'signatures', 'quality'];
  }

  if (purpose === 'docs') {
    // Documentation sites — SEO and hygiene matter, legal doesn't.
    return ['seo', 'hygiene', 'quality'];
  }

  if (purpose === 'boilerplate') {
    // Starter templates — hygiene and signatures matter (people will copy
    // this). Legal matters too because the template should include a
    // placeholder policy for users to fill in.
    return ['legal', 'hygiene', 'signatures', 'quality'];
  }

  // ---------------------------------------------------------------------------
  // Purpose is 'product' or 'unknown' — fall back to type-based rules
  // ---------------------------------------------------------------------------

  const CHECKS_BY_TYPE: Record<ProjectType, string[]> = {
    'web-app':           ['legal', 'seo', 'errors', 'hygiene', 'signatures', 'quality'],
    'cli-tool':          ['hygiene', 'signatures', 'quality'],
    'library':           ['hygiene', 'signatures', 'quality'],
    'mobile-app':        ['legal', 'errors', 'hygiene', 'signatures', 'quality'],
    'browser-extension': ['legal', 'errors', 'hygiene', 'signatures', 'quality'],
    'api-service':       ['legal', 'hygiene', 'signatures', 'quality'],
    'unknown':           ['legal', 'seo', 'errors', 'hygiene', 'signatures', 'quality'],
  };

  return CHECKS_BY_TYPE[type];
}

/**
 * Human-readable label for the report.
 */
export const PURPOSE_LABELS: Record<ProjectPurpose, string> = {
  product:     'a product',
  learning:    'a learning project',
  portfolio:   'a portfolio project',
  docs:        'a documentation site',
  boilerplate: 'a starter template',
  experiment:  'an experiment',
  unknown:     'a project',
};