import { Issue, RepoContext } from '../types';

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
    description: 'Filler content is still in the app. This is THE vibecoded tell.',
    fix: 'Replace all placeholder copy with real content.',
    test: /lorem ipsum|your text here|placeholder text|company name|your company|example\.com/i,
  },
  {
    id: 'sig.inter',
    severity: 'low',
    title: 'Using Inter font',
    description:
      'Inter is the AI default. Nothing wrong with it, but it signals "no design decisions were made".',
    fix: 'Try Geist, Satoshi, or a serif for headings. Or keep Inter but pair it.',
    test: /['"]Inter['"]|font-inter|family=Inter/,
  },
  {
    id: 'sig.purple',
    severity: 'medium',
    title: 'Classic AI purple gradient detected',
    description:
      'Purple-to-pink gradients are the #1 vibecoded signature. Everyone\'s app looks the same.',
    fix: 'Pick a real brand color. Look at Linear, Vercel, Stripe for restraint.',
    test: /from-purple-|to-pink-|from-indigo-|#8b5cf6|#a855f7|hsl\(262/,
  },
  {
    id: 'sig.builtwith',
    severity: 'low',
    title: '"Built with ❤️" footer',
    description: 'Screams template. Unless you mean it, cut it.',
    fix: 'Replace with something specific to your product, or nothing.',
    test: /Built with (❤️|❤|love|Next\.js|React|Vite)/i,
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
    description: 'XSS risk if content isn\'t sanitized.',
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
    test: /[🚀✨🔥💡🎯⚡️🌟💯🎨]/,
  },
];

export async function checkSignatures(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];

  const sourceFiles = ctx.files.filter(
    (f) =>
      /\.(tsx?|jsx?|vue|svelte|css|scss)$/.test(f) &&
      !f.includes('node_modules') &&
      !f.includes('.next') &&
      !f.includes('dist/')
  );

  const hits = new Map<string, number>();

  // Sample up to 60 files to stay under rate limits
  for (const f of sourceFiles.slice(0, 60)) {
    const c = await ctx.getFile(f);
    if (!c) continue;
    for (const p of PATTERNS) {
      if (p.test.test(c)) {
        hits.set(p.id, (hits.get(p.id) ?? 0) + 1);
      }
    }
  }

  for (const p of PATTERNS) {
    const count = hits.get(p.id) ?? 0;
    if (count > 0) {
      issues.push({
        id: p.id,
        category: p.category ?? 'signatures',
        severity: p.severity,
        title: p.title + (count > 1 ? ` (${count} files)` : ''),
        description: p.description,
        fix: p.fix,
      });
    } else {
      passed.push(p.id);
    }
  }

  return { issues, passed };
}