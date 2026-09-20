import { Issue, RepoContext } from '../types';

/**
 * Deeper quality checks — things that make a repo harder to maintain
 * or that indicate scaffolding was never cleaned up.
 *
 * Note: we deliberately do NOT re-check .gitignore here. hygiene.ts
 * handles both missing .gitignore and missing .env patterns. Duplicating
 * that logic caused the same issue to appear twice in reports.
 */
export async function checkQuality(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];

  const sourceFiles = ctx.files.filter(
    (f) =>
      ctx.lang.sourceExtensions.test(f) &&
      !f.includes('node_modules') &&
      !f.includes('.next') &&
      !f.includes('dist/') &&
      !f.includes('venv/') &&
      !f.includes('__pycache__/')
  );

  const htmlFiles = ctx.files.filter(
    (f) => /\.html?$/i.test(f) && !f.includes('node_modules')
  );

  // ---------------------------------------------------------------------------
  // 1. Images without alt text
  // ---------------------------------------------------------------------------
  {
    const offendingFiles: string[] = [];
    const imgTagRe = /<img\s+[^>]*src=[^>]*\/?>/g;
    const altRe = /\balt\s*=/;

    const scanForMissingAlt = (content: string): boolean => {
      const matches = content.match(imgTagRe);
      if (!matches) return false;
      return matches.some((tag) => !altRe.test(tag));
    };

    for (const f of sourceFiles.slice(0, 40)) {
      const content = await ctx.getFile(f);
      if (content && scanForMissingAlt(content)) offendingFiles.push(f);
    }

    for (const f of htmlFiles.slice(0, 20)) {
      const content = await ctx.getFile(f);
      if (content && scanForMissingAlt(content)) offendingFiles.push(f);
    }

    if (offendingFiles.length > 0) {
      issues.push({
        id: 'quality.imgAlt',
        category: 'quality',
        severity: 'medium',
        title: `Images missing alt text (${offendingFiles.length} file${offendingFiles.length > 1 ? 's' : ''})`,
        description:
          'Images without alt text are invisible to screen readers and hurt accessibility. Also bad for SEO.',
        fix:
          'Add a descriptive `alt` attribute to every `<img>`. For decorative images, use `alt=""`.',
        docs: 'https://web.dev/learn/accessibility/images',
        affectedFiles: offendingFiles.slice(0, 5),
      });
    } else {
      passed.push('quality.imgAlt');
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Multiple lockfiles
  // ---------------------------------------------------------------------------
  {
    const lockfiles = [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'bun.lockb',
      'bun.lock',
    ].filter((name) => ctx.fileSet.has(name));

    if (lockfiles.length > 1) {
      issues.push({
        id: 'quality.multipleLockfiles',
        category: 'quality',
        severity: 'medium',
        title: `Multiple lockfiles (${lockfiles.join(', ')})`,
        description:
          'Multiple lockfiles mean different developers are using different package managers. Causes inconsistent installs across machines and CI.',
        fix:
          'Pick one package manager and delete the others. Add the others to .gitignore. Add a `packageManager` field to package.json.',
        affectedFiles: lockfiles,
      });
    } else {
      passed.push('quality.multipleLockfiles');
    }
  }

  // ---------------------------------------------------------------------------
  // 3. No Node version pin (JS/TS only)
  // ---------------------------------------------------------------------------
  {
    const pkg = await ctx.getFile('package.json');
    if (pkg) {
      const hasNvmrc = ctx.fileSet.has('.nvmrc');
      const hasNodeVersion = ctx.fileSet.has('.node-version');
      const pkgHasEngines = /"engines"\s*:/.test(pkg);

      if (!hasNvmrc && !hasNodeVersion && !pkgHasEngines) {
        issues.push({
          id: 'quality.nodeVersion',
          category: 'quality',
          severity: 'low',
          title: 'No Node version specified',
          description:
            'New contributors and CI will guess which Node version to use. Different Node versions break different builds.',
          fix:
            'Add a `.nvmrc` file with your Node version (e.g., `20.11.0`), or add `"engines": { "node": ">=20" }` to package.json.',
        });
      } else {
        passed.push('quality.nodeVersion');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Unused dependencies (JS/TS only)
  // ---------------------------------------------------------------------------
  {
    const pkg = await ctx.getFile('package.json');
    if (pkg) {
      try {
        const data = JSON.parse(pkg);
        const deps = Object.keys({
          ...(data.dependencies ?? {}),
          ...(data.devDependencies ?? {}),
        });

        // Packages we can never reliably detect as "used" from source code
        const alwaysUsed = new Set([
          'react',
          'react-dom',
          'next',
          'typescript',
          'eslint',
          'prettier',
          'tailwindcss',
          '@tailwindcss/postcss',
          'autoprefixer',
          'postcss',
          'eslint-config-next',
          '@types/node',
          '@types/react',
          '@types/react-dom',
          'tw-animate-css',
          'shadcn',
          'clsx',
          'class-variance-authority',
          'tailwind-merge',
          'lucide-react',
          'framer-motion',
          'next-themes',
          'zod',
        ]);

        // Packages that are typically used via config or CSS, not JS imports
        const configOnly = [
          '@tailwindcss/',
          'eslint-',
          'prettier-',
          '@typescript-eslint/',
          'postcss-',
          'autoprefixer',
        ];

        const sampleContent: string[] = [];
        for (const f of sourceFiles.slice(0, 40)) {
          const c = await ctx.getFile(f);
          if (c) sampleContent.push(c);
        }
        const allSource = sampleContent.join('\n');

        const unused: string[] = [];
        for (const dep of deps) {
          if (alwaysUsed.has(dep)) continue;
          if (/^@types\//.test(dep)) continue;
          if (configOnly.some((prefix) => dep.startsWith(prefix))) continue;

          const importRe = new RegExp(
            `from\\s+['"]${escapeRegex(dep)}(\\/[^'"]*)?['"]|require\\(['"]${escapeRegex(dep)}(\\/[^'"]*)?['"]\\)|@import\\s+['"]${escapeRegex(dep)}`,
            'i'
          );

          if (!importRe.test(allSource)) {
            unused.push(dep);
          }
        }

        // Only flag if we're confident
        if (unused.length >= 3 && unused.length <= 10) {
          issues.push({
            id: 'quality.unusedDeps',
            category: 'quality',
            severity: 'low',
            title: `Possibly unused dependencies (${unused.length})`,
            description: `These packages are in package.json but we couldn't find them imported in the sampled source files. They may still be used — check before removing.`,
            fix:
              "Double-check each one. Some packages are used via config files or CSS imports that we can't detect. Remove only the ones you're sure about.",
            affectedFiles: ['package.json'],
          });
        } else {
          passed.push('quality.unusedDeps');
        }
      } catch {
        // malformed package.json
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Massive files
  // ---------------------------------------------------------------------------
  {
    const offenders: { file: string; lines: number }[] = [];

    for (const f of sourceFiles.slice(0, 60)) {
      const content = await ctx.getFile(f);
      if (!content) continue;
      const lines = content.split('\n').length;
      if (lines > 5000) offenders.push({ file: f, lines });
    }

    if (offenders.length > 0) {
      issues.push({
        id: 'quality.massiveFiles',
        category: 'quality',
        severity: 'low',
        title: `Very large source file${offenders.length > 1 ? 's' : ''}`,
        description: `These files exceed 5,000 lines: ${offenders.map((o) => `${o.file} (${o.lines})`).join(', ')}.`,
        fix:
          'Split large files into smaller modules by responsibility. 500-800 lines is a reasonable ceiling.',
        affectedFiles: offenders.slice(0, 5).map((o) => o.file),
      });
    } else {
      passed.push('quality.massiveFiles');
    }
  }

  // ---------------------------------------------------------------------------
  // 6. TODO/FIXME density
  // ---------------------------------------------------------------------------
  {
    const offenders: { file: string; count: number }[] = [];

    for (const f of sourceFiles.slice(0, 60)) {
      const content = await ctx.getFile(f);
      if (!content) continue;
      const count = (content.match(/\/\/\s*(TODO|FIXME|XXX|HACK)/gi) || []).length;
      if (count >= 3) offenders.push({ file: f, count });
    }

    if (offenders.length > 0) {
      const total = offenders.reduce((s, o) => s + o.count, 0);
      issues.push({
        id: 'quality.todoDensity',
        category: 'quality',
        severity: 'low',
        title: `${total} TODO/FIXME comments across ${offenders.length} file${offenders.length > 1 ? 's' : ''}`,
        description:
          'Comments like TODO and FIXME signal unfinished work. Fine while developing, not in a shipped product.',
        fix:
          'Address the TODOs or convert them to GitHub issues. Then delete the comments.',
        affectedFiles: offenders.slice(0, 5).map((o) => o.file),
      });
    } else {
      passed.push('quality.todoDensity');
    }
  }

  return { issues, passed };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}