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

const ALL_CHECKS: string[] = [
  'legal',
  'seo',
  'errors',
  'hygiene',
  'signatures',
  'quality',
];

export async function runAllChecks(ctx: RepoContext): Promise<
  ScanResult & {
    projectType: ProjectTypeResult;
    projectPurpose: PurposeDetection;
    skippedChecks: string[];
  }
> {
  // ---------------------------------------------------------------------------
  // Step 1: Read the README and package.json once
  // ---------------------------------------------------------------------------
  const [readme, pkg] = await Promise.all([
    ctx.getFile('README.md'),
    ctx.getFile('package.json'),
  ]);

  // ---------------------------------------------------------------------------
  // Step 2: Detect type and purpose
  // ---------------------------------------------------------------------------
  const projectType = detectProjectType(
    readme ?? '',
    pkg,
    ctx.files,
    ctx.language.primary,
    ctx.repo,
    ctx.owner
  );
  const projectPurpose = detectPurpose(
    readme ?? '',
    projectType.type,
    ctx.files.length
  );

  // Attach to ctx so downstream checks can read them without extra args
  ctx.projectPurpose = projectPurpose.purpose;
  ctx.projectType = projectType.type;

  // ---------------------------------------------------------------------------
  // Step 3: Resolve which checks to run
  // ---------------------------------------------------------------------------
  const enabledChecks = resolveChecks(projectType.type, projectPurpose.purpose);
  const skippedChecks = ALL_CHECKS.filter((c) => !enabledChecks.includes(c));

  // ---------------------------------------------------------------------------
  // Step 4: Run enabled checks in parallel
  // ---------------------------------------------------------------------------
  const results = await Promise.all(
    enabledChecks.map((name) => RUNNERS[name](ctx))
  );

  // ---------------------------------------------------------------------------
  // Step 5: Aggregate issues and passed checks
  // ---------------------------------------------------------------------------
  const issues: Issue[] = results
    .flatMap((r) => r.issues)
    .sort((a, b) => WEIGHTS[b.severity] - WEIGHTS[a.severity]);

  const passed: string[] = results.flatMap((r) => r.passed);

  // ---------------------------------------------------------------------------
  // Step 6: Compute score
  //
  //    Score is a weighted sum of severities, capped at 100.
  //    A repo with no issues scores 0 (grade A).
  //    A repo with only criticals scores high (grade F).
  // ---------------------------------------------------------------------------
  const rawScore = issues.reduce((sum, i) => sum + WEIGHTS[i.severity], 0);
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