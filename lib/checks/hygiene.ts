import { Issue, RepoContext } from '../types';
import { Language } from '../detect/language';
import { ProjectPurpose } from '../detect/purpose';

// =============================================================================
// Constants
// =============================================================================

const PRINT_FRIENDLY_DIRS = [
  'examples/',
  'example/',
  'scripts/',
  'script/',
  'bench/',
  'benchmark/',
  'benchmarks/',
  'demo/',
  'demos/',
  'test/',
  'tests/',
  '__tests__/',
  'fixtures/',
  'test-fixtures/',
  'samples/',
  'misc/',
  '.github/',
];

const BUILD_DIRS = [
  'node_modules/',
  '.next/',
  'dist/',
  'build/',
  'out/',
  'venv/',
  '.venv/',
  '__pycache__/',
  'target/',
  'vendor/',
  '.cache/',
  'coverage/',
];

/**
 * Is this a test file? Test files contain example code, placeholder data,
 * and debug output that isn't shipped to users.
 */
function isTestFile(path: string): boolean {
  return (
    /_test\.go$/i.test(path) ||
    /^test_.*\.py$/i.test(path) ||
    /_test\.py$/i.test(path) ||
    /Test\.(java|kt)$/i.test(path) ||
    /\.spec\.(ts|tsx|js|jsx|vue|svelte)$/i.test(path) ||
    /\.test\.(ts|tsx|js|jsx|vue|svelte)$/i.test(path) ||
    /_spec\.rb$/i.test(path)
  );
}

function skipPrint(path: string): boolean {
  if (isTestFile(path)) return true;
  return PRINT_FRIENDLY_DIRS.some(
    (d) => path.startsWith(d) || path.includes(`/${d}`)
  );
}

function skipAll(path: string): boolean {
  if (isTestFile(path)) return true;
  return BUILD_DIRS.some((d) => path.startsWith(d) || path.includes(`/${d}`));
}

// =============================================================================
// Main check
// =============================================================================

export async function checkHygiene(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];
  const { language } = ctx;
  const purpose = ctx.projectPurpose as ProjectPurpose | undefined;
  const projectType = ctx.projectType;

  const isLowExpectation =
    purpose === 'learning' ||
    purpose === 'experiment' ||
    purpose === 'docs';

  const isLibrary = projectType === 'library' || projectType === 'cli-tool';
  const isDocs = projectType === 'docs';

  const has = (re: RegExp) => ctx.files.some((f) => re.test(f));

  // ---------------------------------------------------------------------------
  // .env.example
  // ---------------------------------------------------------------------------
  {
    const hasEnvExample = has(/\.env\.(example|sample|template|dist)$/i);

    if (hasEnvExample) {
      passed.push('hygiene.env');
    } else if (isLowExpectation || isLibrary || isDocs) {
      passed.push('hygiene.env');
    } else {
      const usesEnv = await detectEnvUsage(ctx);
      if (usesEnv) {
        issues.push({
          id: 'hygiene.env',
          category: 'hygiene',
          severity: 'medium',
          title: 'No .env.example',
          description:
            "Anyone cloning this repo won't know what environment variables are needed.",
          fix: 'Add `.env.example` with all required keys but no real values.',
        });
      } else {
        passed.push('hygiene.env');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // .gitignore
  // ---------------------------------------------------------------------------
  if (!ctx.fileSet.has('.gitignore')) {
    issues.push({
      id: 'hygiene.gitignore',
      category: 'hygiene',
      severity: 'high',
      title: 'No .gitignore',
      description:
        'Are you committing node_modules, venv, or .env files?',
      fix: `Add a .gitignore. Use gitignore.io with "${language.primary}" selected.`,
    });
  } else {
    passed.push('hygiene.gitignore');
  }

  // ---------------------------------------------------------------------------
  // Committed junk
  // ---------------------------------------------------------------------------
  {
    const junkDirs = [
      'node_modules',
      'venv',
      '.venv',
      '__pycache__',
      'target',
      'vendor',
      'dist',
      'build',
      'out',
      '.next',
      '.cache',
      'coverage',
    ];
    const committed = ctx.files.find((f) => {
      const top = f.split('/')[0];
      return junkDirs.includes(top);
    });

    if (committed) {
      const topDir = committed.split('/')[0];
      issues.push({
        id: 'hygiene.junk',
        category: 'hygiene',
        severity: 'critical',
        title: `Committed build artifacts (${topDir}/)`,
        description: `The \`${topDir}/\` directory is committed. Bloats clones, slows CI.`,
        fix: `Add \`${topDir}/\` to .gitignore, then run \`git rm -r --cached ${topDir}\`.`,
        affectedFiles: [committed],
      });
    } else {
      passed.push('hygiene.junk');
    }
  }

  // ---------------------------------------------------------------------------
  // Committed .env
  // ---------------------------------------------------------------------------
  if (
    ctx.files.some((f) =>
      /^(\.env|\.env\.local|\.env\.production|\.env\.development)$/.test(f)
    )
  ) {
    issues.push({
      id: 'hygiene.envcommitted',
      category: 'hygiene',
      severity: 'critical',
      title: '.env file committed to repo',
      description: 'Your secrets are public. Anyone who forks has your API keys.',
      fix: 'Remove .env from git, add to .gitignore, and rotate every key.',
    });
  } else {
    passed.push('hygiene.envcommitted');
  }

  // ---------------------------------------------------------------------------
  // README
  // ---------------------------------------------------------------------------
  const readme = ctx.getFileByPattern(/^README(\.md|\.rst|\.txt)?$/i);
  if (!readme) {
    issues.push({
      id: 'hygiene.readme',
      category: 'hygiene',
      severity: 'medium',
      title: 'No README',
      description: 'No one knows what this project is or how to run it.',
      fix: 'Add a README with: what it is, install steps, and how to run it.',
    });
  } else {
    passed.push('hygiene.readme');
  }

  // ---------------------------------------------------------------------------
  // package.json name
  // ---------------------------------------------------------------------------
  if (language.primary === 'typescript' || language.primary === 'javascript') {
    const pkg = await ctx.getFile('package.json');
    if (pkg) {
      try {
        const data = JSON.parse(pkg);
        const badNames = [
          'my-app',
          'vite-project',
          'my-project',
          'temp',
          'test',
          'app',
          'next-app',
          'react-app',
          'new-project',
        ];
        if (data.name && badNames.includes(data.name.toLowerCase())) {
          issues.push({
            id: 'hygiene.pkgname',
            category: 'hygiene',
            severity: 'low',
            title: `package.json name is "${data.name}"`,
            description: 'Default scaffold name. Rename it.',
            fix: `Set "name": "your-real-name" in package.json.`,
            affectedFiles: ['package.json'],
          });
        } else {
          passed.push('hygiene.pkgname');
        }
      } catch {
        // skip
      }
    }
  }

  // ---------------------------------------------------------------------------
  // pyproject.toml name
  // ---------------------------------------------------------------------------
  if (language.primary === 'python') {
    for (const manifest of ['pyproject.toml', 'setup.py']) {
      const content = await ctx.getFile(manifest);
      if (!content) continue;
      const m = content.match(/name\s*=\s*["']([^"']+)["']/);
      if (
        m &&
        ['my-project', 'example-project', 'python-project', 'test'].includes(
          m[1].toLowerCase()
        )
      ) {
        issues.push({
          id: 'hygiene.pkgname',
          category: 'hygiene',
          severity: 'low',
          title: `${manifest} name is "${m[1]}"`,
          description: 'Default scaffold name. Rename it.',
          fix: `Set \`name = "your-real-name"\` in ${manifest}.`,
        });
        break;
      } else {
        passed.push('hygiene.pkgname');
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TODO/FIXME — exclude test files
  // ---------------------------------------------------------------------------
  if (isLowExpectation) {
    passed.push('hygiene.todos');
  } else {
    const sourceFiles = ctx.files
      .filter((f) => ctx.lang.sourceExtensions.test(f))
      .filter((f) => !skipAll(f))
      .filter((f) => !isTestFile(f));

    let todoCount = 0;
    const filesWithTodos: string[] = [];

    for (const f of sourceFiles.slice(0, 60)) {
      const c = await ctx.getFile(f);
      if (!c) continue;
      const matches = c.match(
        /(?:\/\/|#|--|<!--)\s*(?:TODO|FIXME|XXX|HACK)\b/gi
      );
      if (matches) {
        todoCount += matches.length;
        filesWithTodos.push(f);
      }
    }

    if (todoCount > 10) {
      issues.push({
        id: 'hygiene.todos',
        category: 'hygiene',
        severity: 'low',
        title: `${todoCount} TODO/FIXME comments`,
        description:
          'Comments like TODO and FIXME signal unfinished work.',
        fix:
          'Address the TODOs or convert them to GitHub issues. Then delete the comments.',
        affectedFiles: filesWithTodos.slice(0, 5),
      });
    } else {
      passed.push('hygiene.todos');
    }
  }

  // ---------------------------------------------------------------------------
  // Debug output — exclude test files, examples, and misc
  // ---------------------------------------------------------------------------
  if (isLowExpectation) {
    passed.push('hygiene.console');
  } else {
    const debugPatterns: Record<string, RegExp> = {
      typescript: /console\.(log|debug|info)\s*\(/g,
      javascript: /console\.(log|debug|info)\s*\(/g,
      python: /(^|\s)print\s*\(/gm,
      ruby: /(^|\s)(puts|p|pp)\s+/g,
      go: /fmt\.Print(ln|f)?\(/g,
      php: /(^|\s)(var_dump|print_r)\s*\(/g,
      rust: /println!\s*\(/g,
    };

    const pattern =
      debugPatterns[language.primary] ?? debugPatterns.typescript;

    const sourceFiles = ctx.files
      .filter((f) => ctx.lang.sourceExtensions.test(f))
      .filter((f) => !skipAll(f))
      .filter((f) => !skipPrint(f));

    let debugCount = 0;
    const filesWithDebugs: string[] = [];

    for (const f of sourceFiles.slice(0, 60)) {
      const c = await ctx.getFile(f);
      if (!c) continue;
      pattern.lastIndex = 0;
      const matches = c.match(pattern);
      if (matches) {
        debugCount += matches.length;
        filesWithDebugs.push(f);
      }
    }

    if (debugCount > 20) {
      const debugName =
        language.primary === 'python'
          ? 'print() statements'
          : language.primary === 'ruby'
            ? 'puts statements'
            : language.primary === 'go'
              ? 'fmt.Println calls'
              : language.primary === 'rust'
                ? 'println! macros'
                : 'console.log statements';
      issues.push({
        id: 'hygiene.console',
        category: 'hygiene',
        severity: 'low',
        title: `${debugCount}+ ${debugName}`,
        description:
          'Debug output left in production. Performance and privacy concern.',
        fix: 'Remove debug calls or use a logger that strips in production.',
        affectedFiles: filesWithDebugs.slice(0, 5),
      });
    } else {
      passed.push('hygiene.console');
    }
  }

  return { issues, passed };
}

// =============================================================================
// Env usage detection
// =============================================================================

async function detectEnvUsage(ctx: RepoContext): Promise<boolean> {
  const patterns: Partial<Record<Language, RegExp>> = {
    typescript: /process\.env\./,
    javascript: /process\.env\./,
    python: /os\.(environ|getenv)|dotenv|pydantic\.BaseSettings|settings\./,
    ruby: /ENV\[|Rails\.application\.config/,
    go: /os\.Getenv|os\.LookupEnv/,
    rust: /env::var|std::env/,
    php: /getenv\(|\$_ENV/,
  };

  const rx = patterns[ctx.language.primary];
  if (!rx) return false;

  const sample = ctx.files
    .filter((f) => ctx.lang.sourceExtensions.test(f))
    .filter((f) => !skipAll(f))
    .slice(0, 30);

  for (const f of sample) {
    const c = await ctx.getFile(f);
    if (c && rx.test(c)) return true;
  }

  return false;
}