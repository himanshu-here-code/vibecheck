import { ScanResult, Issue, RepoContext } from '../types';
import { checkLegal } from './legal';
import { checkSEO } from './seo';
import { checkErrorStates } from './errors';
import { checkHygiene } from './hygiene';
import { checkSignatures } from './signatures';
import { checkQuality } from './quality';
import { detectProjectType, ProjectTypeResult } from '../detect/project-type';
import { detectPurpose, PurposeDetection } from '../detect/purpose';
import { resolveChecks } from '../detect/checks-by-purpose';

const WEIGHTS: Record<Issue['severity'], number> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
};

type CheckRunner = (
  ctx: RepoContext
) => Promise<{ issues: Issue[]; passed: string[] }>;

const RUNNERS: Record<string, CheckRunner> = {
  legal: checkLegal,
  seo: checkSEO,
  errors: checkErrorStates,
  hygiene: checkHygiene,
  signatures: checkSignatures,
  quality: checkQuality,
};

export async function runAllChecks(ctx: RepoContext): Promise<
  ScanResult & {
    projectType: ProjectTypeResult;
    projectPurpose: PurposeDetection;
    skippedChecks: string[];
  }
> {
  // Step 1: Read the README and package.json
  const readme = await ctx.getFile('README.md');
  const pkg = await ctx.getFile('package.json');

  // Step 2: Detect type and purpose
  const projectType = detectProjectType(readme ?? '', pkg);
  const projectPurpose = detectPurpose(
    readme ?? '',
    projectType.type,
    ctx.files.length
  );
  ctx.projectPurpose = projectPurpose.purpose;

  // Step 3: Figure out which checks to run — purpose wins over type
  const enabledChecks: string[] = resolveChecks(
    projectType.type,
    projectPurpose.purpose
  );

  const allChecks: string[] = [
    'legal',
    'seo',
    'errors',
    'hygiene',
    'signatures',
    'quality',
  ];
  const skippedChecks: string[] = allChecks.filter(
    (c: string) => !enabledChecks.includes(c)
  );

  // Step 4: Run them in parallel
  const results = await Promise.all(
    enabledChecks.map((name: string) => RUNNERS[name](ctx))
  );

  // Step 5: Aggregate
  const issues: Issue[] = results
    .flatMap((r: { issues: Issue[]; passed: string[] }) => r.issues)
    .sort((a: Issue, b: Issue) => WEIGHTS[b.severity] - WEIGHTS[a.severity]);

  const passed: string[] = results.flatMap(
    (r: { issues: Issue[]; passed: string[] }) => r.passed
  );

  const rawScore: number = issues.reduce(
    (sum: number, i: Issue) => sum + WEIGHTS[i.severity],
    0
  );
  const score = Math.min(100, rawScore);

  const grade =
    score >= 70
      ? 'F'
      : score >= 50
        ? 'D'
        : score >= 30
          ? 'C'
          : score >= 15
            ? 'B'
            : 'A';

  return {
    repo: `${ctx.owner}/${ctx.repo}`,
    score,
    grade,
    issues,
    passed,
    fileCount: ctx.files.length,
    scannedAt: new Date().toISOString(),
    projectType,
    projectPurpose,
    skippedChecks,
  };
}