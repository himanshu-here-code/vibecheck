import { ProjectType } from './project-type';

/**
 * Default check categories for each project type. Only used as a fallback
 * when purpose is 'product' or 'unknown'. Purpose-specific rules take
 * priority via resolveChecks in checks-by-purpose.ts.
 */
export const CHECKS_BY_TYPE: Record<ProjectType, string[]> = {
  'web-app': ['legal', 'seo', 'errors', 'hygiene', 'signatures', 'quality'],
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

/**
 * Human-readable labels for the report card.
 */
export const TYPE_LABELS: Record<ProjectType, string> = {
  'web-app': 'Web app',
  'cli-tool': 'CLI tool',
  library: 'Library / SDK',
  'mobile-app': 'Mobile app',
  'browser-extension': 'Browser extension',
  'api-service': 'API service',
  docs: 'Documentation site',
  unknown: 'Project',
};