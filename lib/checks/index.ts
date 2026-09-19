import { ScanResult, Issue, RepoContext } from '../types';
import { checkLegal } from './legal';
import { checkSEO } from './seo';
import { checkErrorStates } from './errors';
import { checkHygiene } from './hygiene';
import { checkSignatures } from './signatures';
import { detectProjectType, ProjectTypeResult } from '../detect/project-type';
import { CHECKS_BY_TYPE } from '../detect/checks-by-type';

const WEIGHTS: Record<Issue['severity'], number> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
};

const RUNNERS: Record<string, (ctx: RepoContext) => Promise<{ issues: Issue[]; passed: string[] }>> = {
  legal: checkLegal,
  seo: checkSEO,
  errors: checkErrorStates,
  hygiene: checkHygiene,
  signatures: checkSignatures,
};

export async function runAllChecks(
  ctx: RepoContext
): Promise<ScanResult & { projectType: ProjectTypeResult }> {
  // Step 1: read the README and package.json to understand the project
  const readme = await ctx.getFile('README.md');
  const pkg = await ctx.getFile('package.json');

  const projectType = detectProjectType(readme ?? '', pkg);

  // Step 2: figure out which checks to run
  const enabledChecks = CHECKS_BY_TYPE[projectType.type];

  // Step 3: run them in parallel
  const results = await Promise.all(
    enabledChecks.map((name) => RUNNERS[name](ctx))
  );

  // Step 4: aggregate
  const issues = results.flatMap((r) => r.issues).sort(
    (a, b) => WEIGHTS[b.severity] - WEIGHTS[a.severity]
  );
  const passed = results.flatMap((r) => r.passed);

  const rawScore = issues.reduce((sum, i) => sum + WEIGHTS[i.severity], 0);
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
    projectType,
  };
}