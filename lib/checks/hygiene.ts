import { Issue, RepoContext } from '../types';

export async function checkHygiene(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];
  const has = (re: RegExp) => ctx.files.some((f) => re.test(f));

  // .env.example
  if (!has(/\.env\.example$/i) && !has(/\.env\.sample$/i)) {
    issues.push({
      id: 'hygiene.env',
      category: 'hygiene',
      severity: 'medium',
      title: 'No .env.example',
      description:
        'Anyone (including future you) cloning this won\'t know what env vars are needed.',
      fix: 'Add `.env.example` with all keys (no values).',
    });
  } else passed.push('hygiene.env');

  // .gitignore
  if (!has(/^\.gitignore$/i)) {
    issues.push({
      id: 'hygiene.gitignore',
      category: 'hygiene',
      severity: 'high',
      title: 'No .gitignore',
      description: 'Are you committing node_modules or .env?? Huge red flag.',
      fix: 'Add a `.gitignore` — use gitignore.io or the standard Next.js one.',
    });
  } else passed.push('hygiene.gitignore');

  // node_modules committed
  if (ctx.files.some((f) => f.startsWith('node_modules/'))) {
    issues.push({
      id: 'hygiene.nodemodules',
      category: 'hygiene',
      severity: 'critical',
      title: 'node_modules is committed',
      description: 'Thousands of files that shouldn\'t be in your repo.',
      fix: 'Add `node_modules/` to `.gitignore`, then `git rm -r --cached node_modules`.',
    });
  } else passed.push('hygiene.nodemodules');

  // .env committed
  if (ctx.files.some((f) => /^\.env$/.test(f) || /^\.env\.local$/.test(f))) {
    issues.push({
      id: 'hygiene.envcommitted',
      category: 'hygiene',
      severity: 'critical',
      title: '.env file committed to repo',
      description:
        'Your secrets may be public. Rotate any keys in this file NOW.',
      fix: 'Remove .env from git, add to .gitignore, rotate keys.',
    });
  }

  // README
  const readme = ctx.getFileByPattern(/^README\.md$/i);
  if (!readme) {
    issues.push({
      id: 'hygiene.readme',
      category: 'hygiene',
      severity: 'medium',
      title: 'No README',
      description: 'No one knows what this project is or how to run it.',
      fix: 'Add a README with: what it is, screenshot, install, run.',
    });
  } else passed.push('hygiene.readme');

  // package.json name check
  const pkg = await ctx.getFile('package.json');
  if (pkg) {
    try {
      const data = JSON.parse(pkg);
      if (
        ['my-app', 'vite-project', 'my-project', 'temp', 'test', 'app'].includes(
          data.name
        )
      ) {
        issues.push({
          id: 'hygiene.pkgname',
          category: 'hygiene',
          severity: 'low',
          title: `package.json name is "${data.name}"`,
          description: 'Default scaffold name. Rename it.',
          fix: `Set "name": "your-real-name" in package.json.`,
        });
      } else passed.push('hygiene.pkgname');
    } catch {
      // ignore
    }
  }

  // TODO/FIXME comments
  const sourceFiles = ctx.files.filter(
    (f) =>
      /\.(tsx?|jsx?|vue|svelte)$/.test(f) &&
      !f.includes('node_modules') &&
      !f.includes('.next')
  );
  let todoCount = 0;
  let consoleCount = 0;
  for (const f of sourceFiles.slice(0, 60)) {
    const c = await ctx.getFile(f);
    if (!c) continue;
    todoCount += (c.match(/\/\/\s*(TODO|FIXME|XXX)/gi) || []).length;
    consoleCount += (c.match(/console\.(log|debug)\(/g) || []).length;
  }

  if (todoCount > 3) {
    issues.push({
      id: 'hygiene.todos',
      category: 'hygiene',
      severity: 'low',
      title: `${todoCount} TODO/FIXME comments`,
      description: 'Half-finished code shipped. Users hit these eventually.',
      fix: 'Address or convert to GitHub issues.',
    });
  } else passed.push('hygiene.todos');

  if (consoleCount > 10) {
    issues.push({
      id: 'hygiene.console',
      category: 'hygiene',
      severity: 'low',
      title: `${consoleCount}+ console.log statements`,
      description:
        'Debug logs left in production. Performance + privacy concern.',
      fix: 'Remove or use a logger that strips in prod.',
    });
  } else passed.push('hygiene.console');

  return { issues, passed };
}