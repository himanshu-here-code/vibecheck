import { ProjectType } from './project-type';
import { ProjectPurpose } from './purpose';

/**
 * Decide which check categories to run for a given (type, purpose) pair.
 *
 * Purpose overrides type when specific (learning, docs, boilerplate, etc.).
 * Otherwise the type's defaults apply.
 *
 * Rationale per category:
 *   - legal:    privacy, terms, contact — only for user-facing products
 *   - seo:      meta tags, OG images, sitemaps — only for indexed web pages
 *   - errors:   404, error boundaries, empty states — only for UIs
 *   - hygiene:  .gitignore, .env.example, README — universal
 *   - signatures: placeholder text, gradients, hardcoded secrets — universal
 *   - quality:  unused deps, alt text, TODOs — universal
 */
export function resolveChecks(
  type: ProjectType,
  purpose: ProjectPurpose
): string[] {
  // ===========================================================================
  // Purpose overrides (highest priority)
  // ===========================================================================
  switch (purpose) {
    case 'learning':
      // Tutorials and courses have no users to serve. Skip product checks.
      return ['hygiene', 'signatures', 'quality'];

    case 'experiment':
      // Scratch projects — only find obvious issues.
      return ['signatures', 'quality'];

    case 'portfolio':
      // Personal site — SEO matters, legal doesn't (no data collected).
      return ['seo', 'errors', 'signatures', 'quality'];

    case 'docs':
      // Pure documentation — SEO for finding it, quality for content.
      // No hygiene (no build artifacts), no legal (no users), no errors (no UI).
      return ['seo', 'quality'];

    case 'boilerplate':
      // Starter templates should include a placeholder privacy policy
      // so users filling it in don't forget.
      return ['legal', 'hygiene', 'signatures', 'quality'];

    // product and unknown fall through to type-based rules
  }

  // ===========================================================================
  // Type-based defaults
  // ===========================================================================
  const BY_TYPE: Record<ProjectType, string[]> = {
    'web-app': [
      'legal',
      'seo',
      'errors',
      'hygiene',
      'signatures',
      'quality',
    ],
    'cli-tool': ['hygiene', 'signatures', 'quality'],
    library: ['hygiene', 'signatures', 'quality'],
    'mobile-app': ['legal', 'errors', 'hygiene', 'signatures', 'quality'],
    'browser-extension': [
      'legal',
      'errors',
      'hygiene',
      'signatures',
      'quality',
    ],
    'api-service': ['hygiene', 'signatures', 'quality'],
    docs: ['seo', 'quality'],
    unknown: ['legal', 'seo', 'errors', 'hygiene', 'signatures', 'quality'],
  };

  return BY_TYPE[type];
}

/**
 * Human-readable labels shown in the report card.
 */
export const PURPOSE_LABELS: Record<ProjectPurpose, string> = {
  product: 'a product',
  learning: 'a learning project',
  portfolio: 'a portfolio project',
  docs: 'a documentation site',
  boilerplate: 'a starter template',
  experiment: 'an experiment',
  unknown: 'a project',
};