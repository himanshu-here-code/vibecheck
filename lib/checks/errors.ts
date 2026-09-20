import { Issue, RepoContext } from '../types';

export async function checkErrorStates(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];

  const SKIP = [
    'node_modules',
    '.next',
    'dist/',
    'build/',
    'venv/',
    '.venv/',
    '__pycache__/',
  ];
  const has = (re: RegExp) =>
    ctx.files.some((f) => !SKIP.some((s) => f.includes(s)) && re.test(f));

  // ---- 404 page ------------------------------------------------------------
  const has404 =
    has(/(^|\/)404\.(tsx?|jsx?|html?|vue|svelte|astro|py|rb|php)$/i) ||
    has(/(^|\/)not[-_]?found\.(tsx?|jsx?|html?|vue|svelte|astro|py)$/i) ||
    has(/pages\/404\./i) ||
    has(/app\/not-found\./i) ||
    has(/templates\/404\./i);

  if (!has404) {
    // Some SPA frameworks handle 404 dynamically in the router
    const routerFile = ctx.files.find((f) => /router|routes/i.test(f));
    let handledInRouter = false;
    if (routerFile) {
      const content = await ctx.getFile(routerFile);
      if (content && /(\*|\/\*|catch[-_ ]?all|notFound|not[- ]found)/i.test(content)) {
        handledInRouter = true;
      }
    }

    if (!handledInRouter) {
      issues.push({
        id: 'errors.404',
        category: 'errors',
        severity: 'high',
        title: 'No 404 page',
        description:
          'Users hitting dead links get the default browser/host error. Looks unprofessional.',
        fix:
          'Add `app/not-found.tsx` (Next.js) or a 404 route in your router.',
      });
    } else {
      passed.push('errors.404');
    }
  } else {
    passed.push('errors.404');
  }

  // ---- Error boundary ------------------------------------------------------
  const hasErrorBoundary =
    has(/(^|\/)error\.(tsx?|jsx?|vue|svelte|astro)$/i) ||
    has(/(^|\/)ErrorBoundary/i) ||
    has(/global[-_]?error\./i) ||
    has(/app\/error\./i) ||
    has(/pages\/_error\./i);

  // Source-level check for React ErrorBoundary class
  let sourceErrorBoundary = false;
  if (!hasErrorBoundary) {
    const candidates = ctx.files
      .filter((f) => /\.(tsx?|jsx?|vue|svelte)$/i.test(f))
      .filter((f) => !SKIP.some((s) => f.includes(s)))
      .slice(0, 30);
    for (const f of candidates) {
      const c = await ctx.getFile(f);
      if (!c) continue;
      if (/componentDidCatch|ErrorBoundary|errorElement|errorComponent/i.test(c)) {
        sourceErrorBoundary = true;
        break;
      }
    }
  }

  if (!hasErrorBoundary && !sourceErrorBoundary) {
    issues.push({
      id: 'errors.boundary',
      category: 'errors',
      severity: 'high',
      title: 'No error boundary / error page',
      description:
        'One uncaught error = entire app goes white screen. Users see nothing.',
      fix:
        'Add `app/error.tsx` in Next.js, or wrap with a React ErrorBoundary.',
    });
  } else {
    passed.push('errors.boundary');
  }

  // ---- Loading states ------------------------------------------------------
  const hasLoading =
    has(/(^|\/)loading\.(tsx?|jsx?|vue|svelte)$/i) ||
    has(/(^|\/)Loading\./i) ||
    has(/(^|\/)Skeleton\./i) ||
    has(/(^|\/)Spinner\./i) ||
    has(/loading\.tsx$/i);

  // Source-level: check for spinner/skeleton patterns
  let sourceLoading = false;
  if (!hasLoading) {
    const candidates = ctx.files
      .filter((f) => ctx.lang.sourceExtensions.test(f))
      .filter((f) => !SKIP.some((s) => f.includes(s)))
      .slice(0, 40);
    for (const f of candidates) {
      const c = await ctx.getFile(f);
      if (!c) continue;
      if (/animate-spin|animate-pulse|isLoading|loading=\{?true|Suspense|useState\(.*loading/i.test(c)) {
        sourceLoading = true;
        break;
      }
    }
  }

  if (!hasLoading && !sourceLoading) {
    issues.push({
      id: 'errors.loading',
      category: 'errors',
      severity: 'medium',
      title: 'No loading states detected',
      description:
        'Async actions with no feedback feel broken. Users click twice or leave.',
      fix:
        'Add loading spinners/skeletons. Next.js: `app/loading.tsx`.',
    });
  } else {
    passed.push('errors.loading');
  }

  // ---- Empty states --------------------------------------------------------
  const candidates = ctx.files
    .filter((f) => ctx.lang.sourceExtensions.test(f))
    .filter((f) => !SKIP.some((s) => f.includes(s)))
    .slice(0, 40);

  let hasEmptyState = false;
  for (const f of candidates) {
    const c = await ctx.getFile(f);
    if (!c) continue;
    if (
      /empty[- ]?state|No .* yet|nothing (here|to see)|nothingYet|zero[- ]state/i.test(c) ||
      /(no|zero) (results|items|data|matches) found/i.test(c)
    ) {
      hasEmptyState = true;
      break;
    }
  }

  if (!hasEmptyState && ctx.files.length > 10) {
    issues.push({
      id: 'errors.empty',
      category: 'errors',
      severity: 'medium',
      title: 'No empty states detected',
      description:
        'New users see blank screens. Always show a friendly empty state with a CTA.',
      fix:
        'Add empty state components for lists/dashboards: icon + "No X yet" + button.',
    });
  } else {
    passed.push('errors.empty');
  }

  return { issues, passed };
}