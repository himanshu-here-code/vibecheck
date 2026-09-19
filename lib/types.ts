export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Issue {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  fix: string;
  docs?: string;
}

export type Category =
  | 'legal'
  | 'seo'
  | 'errors'
  | 'hygiene'
  | 'signatures'
  | 'analytics';

export interface ScanResult {
  repo: string;
  score: number;          // 0-100, higher = more vibecoded
  grade: string;          // A-F
  issues: Issue[];
  passed: string[];       // ids of checks that passed
  fileCount: number;
  scannedAt: string;
}

export interface RepoContext {
  owner: string;
  repo: string;
  branch: string;
  files: string[];                        // all paths
  fileSet: Set<string>;                   // for fast lookup
  getFile: (path: string) => Promise<string | null>;
  getFileByPattern: (re: RegExp) => string | null;
}