import { Issue, RepoContext } from '../types';

export async function checkSEO(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];
  const has = (re: RegExp) => ctx.files.some((f) => re.test(f));

  // Favicon
  if (
    !has(/favicon\.(ico|png|svg)$/i) &&
    !has(/app\/icon\.(ico|png|svg|jpg)$/i) &&
    !has(/public\/icon\.(ico|png|svg|jpg)$/i)
  ) {
    issues.push({
      id: 'seo.favicon',
      category: 'seo',
      severity: 'high',
      title: 'No favicon',
      description:
        'Your app shows the default browser globe icon in tabs. Instantly screams "unfinished".',
      fix: 'Add `app/icon.png` (Next.js) or `public/favicon.ico`. 512x512 PNG works everywhere.',
    });
  } else passed.push('seo.favicon');

  // og:image
  const metaFiles = ctx.files.filter((f) =>
    /(layout|head|index)\.(tsx?|jsx?|html)$/.test(f) && !f.includes('node_modules')
  );
  let hasOgImage = false;
  let hasTitle = false;
  let hasDescription = false;
  let titleIsDefault = false;

  for (const f of metaFiles.slice(0, 10)) {
    const content = await ctx.getFile(f);
    if (!content) continue;
    if (/og:image|openGraph/i.test(content)) hasOgImage = true;
    if (/<title>|title:/i.test(content)) {
      hasTitle = true;
      if (/Vite \+ React|Create Next App|Create React App|Vite \+ TS/i.test(content)) {
        titleIsDefault = true;
      }
    }
    if (/name=["']description["']|description:/i.test(content)) hasDescription = true;
  }

  if (!hasOgImage) {
    issues.push({
      id: 'seo.ogimage',
      category: 'seo',
      severity: 'high',
      title: 'No Open Graph image',
      description:
        'When your link is shared on X, Slack, Discord, etc. it shows no preview. Big trust killer.',
      fix: 'Add `og:image` meta tag + a 1200x630 image. Next.js: `app/opengraph-image.png`. Or use a free generator like og-playground.',
    });
  } else passed.push('seo.ogimage');

  if (titleIsDefault) {
    issues.push({
      id: 'seo.title.default',
      category: 'seo',
      severity: 'high',
      title: 'Default framework title ("Vite + React")',
      description:
        'Your page title is still the scaffold default. Nobody wants to see "Vite + React" in their browser tab.',
      fix: 'Set a real `<title>` in your HTML head or metadata export.',
    });
  } else if (!hasTitle) {
    issues.push({
      id: 'seo.title.missing',
      category: 'seo',
      severity: 'high',
      title: 'No page title',
      description: 'Missing `<title>` tag. Hurts SEO and looks broken in tabs/shares.',
      fix: 'Add a descriptive title in head/layout.',
    });
  } else passed.push('seo.title');

  if (!hasDescription) {
    issues.push({
      id: 'seo.description',
      category: 'seo',
      severity: 'medium',
      title: 'No meta description',
      description: 'Google will write its own snippet. Yours would be better.',
      fix: 'Add `<meta name="description" content="...">`. 150-160 chars.',
    });
  } else passed.push('seo.description');

  // robots.txt
  if (!has(/robots\.txt$/i) && !has(/robots\.ts$/i)) {
    issues.push({
      id: 'seo.robots',
      category: 'seo',
      severity: 'low',
      title: 'No robots.txt',
      description: 'Search engines guess. You should tell them.',
      fix: 'Add `public/robots.txt` or Next.js `app/robots.ts`.',
    });
  } else passed.push('seo.robots');

  // sitemap
  if (!has(/sitemap\.xml$/i) && !has(/sitemap\.ts$/i)) {
    issues.push({
      id: 'seo.sitemap',
      category: 'seo',
      severity: 'low',
      title: 'No sitemap',
      description: 'Helps search engines index your pages faster.',
      fix: 'Add `public/sitemap.xml` or Next.js `app/sitemap.ts`.',
    });
  } else passed.push('seo.sitemap');

  return { issues, passed };
}