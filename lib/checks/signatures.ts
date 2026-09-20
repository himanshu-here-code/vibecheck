import { Issue, RepoContext } from '../types';
import { ProjectPurpose } from '../detect/purpose';

// =============================================================================
// Framework detection
// =============================================================================

type Framework =
  | 'django'
  | 'flask'
  | 'fastapi'
  | 'rails'
  | 'laravel'
  | 'next'
  | 'vue'
  | 'react'
  | 'express';

interface Pattern {
  id: string;
  severity: Issue['severity'];
  title: string;
  description: string;
  fix: string;
  test: RegExp;
  category?: Issue['category'];
  requires?: Framework;
  restrictToFiles?: RegExp;
  requiresAppStructure?: boolean;
}

const PATTERNS: Pattern[] = [
  // ===========================================================================
  // UNIVERSAL
  // ===========================================================================
  {
    id: 'sig.lorem',
    severity: 'high',
    title: 'Placeholder text found',
    description:
      'Filler content is still in the app. This is the classic sign of a prototype that never got finished.',
    fix: 'Replace all placeholder copy with real content specific to your product.',
    test: /(\[your (company|product|name|text)\]|\blorem ipsum\b|\byour text here\b|\binsert your (text|content|tagline|headline)\b)/i,
  },
  {
    id: 'sig.localhost',
    severity: 'medium',
    title: 'Hardcoded localhost URLs',
    description:
      'Will break in production. Fetch calls to `localhost:3000` fail on your deployed app.',
    fix: 'Use env vars: `process.env.API_URL` (JS), `os.getenv("API_URL")` (Python).',
    test: /(fetch|axios|requests?|url)\s*[\(:]\s*["'`]http:\/\/localhost:\d+/i,
  },
  {
    id: 'sig.apikey',
    severity: 'critical',
    title: 'Hardcoded API key detected',
    description:
      'A string matching a known API key format was found in source. If this is real, it is now public.',
    fix: 'Move to env vars immediately and rotate the key at the provider. Assume it has been compromised.',
    test: /(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{30,}|AIza[0-9A-Za-z_-]{35})/,
  },
  {
    id: 'sig.builtwith',
    severity: 'low',
    title: '"Built with ❤️" footer',
    description:
      'Screams "template". Unless you specifically want to credit the framework, this reads as unfinished.',
    fix: 'Replace with something specific to your product, or remove it.',
    test: /built with\s+(❤️|❤|love|next\.js|react|vite|django|flask|rails|laravel|svelte)\b/i,
  },
  {
    id: 'sig.nodeSecret',
    severity: 'critical',
    title: 'Hardcoded secret in source',
    description:
      'A hardcoded value is assigned to a variable named secret, password, api_key, or access_token.',
    fix: 'Move to env vars immediately and rotate the value.',
    test: /(secret|password|api_?key|access_?token)\s*[:=]\s*['"][a-zA-Z0-9_\-!@#$%^&*]{20,}['"]/i,
  },

  // ===========================================================================
  // FRONTEND
  // ===========================================================================
  {
    id: 'sig.inter',
    severity: 'low',
    title: 'Using Inter font',
    description:
      'Inter is the AI default. Nothing wrong with it, but it signals "no font choice was made".',
    fix: 'Try Geist, Satoshi, or a serif for headings.',
    test: /from\s+['"]next\/font\/google['"][\s\S]{0,300}?\bInter(_Tight|_Display)?\b|font-family\s*:\s*['"]?Inter['"]?/i,
  },
  {
    id: 'sig.purple',
    severity: 'medium',
    title: 'AI-style purple/pink gradient detected',
    description:
      'Purple-to-pink gradients are the #1 vibecoded signature.',
    fix: 'Pick a real brand color. A solid accent beats a gradient every time.',
    test: /(from-(purple|pink|indigo|violet|fuchsia)-\d+[\s\S]{0,200}?to-(pink|purple|indigo|violet|fuchsia)-\d+)|(bg-gradient-to-[a-z]+[\s\S]{0,100}?from-(purple|pink|indigo|violet|fuchsia))/i,
  },
  {
    id: 'sig.dangerous',
    severity: 'high',
    title: 'dangerouslySetInnerHTML used',
    description:
      "XSS risk if the injected content isn't sanitized. Static analysis can't verify sanitization, so this is flagged for review.",
    fix: 'Use DOMPurify.sanitize() if you must, or restructure to avoid raw HTML injection.',
    test: /dangerouslySetInnerHTML/,
  },
  {
    id: 'sig.emoji',
    severity: 'low',
    title: 'Emoji-heavy UI',
    description:
      'Emojis used as icons instead of a real icon set.',
    fix: 'Use Lucide, Heroicons, or Phosphor. One icon system, everywhere.',
    test: /(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*){5,}/u,
  },

  // ===========================================================================
  // DJANGO
  // ===========================================================================
  {
    id: 'sig.djangoDebugTrue',
    severity: 'critical',
    title: 'Django DEBUG=True in settings',
    description:
      'Django is configured with DEBUG=True. In production, this exposes full tracebacks, SQL queries, and environment variables to any visitor.',
    fix: 'Read from env: `DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"`.',
    test: /^\s*DEBUG\s*=\s*True\s*(#.*)?$/m,
    requires: 'django',
    restrictToFiles: /(^|\/)settings[^/]*\.py$/i,
  },
  {
    id: 'sig.djangoSecretKey',
    severity: 'critical',
    title: 'Django SECRET_KEY hardcoded',
    description:
      'Django SECRET_KEY is set directly in settings.py. If it leaks, attackers can forge auth cookies.',
    fix: 'Read from env: `SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]`. Rotate if committed.',
    test: /SECRET_KEY\s*=\s*['"][a-zA-Z0-9!@#$%^&*()_+\-=]{20,}['"]/,
    requires: 'django',
    restrictToFiles: /(^|\/)settings[^/]*\.py$/i,
  },
  {
    id: 'sig.djangoWelcome',
    severity: 'low',
    title: 'Default Django welcome page',
    description: 'The default "It worked! Congratulations" page is still shipped.',
    fix: 'Replace the default landing page with your own.',
    test: /It worked!\s*Congratulations on your first Django-powered page/i,
    requires: 'django',
    requiresAppStructure: true,
  },

  // ===========================================================================
  // FLASK
  // ===========================================================================
  {
    id: 'sig.flaskDebugTrue',
    severity: 'critical',
    title: 'Flask running with debug=True',
    description:
      '`app.run(debug=True)` exposes the Werkzeug debugger in production, which allows arbitrary code execution.',
    fix: 'Read from env: `app.run(debug=os.getenv("FLASK_DEBUG") == "1")`.',
    test: /app\.run\([^)]*debug\s*=\s*True/,
    requires: 'flask',
  },
  {
    id: 'sig.flaskSecretKey',
    severity: 'critical',
    title: 'Flask SECRET_KEY hardcoded',
    description:
      'Flask SECRET_KEY is set directly in source. Sessions can be forged if it leaks.',
    fix: 'Read from env: `app.secret_key = os.environ["SECRET_KEY"]`.',
    test: /app\.secret_key\s*=\s*['"][a-zA-Z0-9!@#$%^&*()_+\-=]{20,}['"]/,
    requires: 'flask',
  },
  {
    id: 'sig.flaskWelcome',
    severity: 'low',
    title: 'Default Flask welcome route',
    description: 'The default "Hello, World!" root route is still shipped.',
    fix: 'Replace with your own landing route.',
    test: /@app\.route\(['"]\/['"]\)[\s\S]{0,100}?return\s+['"]Hello,?\s+World!['"]/i,
    requires: 'flask',
    requiresAppStructure: true,
  },

  // ===========================================================================
  // FASTAPI
  // ===========================================================================
  {
    id: 'sig.fastapiCorsAll',
    severity: 'high',
    title: 'FastAPI CORS allows all origins',
    description:
      '`allow_origins=["*"]` means any website can make authenticated requests to your API.',
    fix: 'Restrict origins: `allow_origins=["https://yourdomain.com"]`.',
    test: /allow_origins\s*=\s*\[\s*['"]\*['"]\s*\]/,
    requires: 'fastapi',
  },
  {
    id: 'sig.fastapiDebug',
    severity: 'high',
    title: 'FastAPI running with debug/reload in production',
    description:
      'Uvicorn `reload=True` or `debug=True` in production exposes detailed error pages.',
    fix: 'Read from env: `uvicorn.run(app, reload=os.getenv("DEBUG") == "1")`.',
    test: /uvicorn\.run\([\s\S]{0,200}?(reload\s*=\s*True|debug\s*=\s*True)/,
    requires: 'fastapi',
  },

  // ===========================================================================
  // RAILS
  // ===========================================================================
  {
    id: 'sig.railsSecret',
    severity: 'critical',
    title: 'Rails secret_key_base hardcoded',
    description: 'Rails secret_key_base is set directly in the source. Rotate immediately.',
    fix: 'Read from Rails credentials or an env var.',
    test: /secret_key_base\s*[:=]\s*['"][a-f0-9]{40,}['"]/,
    requires: 'rails',
  },
  {
    id: 'sig.railsDebug',
    severity: 'high',
    title: 'Rails debugging enabled in production',
    description:
      'config.consider_all_requests_local is set to true, exposing detailed error pages.',
    fix: 'Set to false in production.',
    test: /consider_all_requests_local\s*=\s*true/,
    requires: 'rails',
  },

  // ===========================================================================
  // LARAVEL
  // ===========================================================================
  {
    id: 'sig.laravelAppDebug',
    severity: 'critical',
    title: 'Laravel APP_DEBUG=true',
    description: 'Laravel runs with APP_DEBUG=true, exposing environment variables and stack traces.',
    fix: 'Set APP_DEBUG=false in production `.env`.',
    test: /APP_DEBUG\s*=\s*true/i,
    requires: 'laravel',
  },

  // ===========================================================================
  // NEXT.JS
  // ===========================================================================
  {
    id: 'sig.nextIgnoreBuildErrors',
    severity: 'high',
    title: 'Next.js ignores TypeScript build errors',
    description: 'next.config has `ignoreBuildErrors: true`. Real type errors will ship.',
    fix: 'Remove the flag and fix the underlying type errors.',
    test: /ignoreBuildErrors\s*:\s*true/,
    requires: 'next',
  },
  {
    id: 'sig.nextIgnoreEslint',
    severity: 'medium',
    title: 'Next.js ignores ESLint during builds',
    description: 'next.config has `ignoreDuringBuilds: true`. Lint errors will ship.',
    fix: 'Remove the flag and fix the lint errors.',
    test: /ignoreDuringBuilds\s*:\s*true/,
    requires: 'next',
  },
];

// =============================================================================
// Purpose-based skip rules
// =============================================================================

const PURPOSE_SKIP: Record<ProjectPurpose, string[]> = {
  product: [],
  learning: [
    'sig.djangoWelcome',
    'sig.flaskWelcome',
    'sig.lorem',
    'sig.builtwith',
    'sig.emoji',
  ],
  portfolio: ['sig.builtwith'],
  docs: ['sig.lorem', 'sig.emoji'],
  boilerplate: ['sig.lorem', 'sig.djangoWelcome', 'sig.flaskWelcome'],
  experiment: ['sig.lorem', 'sig.builtwith'],
  unknown: [],
};

// =============================================================================
// File exclusions
// =============================================================================

const EXCLUDED_PATH_FRAGMENTS = [
  // Dependencies and build output
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
  'coverage/',
  // Our own check definitions
  'lib/checks/',
  'privacy/page',
  'terms/page',
  'LoadingScan',
  // Tests, examples, benchmarks, docs, misc
  'bench/',
  'benchmark/',
  'benchmarks/',
  'fixtures/',
  '__tests__/',
  '__fixtures__/',
  'test-fixtures/',
  'tests/',
  'test/',
  '.github/',
  'examples/',
  'example/',
  'docs/',
  'doc/',
  'misc/',
  'migrations/',
  'samples/',
];

/**
 * Is this a test file? Test files contain arbitrary strings, placeholder
 * data, and example code that isn't shipped to users.
 */
function isTestFile(path: string): boolean {
  return (
    /_test\.go$/i.test(path) ||          // Go
    /^test_.*\.py$/i.test(path) ||       // Python (pytest convention)
    /_test\.py$/i.test(path) ||          // Python (alt convention)
    /Test\.(java|kt)$/i.test(path) ||    // Java / Kotlin
    /\.spec\.(ts|tsx|js|jsx|vue|svelte)$/i.test(path) ||
    /\.test\.(ts|tsx|js|jsx|vue|svelte)$/i.test(path) ||
    /_spec\.rb$/i.test(path)             // Ruby
  );
}

function isScannable(path: string, ctx: RepoContext): boolean {
  if (!ctx.lang.sourceExtensions.test(path)) return false;
  if (EXCLUDED_PATH_FRAGMENTS.some((frag) => path.includes(frag))) return false;
  if (isTestFile(path)) return false;
  return true;
}

// =============================================================================
// Framework detection
// =============================================================================

async function detectFrameworks(ctx: RepoContext): Promise<Set<Framework>> {
  const frameworks = new Set<Framework>();

  const pyManifests = [
    'requirements.txt',
    'requirements-dev.txt',
    'pyproject.toml',
    'Pipfile',
    'setup.py',
    'setup.cfg',
  ];
  let pyText = '';
  for (const m of pyManifests) {
    const content = await ctx.getFile(m);
    if (content) pyText += content.toLowerCase() + '\n';
  }

  if (pyText.includes('django') || ctx.fileSet.has('manage.py')) {
    frameworks.add('django');
  }
  if (pyText.includes('flask')) {
    frameworks.add('flask');
  }
  if (pyText.includes('fastapi')) {
    frameworks.add('fastapi');
  }

  const hasSettings = ctx.files.some((f) => /(^|\/)settings\.py$/i.test(f));
  const hasDjangoStruct = ctx.files.some((f) =>
    /(^|\/)(urls|wsgi|asgi)\.py$/i.test(f)
  );
  if (hasSettings && hasDjangoStruct) {
    frameworks.add('django');
  }

  const gemfile = await ctx.getFile('Gemfile');
  if (gemfile && /gem\s+['"]rails['"]/i.test(gemfile)) {
    frameworks.add('rails');
  }
  if (
    ctx.fileSet.has('config.ru') &&
    ctx.files.some((f) => /(^|\/)app\/controllers\//.test(f))
  ) {
    frameworks.add('rails');
  }

  const composerJson = await ctx.getFile('composer.json');
  if (composerJson && composerJson.toLowerCase().includes('laravel/framework')) {
    frameworks.add('laravel');
  }

  const pkgJson = await ctx.getFile('package.json');
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson);
      const deps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
      };

      if (deps['next']) frameworks.add('next');
      if (deps['vue'] || deps['nuxt']) frameworks.add('vue');
      if (deps['react'] || deps['react-dom']) frameworks.add('react');
      if (deps['express'] || deps['fastify'] || deps['koa']) {
        frameworks.add('express');
      }
    } catch {
      // malformed package.json
    }
  }

  return frameworks;
}

function hasAppEntryPoint(files: string[]): boolean {
  const appEntryPatterns = [
    /^app\.py$/i,
    /^main\.py$/i,
    /^server\.py$/i,
    /^application\.py$/i,
    /^wsgi\.py$/i,
    /^asgi\.py$/i,
    /^manage\.py$/i,
    /^run\.py$/i,
    /^src\/app\.py$/i,
    /^src\/main\.py$/i,
  ];
  return files.some((f) => appEntryPatterns.some((p) => p.test(f)));
}

// =============================================================================
// Main check
// =============================================================================

export async function checkSignatures(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];

  const purpose = ctx.projectPurpose as ProjectPurpose | undefined;
  const skippedIds = new Set<string>(
    purpose ? PURPOSE_SKIP[purpose] ?? [] : []
  );

  const frameworks = await detectFrameworks(ctx);
  const hasAppEntry = hasAppEntryPoint(ctx.files);

  const sourceFiles = ctx.files.filter((f) => isScannable(f, ctx));
  const sample = sourceFiles.slice(0, 80);

  const matchedFiles = new Map<string, string[]>();

  for (const f of sample) {
    const content = await ctx.getFile(f);
    if (!content) continue;

    for (const pattern of PATTERNS) {
      if (skippedIds.has(pattern.id)) continue;
      if (pattern.requires && !frameworks.has(pattern.requires)) continue;
      if (pattern.restrictToFiles && !pattern.restrictToFiles.test(f)) continue;
      if (pattern.requiresAppStructure && !hasAppEntry) continue;

      pattern.test.lastIndex = 0;
      if (pattern.test.test(content)) {
        if (!matchedFiles.has(pattern.id)) {
          matchedFiles.set(pattern.id, []);
        }
        matchedFiles.get(pattern.id)!.push(f);
      }
    }
  }

  for (const pattern of PATTERNS) {
    if (skippedIds.has(pattern.id)) {
      passed.push(pattern.id);
      continue;
    }
    if (pattern.requires && !frameworks.has(pattern.requires)) {
      passed.push(pattern.id);
      continue;
    }
    if (pattern.requiresAppStructure && !hasAppEntry) {
      passed.push(pattern.id);
      continue;
    }

    const files = matchedFiles.get(pattern.id) ?? [];

    if (files.length > 0) {
      issues.push({
        id: pattern.id,
        category: pattern.category ?? 'signatures',
        severity: pattern.severity,
        title:
          pattern.title + (files.length > 1 ? ` (${files.length} files)` : ''),
        description: pattern.description,
        fix: pattern.fix,
        affectedFiles: files.slice(0, 5),
      });
    } else {
      passed.push(pattern.id);
    }
  }

  return { issues, passed };
}