import { ScanResult, Issue } from '../types';
import { RepoContext } from '../types';
import { checkLegal } from './legal';
import { checkSEO } from './seo';
import { checkErrorStates } from './errors';
import { checkHygiene } from './hygiene';
import { checkSignatures } from './signatures';

const WEIGHTS: Record<Issue['severity'], number> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
};

export async function runAllChecks(ctx: RepoContext): Promise<ScanResult> {
  const [legal, seo, errors, hygiene, signatures] = await Promise.all([
    checkLegal(ctx),
    checkSEO(ctx),
    checkErrorStates(ctx),
    checkHygiene(ctx),
    checkSignatures(ctx),
  ]);

  const issues = [
    ...legal.issues,
    ...seo.issues,
    ...errors.issues,
    ...hygiene.issues,
    ...signatures.issues,
  ].sort((a, b) => WEIGHTS[b.severity] - WEIGHTS[a.severity]);

  const passed = [
    ...legal.passed,
    ...seo.passed,
    ...errors.passed,
    ...hygiene.passed,
    ...signatures.passed,
  ];

  const rawScore = issues.reduce((sum, i) => sum + WEIGHTS[i.severity], 0);
  // Cap at 100. "Vibecoded %"
  const score = Math.min(100, rawScore);

  const grade =
    score >= 70 ? 'F' :
    score >= 50 ? 'D' :
    score >= 30 ? 'C' :
    score >= 15 ? 'B' : 'A';

  return {
    repo: `${ctx.owner}/${ctx.repo}`,
    score,
    grade,
    issues,
    passed,
    fileCount: ctx.files.length,
    scannedAt: new Date().toISOString(),
  };
}