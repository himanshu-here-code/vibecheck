import { Issue, RepoContext } from '../types';

export async function checkErrorStates(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];

  const has = (re: RegExp) => ctx.files.some((f) => re.test(f));

  // 404
  if (!has(/404|not[-_]?found/i)) {
    issues.push({
      id: 'errors.404',
      category: 'errors',
      severity: 'high',
      title: 'No 404 page',
      description:
        'Users hitting dead links get the default browser/host error. Looks unprofessional.',
      fix: 'Add `app/not-found.tsx` (Next.js) or a 404 route in your router.',
    });
  } else passed.push('errors.404');

  // Error boundary
  const hasErrorBoundary =
    has(/ErrorBoundary/i) ||
    has(/error\.tsx$/i) ||
    has(/error\.ts$/i);
  if (!hasErrorBoundary) {
    issues.push({
      id: 'errors.boundary',
      category: 'errors',
      severity: 'high',
      title: 'No error boundary / error page',
      description:
        'One uncaught error = entire app goes white screen. Users see nothing.',
      fix: 'Add `app/error.tsx` in Next.js, or wrap with a React ErrorBoundary.',
    });
  } else passed.push('errors.boundary');

  // Loading states
  const hasLoading =
    has(/loading\.tsx$/i) ||
    has(/Loading/i) ||
    has(/Skeleton/i) ||
    has(/Spinner/i);
  if (!hasLoading) {
    issues.push({
      id: 'errors.loading',
      category: 'errors',
      severity: 'medium',
      title: 'No loading states detected',
      description:
        'Async actions with no feedback feel broken. Users click twice or leave.',
      fix: 'Add loading spinners/skeletons. Next.js: `app/loading.tsx`.',
    });
  } else passed.push('errors.loading');

  // Empty states
  const sourceFiles = ctx.files.filter(
    (f) => /\.(tsx?|jsx?)$/.test(f) && !f.includes('node_modules')
  );
  let hasEmptyState = false;
  for (const f of sourceFiles.slice(0, 40)) {
    const c = await ctx.getFile(f);
    if (!c) continue;
    if (/empty[- ]?state|No .* yet|nothing here|emptyState/i.test(c)) {
      hasEmptyState = true;
      break;
    }
  }
  if (!hasEmptyState && sourceFiles.length > 5) {
    issues.push({
      id: 'errors.empty',
      category: 'errors',
      severity: 'medium',
      title: 'No empty states detected',
      description:
        'New users see blank screens. Always show a friendly empty state with a CTA.',
      fix: 'Add empty state components for lists/dashboards: icon + "No X yet" + button.',
    });
  } else passed.push('errors.empty');

  return { issues, passed };
}