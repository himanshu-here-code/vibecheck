import { Issue, RepoContext } from '../types';
import { ProjectPurpose } from '../detect/purpose';

const PATTERNS: Array<{
  id: string;
  severity: Issue['severity'];
  title: string;
  description: string;
  fix: string;
  test: RegExp;
  category?: Issue['category'];
}> = [
  // ---------------------------------------------------------------------------
  // Universal — apply to any language
  // ---------------------------------------------------------------------------
  {
    id: 'sig.lorem',
    severity: 'high',
    title: 'Placeholder text found',
    description:
      'Filler content is still in the app. This is THE vibecoded tell.',
    fix: 'Replace all placeholder copy with real content.',
    // Requires explicit bracketed placeholder syntax. Won't match "example.com"
    // in a form label or "your company name" in a contact form heading.
    test: /(\[your (company|product|name|text)\]|\blorem ipsum\b|\byour text here\b|\binsert your (text|content|tagline|headline)\b)/i,
  },
  {
    id: 'sig.localhost',
    severity: 'medium',
    title: 'Hardcoded localhost URLs',
    description:
      'Will break in production. Fetch calls to `localhost:3000` fail on your deployed app.',
    fix: 'Use env vars: `process.env.API_URL` (JS), `os.getenv("API_URL")` (Python).',
    // Require the URL to appear in a fetch/axios/requests call context
    test: /(fetch|axios|requests?|url)\s*[\(:]\s*["'`]http:\/\/localhost:\d+/i,
  },
  {
    id: 'sig.apikey',
    severity: 'critical',
    title: 'Possible hardcoded API key',
    description: 'Sketchy string that looks like a key found in source.',
    fix: 'Move to env vars immediately and rotate the key.',
    test: /(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{30,}|AIza[0-9A-Za-z_-]{35})/,
  },
  {
    id: 'sig.builtwith',
    severity: 'low',
    title: '"Built with ❤️" footer',
    description: 'Screams template. Unless you mean it, cut it.',
    fix: 'Replace with something specific to your product, or nothing.',
    test: /built with\s+(❤️|❤|love|next\.js|react|vite|django|flask|rails|laravel|svelte)\b/i,
  },

  // ---------------------------------------------------------------------------
  // Frontend
  // ---------------------------------------------------------------------------
  {
    id: 'sig.inter',
    severity: 'low',
    title: 'Using Inter font',
    description:
      'Inter is the AI default. Nothing wrong with it, but it signals "no design decisions were made".',
    fix: 'Try Geist, Satoshi, or a serif for headings.',
    test: /from\s+['"]next\/font\/google['"][\s\S]{0,300}?\bInter(_Tight|_Display)?\b|font-family\s*:\s*['"]?Inter['"]?/i,
  },
  {
    id: 'sig.purple',
    severity: 'medium',
    title: 'AI-style purple/pink gradient detected',
    description:
      'Purple-to-pink gradients are the #1 vibecoded signature. Every AI-built app looks the same.',
    fix: 'Pick a real brand color. A solid accent beats a gradient every time.',
    test: /(from-(purple|pink|indigo|violet|fuchsia)-\d+[\s\S]{0,200}?to-(pink|purple|indigo|violet|fuchsia)-\d+)|(bg-gradient-to-[a-z]+[\s\S]{0,100}?from-(purple|pink|indigo|violet|fuchsia))/i,
  },
  {
    id: 'sig.dangerous',
    severity: 'high',
    title: 'dangerouslySetInnerHTML used',
    description: "XSS risk if content isn't sanitized.",
    fix: 'Use DOMPurify if you must, or avoid it.',
    test: /dangerouslySetInnerHTML/,
  },
  {
    id: 'sig.emoji',
    severity: 'low',
    title: 'Emoji-heavy UI',
    description:
      'Emojis as icons (🚀 ✨ 🔥) instead of a real icon set. Looks amateur.',
    fix: 'Use Lucide, Heroicons, or Phosphor. One icon system, everywhere.',
    // Require 5+ emoji close together — one or two in copy is fine
    test: /(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*){5,}/u,
  },

  // ---------------------------------------------------------------------------
  // Python — framework-specific
  // ---------------------------------------------------------------------------
  {
    id: 'sig.pyDefault',
    severity: 'low',
    title: 'Default Django/Flask boilerplate',
    description:
      'Traces of `django-admin startproject` or `flask new` are still in the code.',
    fix: 'Customize your base template, app name, and settings.',
    test: /(Welcome to Django|Welcome to Flask|Your Project Name|It worked! Congratulations on your first Django-powered page)/i,
  },
  {
    id: 'sig.pyDebugTrue',
    severity: 'critical',
    title: 'Django DEBUG=True in settings',
    description:
      'Django runs with DEBUG=True. This exposes tracebacks, SQL queries, and environment variables to any visitor.',
    fix: 'Set DEBUG to read from an env var: `DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"`.',
    test: /^\s*DEBUG\s*=\s*True\s*(#|$)/m,
  },
  {
    id: 'sig.pySecretKey',
    severity: 'critical',
    title: 'Django SECRET_KEY hardcoded',
    description:
      'Django SECRET_KEY is set directly in settings.py. This key signs sessions and tokens.',
    fix: 'Read SECRET_KEY from an env var. Rotate the key if it was ever committed.',
    test: /SECRET_KEY\s*=\s*['"][a-zA-Z0-9!@#$%^&*()_+\-=]{20,}['"]/,
  },

  // ---------------------------------------------------------------------------
  // Ruby / Rails
  // ---------------------------------------------------------------------------
  {
    id: 'sig.railsSecret',
    severity: 'critical',
    title: 'Rails secret_key_base hardcoded',
    description:
      'Rails secret_key_base is set directly in the source. Rotate immediately.',
    fix: 'Read from Rails credentials or an env var.',
    test: /secret_key_base\s*[:=]\s*['"][a-f0-9]{40,}['"]/,
  },

  // ---------------------------------------------------------------------------
  // Node.js — server-side
  // ---------------------------------------------------------------------------
  {
    id: 'sig.nodeSecret',
    severity: 'critical',
    title: 'Hardcoded secret in JS/TS source',
    description:
      'A hardcoded value is assigned to a variable named "secret", "password", or "token".',
    fix: 'Move to env vars immediately and rotate the value.',
    test: /(secret|password|api_?key|access_?token)\s*[:=]\s*['"][a-zA-Z0-9_\-!@#$%^&*]{20,}['"]/i,
  },
];

// Patterns skipped per purpose
const PURPOSE_SKIP: Record<ProjectPurpose, string[]> = {
  product: [],
  learning: ['sig.pyDefault', 'sig.lorem', 'sig.builtwith', 'sig.emoji'],
  portfolio: ['sig.builtwith'],
  docs: ['sig.lorem', 'sig.emoji'],
  boilerplate: ['sig.lorem', 'sig.pyDefault'],
  experiment: ['sig.lorem', 'sig.builtwith'],
  unknown: [],
};

const EXCLUDED = [
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
  'lib/checks/',
  'privacy/page',
  'terms/page',
  'LoadingScan',
  'bench/',
  'benchmark/',
  'benchmarks/',
  'fixtures/',
  '__tests__/',
  '__fixtures__/',
  'test-fixtures/',
  '.test.',
  '.spec.',
  '.github/',
  'coverage/',
];

function isScannable(path: string, ctx: RepoContext): boolean {
  if (!ctx.lang.sourceExtensions.test(path)) return false;
  return !EXCLUDED.some((frag) => path.includes(frag));
}

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

  const sourceFiles = ctx.files.filter((f) => isScannable(f, ctx));
  const sample = sourceFiles.slice(0, 60);

  const matchedFiles = new Map<string, string[]>();

  for (const f of sample) {
    const content = await ctx.getFile(f);
    if (!content) continue;

    for (const pattern of PATTERNS) {
      if (skippedIds.has(pattern.id)) continue;

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