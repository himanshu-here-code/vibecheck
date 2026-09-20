import { Issue, RepoContext } from '../types';
import { Language } from '../detect/language';
import { ProjectPurpose } from '../detect/purpose';

/**
 * Directories where console.log / print() statements are legitimate.
 * Demos, examples, and benchmark scripts are expected to print output.
 */
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
  '.github/', // GitHub Actions and CI are not user-facing
];

/**
 * Build/output directories that shouldn't be scanned at all.
 */
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
];

function shouldSkipForPrint(path: string): boolean {
  return (
    PRINT_FRIENDLY_DIRS.some(
      (d) => path.startsWith(d) || path.includes(`/${d}`)
    ) ||
    path.includes('.test.') ||
    path.includes('.spec.')
  );
}

function shouldSkipEntirely(path: string): boolean {
  return BUILD_DIRS.some((d) => path.startsWith(d) || path.includes(`/${d}`));
}

export async function checkHygiene(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];
  const { language } = ctx;
  const purpose = ctx.projectPurpose as ProjectPurpose | undefined;

  const isLowExpectation =
    purpose === 'learning' ||
    purpose === 'experiment' ||
    purpose === 'docs';

  const has = (re: RegExp) => ctx.files.some((f) => re.test(f));

  // ---------------------------------------------------------------------------
  // .env.example
  // ---------------------------------------------------------------------------
  {
    const hasEnvExample = has(/\.env\.(example|sample|template)$/i);
    if (hasEnvExample) {
      passed.push('hygiene.env');
    } else if (isLowExpectation) {
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
        'Are you committing node_modules, venv, or .env files? Big red flag.',
      fix: `Add a .gitignore. Use gitignore.io with your language (${language.primary}) selected.`,
    });
  } else {
    passed.push('hygiene.gitignore');
  }

  // ---------------------------------------------------------------------------
  // Committed junk directories
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
      '.next',
      '.cache',
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
        description: `The \`${topDir}/\` directory is in your repo. Bloats clones, slows CI, can leak environment details.`,
        fix: `Add \`${topDir}/\` to .gitignore, then run \`git rm -r --cached ${topDir}\` and commit.`,
        affectedFiles: [committed],
      });
    } else {
      passed.push('hygiene.junk');
    }
  }

  // ---------------------------------------------------------------------------
  // Committed .env file
  // ---------------------------------------------------------------------------
  if (ctx.files.some((f) => /^\.env$/.test(f) || /^\.env\.local$/.test(f))) {
    issues.push({
      id: 'hygiene.envcommitted',
      category: 'hygiene',
      severity: 'critical',
      title: '.env file committed to repo',
      description:
        'Your secrets may be public. Anyone who forks this repo has your API keys.',
      fix:
        'Remove .env from git, add it to .gitignore, and rotate any exposed keys.',
      affectedFiles: ['.env'],
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
      fix: 'Add a README with: what it is, a screenshot, install steps, and how to run it.',
    });
  } else {
    passed.push('hygiene.readme');
  }

  // ---------------------------------------------------------------------------
  // package.json name (JS/TS only)
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
        // malformed package.json
      }
    }
  }

  // ---------------------------------------------------------------------------
  // pyproject.toml name (Python only)
  // ---------------------------------------------------------------------------
  if (language.primary === 'python') {
    const pyproject = await ctx.getFile('pyproject.toml');
    if (pyproject) {
      const nameMatch = pyproject.match(/name\s*=\s*["']([^"']+)["']/);
      if (
        nameMatch &&
        ['my-project', 'example-project', 'python-project'].includes(
          nameMatch[1].toLowerCase()
        )
      ) {
        issues.push({
          id: 'hygiene.pkgname',
          category: 'hygiene',
          severity: 'low',
          title: `pyproject.toml name is "${nameMatch[1]}"`,
          description: 'Default scaffold name. Rename it.',
          fix: `Set \`name = "your-real-name"\` in pyproject.toml.`,
          affectedFiles: ['pyproject.toml'],
        });
      } else {
        passed.push('hygiene.pkgname');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TODO/FIXME — skipped for learning/experiment/docs
  // ---------------------------------------------------------------------------
  if (isLowExpectation) {
    passed.push('hygiene.todos');
  } else {
    const sourceFiles = ctx.files
      .filter((f) => ctx.lang.sourceExtensions.test(f))
      .filter((f) => !shouldSkipEntirely(f));

    let todoCount = 0;
    const filesWithTodos: string[] = [];

    for (const f of sourceFiles.slice(0, 60)) {
      const c = await ctx.getFile(f);
      if (!c) continue;
      const matches = c.match(
        /(?:\/\/|#|--|\/\*)\s*(?:TODO|FIXME|XXX|HACK)\b/gi
      );
      if (matches) {
        todoCount += matches.length;
        filesWithTodos.push(f);
      }
    }

    if (todoCount > 3) {
      issues.push({
        id: 'hygiene.todos',
        category: 'hygiene',
        severity: 'low',
        title: `${todoCount} TODO/FIXME comments`,
        description: 'Half-finished code shipped. Users hit these eventually.',
        fix: 'Address or convert to GitHub issues. Then delete the comments.',
        affectedFiles: filesWithTodos.slice(0, 5),
      });
    } else {
      passed.push('hygiene.todos');
    }
  }

  // ---------------------------------------------------------------------------
  // Debug output — skipped for learning/experiment/docs, and for
  // example/script/bench directories where printing is expected.
  // ---------------------------------------------------------------------------
  if (isLowExpectation) {
    passed.push('hygiene.console');
  } else {
    const debugPatterns: Record<string, RegExp> = {
      typescript: /console\.(log|debug|info)\s*\(/g,
      javascript: /console\.(log|debug|info)\s*\(/g,
      python: /(^|\s)print\s*\(/gm,
      ruby: /(^|\s)puts\s+/g,
      go: /fmt\.Print(ln|f)?\(/g,
      php: /(^|\s)var_dump\s*\(|(^|\s)print_r\s*\(/g,
      rust: /println!\s*\(/g,
    };

    const pattern =
      debugPatterns[language.primary] ?? debugPatterns.typescript;

    const sourceFiles = ctx.files
      .filter((f) => ctx.lang.sourceExtensions.test(f))
      .filter((f) => !shouldSkipEntirely(f))
      .filter((f) => !shouldSkipForPrint(f));

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

    if (debugCount > 10) {
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
          'Debug output left in production. Performance + privacy concern.',
        fix: 'Remove debug calls or use a logger that strips in production.',
        affectedFiles: filesWithDebugs.slice(0, 5),
      });
    } else {
      passed.push('hygiene.console');
    }
  }

  return { issues, passed };
}

/**
 * Does this project actually use environment variables?
 */
async function detectEnvUsage(ctx: RepoContext): Promise<boolean> {
  const patterns: Partial<Record<Language, RegExp>> = {
    typescript: /process\.env\./,
    javascript: /process\.env\./,
    python: /os\.(environ|getenv)|dotenv|pydantic\.BaseSettings/,
    ruby: /ENV\[/,
    go: /os\.Getenv/,
    rust: /env::var/,
    php: /getenv\(|\$_ENV/,
  };

  const rx = patterns[ctx.language.primary];
  if (!rx) return false;

  const sample = ctx.files
    .filter((f) => ctx.lang.sourceExtensions.test(f))
    .filter((f) => !shouldSkipEntirely(f))
    .slice(0, 30);

  for (const f of sample) {
    const c = await ctx.getFile(f);
    if (c && rx.test(c)) return true;
  }

  return false;
}