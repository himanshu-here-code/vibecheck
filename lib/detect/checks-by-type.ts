import { ProjectType } from './project-type';

/**
 * Which check categories apply to which project types.
 *
 * Reasoning:
 *   - SEO only matters if search engines crawl it (web apps, docs sites)
 *   - Legal (privacy/terms) only matters if you handle user data
 *   - Error states only matter if there's a UI
 *   - Hygiene and signatures apply to everything
 */
export const CHECKS_BY_TYPE: Record<ProjectType, string[]> = {
  'web-app':            ['legal', 'seo', 'errors', 'hygiene', 'signatures'],
  'cli-tool':           ['hygiene', 'signatures'],
  'library':            ['hygiene', 'signatures'],
  'mobile-app':         ['legal', 'errors', 'hygiene', 'signatures'],
  'browser-extension':  ['legal', 'errors', 'hygiene', 'signatures'],
  'api-service':        ['legal', 'hygiene', 'signatures'],
  'unknown':            ['legal', 'seo', 'errors', 'hygiene', 'signatures'],
};

/**
 * Human-readable label for each type — shown in the report.
 */
export const TYPE_LABELS: Record<ProjectType, string> = {
  'web-app':            'Web app',
  'cli-tool':           'CLI tool',
  'library':            'Library / SDK',
  'mobile-app':         'Mobile app',
  'browser-extension':  'Browser extension',
  'api-service':        'API service',
  'unknown':            'Project',
};