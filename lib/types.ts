import type { LanguageDetection } from './detect/language';
import type { LanguagePack } from './detect/language-packs';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type Category =
  | 'legal'
  | 'seo'
  | 'errors'
  | 'hygiene'
  | 'signatures'
  | 'quality'
  | 'analytics';

export interface Issue {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  fix: string;
  docs?: string;
  affectedFiles?: string[];
}

export interface RepoContext {
  owner: string;
  repo: string;
  branch: string;
  files: string[];
  fileSet: Set<string>;
  getFile: (path: string) => Promise<string | null>;
  getFileByPattern: (re: RegExp) => string | null;
  language: LanguageDetection;
  lang: LanguagePack;
  /** Set by the orchestrator before running checks. */
  projectPurpose?: string;
}

export interface ProjectTypeInfo {
  type: string;
  confidence: number;
  signals: string[];
}

export interface ProjectPurposeInfo {
  purpose: string;
  confidence: number;
  signals: string[];
}

export interface ScanResult {
  repo: string;
  score: number;
  grade: string;
  issues: Issue[];
  passed: string[];
  fileCount: number;
  scannedAt: string;
  projectType?: ProjectTypeInfo;
  projectPurpose?: ProjectPurposeInfo;
  skippedChecks?: string[];
}