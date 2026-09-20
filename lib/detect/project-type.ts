// =============================================================================
// Project type detection
// =============================================================================
//
// Classifies a GitHub repo into one of eight categories. Uses a tiered
// hierarchy of signals, from most to least reliable:
//
//   1. Hardcoded catalog — famous repos are matched by name. 100% accurate.
//   2. Self-package — repo name matches the package it publishes.
//   3. Structural — package.json fields, file tree patterns.
//   4. Language + ecosystem — Python, Ruby, Go, Rust idioms.
//   5. Framework + dependencies — React/Next/Vue detection.
//   6. README prose — fallback only, weakest signal.
//
// Structural signals always beat prose. A repo is a library if its
// package.json says so, regardless of what the README claims.
// =============================================================================

export type ProjectType =
  | 'web-app'
  | 'cli-tool'
  | 'library'
  | 'mobile-app'
  | 'browser-extension'
  | 'api-service'
  | 'docs'
  | 'unknown';

export interface ProjectTypeResult {
  type: ProjectType;
  confidence: number;
  signals: string[];
}

// =============================================================================
// Catalog of famous repos — instant classification, no heuristics
// =============================================================================

/**
 * Famous framework and library repos. If a repo matches, it's a library.
 * Never needs heuristic verification — these are the canonical sources
 * for their respective packages.
 */
const KNOWN_LIBRARIES = new Set([
  // Frontend frameworks
  'react', 'react-dom', 'vue', 'vuejs', 'angular', 'angularjs', 'svelte',
  'sveltejs', 'solid', 'solidjs', 'preact', 'lit', 'alpinejs', 'htmx',
  // Meta-frameworks
  'next', 'next.js', 'nextjs', 'nuxt', 'nuxtjs', 'gatsby', 'remix',
  'astro', 'astrojs', 'eleventy', '11ty', 'docusaurus', 'vitepress',
  'fresh', 'deno-fresh',
  // Backend frameworks
  'express', 'expressjs', 'koa', 'koajs', 'fastify', 'hapi', 'nest',
  'nestjs', 'adonis', 'adonisjs', 'sails',
  // Python frameworks
  'django', 'flask', 'fastapi', 'starlette', 'aiohttp', 'sanic',
  'tornado', 'bottle', 'falcon', 'pyramid',
  // Ruby frameworks
  'rails', 'rubyonrails', 'sinatra', 'hanami', 'roda',
  // PHP frameworks
  'laravel', 'symfony', 'codeigniter', 'cakephp', 'yii',
  // Build tools and bundlers
  'webpack', 'rollup', 'vite', 'esbuild', 'parcel', 'turbopack', 'swc',
  'rspack', 'bun', 'deno',
  // CSS frameworks
  'tailwindcss', 'tailwind', 'bootstrap', 'bulma', 'foundation',
  'material-ui', 'mui', 'chakra-ui', 'ant-design', 'antd',
  // JavaScript libraries
  'lodash', 'underscore', 'jquery', 'axios', 'got', 'node-fetch',
  'moment', 'dayjs', 'date-fns', 'ramda', 'immutable',
  // Testing
  'jest', 'vitest', 'mocha', 'jasmine', 'cypress', 'playwright',
  'puppeteer', 'karma', 'chai', 'sinon', 'testing-library',
  // Languages and tooling
  'typescript', 'eslint', 'prettier', 'babel', 'babeljs', 'biome',
  // State management
  'redux', 'mobx', 'recoil', 'zustand', 'jotai', 'pinia', 'vuex',
  // Data layer
  'prisma', 'drizzle', 'typeorm', 'sequelize', 'mongoose', 'knex',
  'supabase', 'firebase',
  // Networking / HTTP
  'graphql', 'apollo-server', 'apollo-client', 'trpc',
  // UI / component libraries
  'storybook', 'shadcn', 'shadcn-ui', 'radix-ui', 'headlessui',
  'material-design', 'ant-design-icons',
  // Auth
  'next-auth', 'authjs', 'passport', 'passportjs', 'clerk',
  // Documentation frameworks
  'docsify', 'mkdocs', 'sphinx', 'gitbook', 'readthedocs',
]);

/**
 * Famous docs-only repos. Curated lists, roadmaps, learn-to-code guides.
 * These have no code and shouldn't be judged like apps.
 */
const KNOWN_DOCS = new Set([
  'awesome', 'awesome-lists', 'awesome-readme',
  'awesome-nodejs', 'awesome-python', 'awesome-react', 'awesome-vue',
  'awesome-javascript', 'awesome-typescript', 'awesome-go',
  'awesome-rust', 'awesome-swift', 'awesome-kotlin', 'awesome-flutter',
  'awesome-django', 'awesome-flask', 'awesome-fastapi',
  'awesome-nextjs', 'awesome-nestjs', 'awesome-angular', 'awesome-svelte',
  'awesome-vite', 'awesome-webpack', 'awesome-rollup',
  'awesome-tailwindcss', 'awesome-bootstrap', 'awesome-css',
  'awesome-html5', 'awesome-svg', 'awesome-icons',
  'awesome-selfhosted', 'awesome-sysadmin', 'awesome-linux',
  'awesome-shell', 'awesome-cli-apps', 'awesome-zsh-plugins',
  'awesome-devops', 'awesome-kubernetes', 'awesome-docker',
  'awesome-postgres', 'awesome-mysql', 'awesome-redis',
  'awesome-machine-learning', 'awesome-deep-learning',
  'awesome-data-science', 'awesome-datascience', 'awesome-ai',
  'awesome-ios', 'awesome-android', 'awesome-react-native',
  'awesome-electron', 'awesome-tauri', 'awesome-wasm',
  'free-programming-books', 'free-programming-books-zh_cn',
  'public-apis', 'public-api-lists',
  'the-book-of-secret-knowledge',
  'coding-interview-university',
  'developer-roadmap', 'roadmap',
  'system-design-primer',
  'build-your-own-x', 'project-based-learning',
  'javascript-questions', 'python-questions',
  '30-seconds-of-code', '30-seconds-of-css', '30-seconds-of-python',
  'every-programmer-should-know',
  'papers-we-love', 'awesome-courses',
  'best-websites-a-programmer-should-visit',
  'the-art-of-command-line',
  'what-happens-when',
  'computer-science', 'cs-video-courses',
  'design-resources-for-developers',
  'You-Dont-Know-JS', 'clean-code-javascript',
  'nodebestpractices', 'typescript-cheatsheets',
]);

/**
 * Well-known framework monorepos. Often have `workspaces` in root
 * package.json which the self-package check can't resolve.
 */
const KNOWN_FRAMEWORK_MONOREPOS = new Set([
  'next.js', 'nuxt', 'remix', 'astro', 'svelte', 'vue',
  'angular', 'material-ui', 'storybook', 'turborepo', 'nx',
  'pnpm', 'yarn', 'bun', 'deno', 'vite', 'vitest', 'jest',
  'react-native', 'expo', 'tauri', 'electron',
]);

// =============================================================================
// Detection
// =============================================================================

export function detectProjectType(
  readme: string,
  pkgJson: string | null,
  files: string[] = [],
  primaryLanguage: string = 'unknown',
  repoName: string = '',
  owner: string = ''
): ProjectTypeResult {
  const text = (readme ?? '').toLowerCase();
  const pkg = pkgJson ? safeParse(pkgJson) : null;
  const signals: string[] = [];
  const repoNorm = normalize(repoName);

  // ===========================================================================
  // TIER 1 — Hardcoded catalog (fastest, most accurate)
  // ===========================================================================

  // 1a. Known docs repos
  for (const docs of KNOWN_DOCS) {
    if (repoNorm === normalize(docs)) {
      signals.push(`known docs repo: ${docs}`);
      return { type: 'docs', confidence: 0.98, signals };
    }
  }

  // 1b. Known framework monorepos
  for (const fw of KNOWN_FRAMEWORK_MONOREPOS) {
    if (repoNorm === normalize(fw)) {
      signals.push(`known framework monorepo: ${fw}`);
      return { type: 'library', confidence: 0.98, signals };
    }
  }

  // 1c. Known libraries
  for (const lib of KNOWN_LIBRARIES) {
    if (repoNorm === normalize(lib)) {
      signals.push(`known library: ${lib}`);
      return { type: 'library', confidence: 0.98, signals };
    }
  }

  // ===========================================================================
  // TIER 2 — Self-package detection (structural, reliable)
  // ===========================================================================
  if (pkg && repoName && pkg.name) {
    const pkgNorm = normalize(stripScope(pkg.name));
    const namesMatch =
      repoNorm === pkgNorm ||
      repoNorm.includes(pkgNorm) ||
      pkgNorm.includes(repoNorm);

    const isPublishable =
      pkg.main !== undefined ||
      pkg.module !== undefined ||
      pkg.exports !== undefined ||
      pkg.types !== undefined ||
      pkg.typings !== undefined ||
      pkg.publishConfig !== undefined ||
      (pkg.private === false && !pkg.scripts?.dev);

    if (namesMatch && isPublishable) {
      signals.push('repo name matches published package name');
      return { type: 'library', confidence: 0.95, signals };
    }
  }

  // ===========================================================================
  // TIER 3 — Docs-only heuristic (file tree structure)
  // ===========================================================================
  if (files.length > 0) {
    const mdFiles = files.filter((f) => /\.(md|mdx|rst|txt)$/i.test(f));
    const codeFiles = files.filter((f) =>
      /\.(tsx?|jsx?|py|rb|go|rs|php|java|kt|swift|c|cpp|cs|sh)$/i.test(f)
    );
    const mdRatio = mdFiles.length / files.length;

    // Any of these indicates a docs-heavy repo
    const isDocsOnly =
      mdRatio > 0.6 ||
      (mdRatio > 0.4 && codeFiles.length < 2) ||
      (mdFiles.length > 10 && codeFiles.length < 2) ||
      // README + CHANGELOG + CONTRIBUTING + LICENSE + no real code
      (files.length < 20 && codeFiles.length === 0);

    if (isDocsOnly) {
      signals.push(
        `docs-only: ${mdRatio.toFixed(2)} md ratio, ${codeFiles.length} code files`
      );
      return { type: 'docs', confidence: 0.9, signals };
    }
  }

  // ===========================================================================
  // TIER 4 — Structural file patterns (very reliable)
  // ===========================================================================

  // 4a. Browser extension
  const hasManifestJson = files.some((f) => /(^|\/)manifest\.json$/i.test(f));
  if (
    (hasManifestJson &&
      /\b(browser extension|chrome extension|firefox addon|webextension)\b/i.test(text)) ||
    (pkg &&
      (pkg.devDependencies?.['@types/chrome'] ||
        pkg.dependencies?.['webextension-polyfill']))
  ) {
    signals.push('browser extension manifest present');
    return { type: 'browser-extension', confidence: 0.95, signals };
  }

  // 4b. Mobile app — requires explicit dependency, not prose
  if (
    pkg &&
    (pkg.dependencies?.['react-native'] ||
      pkg.dependencies?.['expo'] ||
      pkg.dependencies?.['@react-native/core'] ||
      pkg.devDependencies?.['react-native'])
  ) {
    signals.push('react-native or expo in dependencies');
    return { type: 'mobile-app', confidence: 0.95, signals };
  }

  // 4c. Monorepo root — treat as library
  if (pkg?.workspaces) {
    signals.push('monorepo root (workspaces field)');
    return { type: 'library', confidence: 0.9, signals };
  }

  // ===========================================================================
  // TIER 5 — Language ecosystems
  // ===========================================================================

  // 5a. Python
  if (primaryLanguage === 'python') {
    const hasTests = files.some((f) => /(^|\/)(tests?|test_)/i.test(f));
    const hasSetup = files.some((f) =>
      /(setup\.py|setup\.cfg|pyproject\.toml)$/i.test(f)
    );
    const hasDockerfile = files.some((f) => /Dockerfile$/i.test(f));
    const hasProcfile = files.some((f) => /Procfile$/i.test(f));
    const hasDeployConfig = files.some((f) =>
      /(fly\.toml|railway\.json|render\.yaml|heroku\.yml|vercel\.json)$/i.test(f)
    );

    const isService =
      (hasDockerfile || hasProcfile || hasDeployConfig) &&
      /\b(server|deploy|production|api)\b/i.test(text);

    if (isService) {
      signals.push('python with deploy config');
      return { type: 'api-service', confidence: 0.85, signals };
    }

    if (hasTests || hasSetup) {
      signals.push('python library (setup + tests)');
      return { type: 'library', confidence: 0.9, signals };
    }

    signals.push('python project');
    return { type: 'library', confidence: 0.8, signals };
  }

  // 5b. Ruby
  if (primaryLanguage === 'ruby') {
    const hasDockerfile = files.some((f) => /Dockerfile$/i.test(f));
    const hasGemfile = files.some((f) => /Gemfile$/i.test(f));
    const isRails = /\brails\b/i.test(text) || hasGemfile;

    if (isRails && hasDockerfile && /\b(deploy|production)\b/i.test(text)) {
      signals.push('rails with deploy config');
      return { type: 'api-service', confidence: 0.85, signals };
    }

    signals.push('ruby project');
    return { type: 'library', confidence: 0.85, signals };
  }

  // 5c. Go
  if (primaryLanguage === 'go') {
    const hasMain = files.some((f) => /(^|\/)main\.go$/i.test(f));
    const hasGoMod = files.some((f) => /go\.mod$/i.test(f));
    const hasCmd = files.some((f) => /(^|\/)cmd\//i.test(f));

    if (hasMain && hasCmd && !hasGoMod) {
      signals.push('go binary project');
      return { type: 'cli-tool', confidence: 0.85, signals };
    }

    signals.push('go library');
    return { type: 'library', confidence: 0.85, signals };
  }

  // 5d. Rust
  if (primaryLanguage === 'rust') {
    const hasMain = files.some((f) => /(^|\/)main\.rs$/i.test(f));
    const hasLib = files.some((f) => /(^|\/)lib\.rs$/i.test(f));

    if (hasMain && !hasLib) {
      signals.push('rust binary');
      return { type: 'cli-tool', confidence: 0.85, signals };
    }

    signals.push('rust library');
    return { type: 'library', confidence: 0.85, signals };
  }

  // ===========================================================================
  // TIER 6 — Framework + dependencies (JS/TS ecosystem)
  // ===========================================================================
  if (pkg && (primaryLanguage === 'typescript' || primaryLanguage === 'javascript')) {
    const deps: Record<string, unknown> = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };

    // Self-package guard: if pkg.name is in deps, it's a library
    if (pkg.name && deps[pkg.name]) {
      signals.push('package depends on itself — library');
      return { type: 'library', confidence: 0.9, signals };
    }

    const hasWebFramework =
      deps['next'] ||
      deps['nuxt'] ||
      deps['astro'] ||
      deps['@angular/core'] ||
      deps['@sveltejs/kit'] ||
      deps['gatsby'] ||
      deps['@remix-run/react'] ||
      deps['remix'];

    const hasDevScript =
      pkg.scripts?.dev || pkg.scripts?.start || pkg.scripts?.build;

    const hasBin = pkg.bin !== undefined;

    // Web app: framework + dev script + NOT a CLI
    if (hasWebFramework && hasDevScript && !hasBin) {
      signals.push('web framework + build script');
      return { type: 'web-app', confidence: 0.9, signals };
    }

    // Library: has main/module/exports and no dev script
    if ((pkg.main || pkg.module || pkg.exports) && !hasDevScript) {
      signals.push('npm library with exports');
      return { type: 'library', confidence: 0.85, signals };
    }
  }

  // ===========================================================================
  // TIER 7 — CLI tool (bin field is definitive)
  // ===========================================================================
  if (pkg?.bin) {
    signals.push('package has bin field');
    return { type: 'cli-tool', confidence: 0.9, signals };
  }

  const cliSignals = [
    /\b(npm (i|install) -g|yarn global|pnpm add -g|brew install|cargo install|pipx install)\b/.test(text),
    /^\s*\$\s+\w+\s+/m.test(text),
  ];
  if (cliSignals.filter(Boolean).length >= 2) {
    signals.push('CLI install/usage patterns in README');
    return { type: 'cli-tool', confidence: 0.8, signals };
  }

  // ===========================================================================
  // TIER 8 — README prose (weakest signal, last resort)
  // ===========================================================================
  if (
    (primaryLanguage === 'typescript' || primaryLanguage === 'javascript') &&
    /\b(web app|dashboard|saas|landing page)\b/.test(text)
  ) {
    signals.push('web app keywords + JS/TS');
    return { type: 'web-app', confidence: 0.7, signals };
  }

  signals.push('no strong signals');
  return { type: 'unknown', confidence: 0.5, signals };
}

// =============================================================================
// Helpers
// =============================================================================

function normalize(s: string): string {
  return s.toLowerCase().replace(/[._\-/\s]/g, '');
}

function stripScope(name: string): string {
  return name.replace(/^@[^/]+\//, '');
}

function safeParse(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}