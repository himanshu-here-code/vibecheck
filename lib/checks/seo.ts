import { Issue, RepoContext } from '../types';
import type { ProjectPurpose } from '../detect/purpose';

export async function checkSEO(ctx: RepoContext): Promise<{
  issues: Issue[];
  passed: string[];
}> {
  const issues: Issue[] = [];
  const passed: string[] = [];
  const { lang, language } = ctx;
  const purpose = ctx.projectPurpose as ProjectPurpose | undefined;

  // -----------------------------------------------------------------------
  // SEO applies only to projects that a search engine would index:
  // web apps, portfolios, docs sites, and templates. Libraries, CLIs,
  // Python packages, and APIs are not indexed.
  // -----------------------------------------------------------------------
  const SEO_APPLIES: ProjectPurpose[] = [
    'product',
    'portfolio',
    'docs',
    'boilerplate',
  ];

  if (!language.isWebProject || !purpose || !SEO_APPLIES.includes(purpose)) {
    // Silently pass all SEO checks
    passed.push('seo.favicon');
    passed.push('seo.ogimage');
    passed.push('seo.title');
    passed.push('seo.description');
    passed.push('seo.robots');
    passed.push('seo.sitemap');
    return { issues, passed };
  }

  // ---- Favicon -------------------------------------------------------------
  const hasFavicon = ctx.files.some(
    (f) =>
      /favicon\.(ico|png|svg|jpg|jpeg|webp)$/i.test(f) ||
      /app\/icon\.(png|svg|jpg|jpeg|ico)$/i.test(f) ||
      /public\/icon\.(png|svg|jpg|jpeg|ico)$/i.test(f) ||
      /static\/favicon\.(ico|png|svg)$/i.test(f)
  );
  if (!hasFavicon) {
    issues.push({
      id: 'seo.favicon',
      category: 'seo',
      severity: 'high',
      title: 'No favicon',
      description:
        'Your app shows the default browser globe icon in tabs. Instantly screams "unfinished".',
      fix:
        'Add a favicon. In Next.js: `app/icon.png`. In raw HTML: `<link rel="icon" href="/favicon.ico">`.',
    });
  } else {
    passed.push('seo.favicon');
  }

  // ---- Meta tags -----------------------------------------------------------
  const metaFile = ctx.files.find((f) =>
    lang.metaCandidates.some((rx) => rx.test(f))
  );

  let hasOgImage = false;
  let hasTitle = false;
  let hasDescription = false;
  let titleIsDefault = false;

  if (metaFile) {
    const content = await ctx.getFile(metaFile);
    if (content) {
      if (
        /og:image|openGraph|property\s*=\s*["']og:image/i.test(content)
      ) {
        hasOgImage = true;
      }
      if (/<title>|title\s*[:=]|title\s*=\s*["']/i.test(content)) {
        hasTitle = true;
        if (
          /Vite \+ React|Create Next App|Create React App|Vite \+ TS|Welcome to Django|Flask App/i.test(
            content
          )
        ) {
          titleIsDefault = true;
        }
      }
      if (
        /name\s*=\s*["']description["']|description\s*[:=]/i.test(content)
      ) {
        hasDescription = true;
      }
    }
  }

  if (!hasOgImage) {
    issues.push({
      id: 'seo.ogimage',
      category: 'seo',
      severity: 'high',
      title: 'No Open Graph image',
      description:
        'When your link is shared on X, Slack, Discord, etc. it shows no preview. Big trust killer.',
      fix:
        'Add an `og:image` meta tag + a 1200x630 image. Link it in your base layout or `<head>`.',
    });
  } else {
    passed.push('seo.ogimage');
  }

  if (titleIsDefault) {
    issues.push({
      id: 'seo.title.default',
      category: 'seo',
      severity: 'high',
      title: 'Default framework title',
      description:
        'Your page title is still the scaffold default. Nobody wants to see "Vite + React" or "Welcome to Django" in their browser tab.',
      fix: 'Set a real page title in your HTML head, layout, or base template.',
    });
  } else if (!hasTitle) {
    issues.push({
      id: 'seo.title.missing',
      category: 'seo',
      severity: 'high',
      title: 'No page title',
      description:
        'Missing `<title>` tag. Hurts SEO and looks broken in tabs/shares.',
      fix: 'Add a descriptive title in your head/layout/base template.',
    });
  } else {
    passed.push('seo.title');
  }

  if (!hasDescription) {
    issues.push({
      id: 'seo.description',
      category: 'seo',
      severity: 'medium',
      title: 'No meta description',
      description: 'Google will write its own snippet. Yours would be better.',
      fix: 'Add `<meta name="description" content="...">`. 150-160 chars.',
    });
  } else {
    passed.push('seo.description');
  }

  // ---- robots.txt ----------------------------------------------------------
  const hasRobots = ctx.files.some(
    (f) =>
      /robots\.txt$/i.test(f) ||
      /robots\.ts$/i.test(f) ||
      /robots\.py$/i.test(f)
  );
  if (!hasRobots) {
    issues.push({
      id: 'seo.robots',
      category: 'seo',
      severity: 'low',
      title: 'No robots.txt',
      description: 'Search engines guess. You should tell them.',
      fix:
        'Add `public/robots.txt` (Next.js), `static/robots.txt` (Django/Flask), or a dynamic route.',
    });
  } else {
    passed.push('seo.robots');
  }

  // ---- sitemap -------------------------------------------------------------
  const hasSitemap = ctx.files.some(
    (f) =>
      /sitemap\.xml$/i.test(f) ||
      /sitemap\.ts$/i.test(f) ||
      /sitemap\.py$/i.test(f)
  );
  if (!hasSitemap) {
    issues.push({
      id: 'seo.sitemap',
      category: 'seo',
      severity: 'low',
      title: 'No sitemap',
      description: 'Helps search engines index your pages faster.',
      fix:
        'Add a sitemap. Static: `public/sitemap.xml`. Dynamic: generate it from your routes.',
    });
  } else {
    passed.push('seo.sitemap');
  }

  return { issues, passed };
}