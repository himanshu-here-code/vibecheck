import { Issue, RepoContext } from '../types';

/**
 * Patterns that define the "vibecoded signature" checks.
 *
 * When adding a new pattern:
 *   1. Test it against 5+ real repos before shipping
 *   2. If it can match the check file itself, exclude that file (see sourceFiles filter below)
 *   3. Prefer specific matches over broad ones — a false positive is worse than a missed signal
 */
const PATTERNS: Array<{
  id: string;
  severity: Issue['severity'];
  title: string;
  description: string;
  fix: string;
  test: RegExp;
  category?: Issue['category'];
}> = [
  {
    id: 'sig.lorem',
    severity: 'high',
    title: 'Placeholder text found ("Lorem ipsum" / "Your text here")',
    description:
      'Filler content is still in the app. This is THE vibecoded tell.',
    fix: 'Replace all placeholder copy with real content.',
    test: /\b(lorem ipsum|your text here|insert your|your company name|your tagline|example\.com)\b/i,
  },
  {
    id: 'sig.inter',
    severity: 'low',
    title: 'Using Inter font',
    description:
      'Inter is the AI default. Nothing wrong with it, but it signals "no design decisions were made".',
    fix: 'Try Geist, Satoshi, or a serif for headings. Or keep Inter but pair it with a distinctive display face.',
    test: /from\s+['"]next\/font\/google['"][\s\S]{0,300}?\bInter(_Tight|_Display)?\b/,
  },
  {
    id: 'sig.purple',
    severity: 'medium',
    title: 'AI-style purple/pink gradient detected',
    description:
      'Purple-to-pink gradients are the #1 vibecoded signature. Every AI-built app looks the same.',
    fix: 'Pick a real brand color. Look at Linear, Vercel, Stripe for restraint. A solid accent beats a gradient every time.',
    test: /(from-(purple|pink|indigo|violet|fuchsia)-\d+[\s\S]{0,200}?to-(pink|purple|indigo|violet|fuchsia)-\d+)|(bg-gradient-to-[a-z]+[\s\S]{0,100}?from-(purple|pink|indigo|violet|fuchsia))/i,
  },
  {
    id: 'sig.builtwith',
    severity: 'low',
    title: '"Built with ❤️" footer',
    description: 'Screams template. Unless you mean it, cut it.',
    fix: 'Replace with something specific to your product, or nothing.',
    test: /built with\s+(❤️|❤|love|next\.js|react|vite)\b/i,
  },
  {
    id: 'sig.localhost',
    severity: 'medium',
    title: 'Hardcoded localhost URLs',
    description:
      'Will break in production. Fetch calls to `localhost:3000` fail on your deployed app.',
    fix: 'Use env vars: `process.env.NEXT_PUBLIC_API_URL`.',
    test: /["'`]http:\/\/localhost:\d+/,
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
    id: 'sig.apikey',
    severity: 'critical',
    title: 'Possible hardcoded API key',
    description: 'Sketchy string that looks like a key found in source.',
    fix: 'Move to env vars immediately and rotate the key.',
    test: /(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})/,
  },
  {
    id: 'sig.emoji',
    severity: 'low',
    title: 'Emoji-heavy UI',
    description:
      'Emojis as icons (🚀 ✨ 🔥) instead of a real icon set. Looks amateur.',
    fix: 'Use Lucide, Heroicons, or Phosphor. One icon system, everywhere.',
    test: /(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*){3,}/u,
  },
];

/**
 * Files we intentionally skip when looking for vibecoded signatures.
 */
const EXCLUDED_PATH_FRAGMENTS = [
  'node_modules',
  '.next',
  'dist/',
  'lib/checks/',
  'privacy/page',
  'terms/page',
  'LoadingScan',
];

/**
 * Files we actually want to scan for signature patterns.
 */
function isScannableFile(path: string): boolean {
  if (!/\.(tsx?|jsx?|vue|svelte|css|scss)$/.test(path)) return false;
  return !EXCLUDED_PATH_FRAGMENTS.some((frag) => path.includes(frag));
}

export async function checkSignatures(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];

  const sourceFiles = ctx.files.filter(isScannableFile);
  const sample = sourceFiles.slice(0, 60);

  const hits = new Map<string, number>();

  for (const f of sample) {
    const content = await ctx.getFile(f);
    if (!content) continue;

    for (const pattern of PATTERNS) {
      pattern.test.lastIndex = 0;
      if (pattern.test.test(content)) {
        hits.set(pattern.id, (hits.get(pattern.id) ?? 0) + 1);
      }
    }
  }

  for (const pattern of PATTERNS) {
    const count = hits.get(pattern.id) ?? 0;

    if (count > 0) {
      issues.push({
        id: pattern.id,
        category: pattern.category ?? 'signatures',
        severity: pattern.severity,
        title: pattern.title + (count > 1 ? ` (${count} files)` : ''),
        description: pattern.description,
        fix: pattern.fix,
      });
    } else {
      passed.push(pattern.id);
    }
  }

  return { issues, passed };
}