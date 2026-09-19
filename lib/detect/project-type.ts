export type ProjectType =
  | 'web-app'
  | 'cli-tool'
  | 'library'
  | 'mobile-app'
  | 'browser-extension'
  | 'api-service'
  | 'unknown';

export interface ProjectTypeResult {
  type: ProjectType;
  confidence: number; // 0-1
  signals: string[];   // what matched, for debugging
}

/**
 * Determine what kind of project this repo is by reading its README and
 * package.json. We're not trying to be perfect — just good enough to skip
 * checks that clearly don't apply.
 *
 * Order matters: we check most-specific patterns first.
 */
export function detectProjectType(
  readme: string,
  pkgJson: string | null
): ProjectTypeResult {
  const text = readme.toLowerCase();
  const pkg = pkgJson ? safeParse(pkgJson) : null;
  const pkgText = pkgJson ? pkgJson.toLowerCase() : '';
  const signals: string[] = [];

  // ---- Browser extension --------------------------------------------------
  if (
    /\b(chrome|firefox|edge|safari) extension\b/.test(text) ||
    /\b(browser extension|webextension|manifest v3)\b/.test(text) ||
    (pkg && (pkg.devDependencies?.['@types/chrome'] || pkg.dependencies?.['webextension-polyfill']))
  ) {
    signals.push('browser extension keywords');
    return { type: 'browser-extension', confidence: 0.95, signals };
  }

  // ---- Mobile app ---------------------------------------------------------
  if (
    /\b(react native|expo|flutter|ios app|android app)\b/.test(text) ||
    /\b(\.ipa|\.apk|app store|play store)\b/.test(text) ||
    (pkg && (pkg.dependencies?.['react-native'] || pkg.dependencies?.['expo']))
  ) {
    signals.push('mobile framework detected');
    return { type: 'mobile-app', confidence: 0.95, signals };
  }

  // ---- CLI tool -----------------------------------------------------------
  // Signals: installation is global, usage is a command, README shows shell $ prompts
  const cliSignals = [
    /\b(npm (i|install) -g|yarn global|pnpm add -g|pip install|brew install|cargo install)\b/.test(text),
    /\bnpx\s+[a-z]/.test(text),
    /^##\s+usage\b/m.test(text) && /^\s*\$\s+\w+/m.test(text),
    /^\s*\w+\s+--help\b/m.test(text),
    /^\s*\w+\s+<[a-z]+>/m.test(text),
  ];
  if (cliSignals.filter(Boolean).length >= 2 || pkg?.bin) {
    signals.push(`${cliSignals.filter(Boolean).length} CLI signals`);
    return { type: 'cli-tool', confidence: 0.9, signals };
  }

  // ---- Library / SDK ------------------------------------------------------
  // Signals: "install" + "import", README shows API usage, package name has no app words
  const libSignals = [
    /\b(npm i|yarn add|pnpm add|pip install|go get|cargo add)\b/.test(text) &&
      !/\b(-g|--global)\b/.test(text),
    /\b(import\s+.*\s+from|require\()/.test(text),
    /\b(api reference|api docs|exports|module|package)\b/.test(text),
    pkg?.main !== undefined && !pkg?.scripts?.dev,
  ];
  if (libSignals.filter(Boolean).length >= 3) {
    signals.push(`${libSignals.filter(Boolean).length} library signals`);
    return { type: 'library', confidence: 0.85, signals };
  }

  // ---- API service --------------------------------------------------------
  if (
    /\b(rest api|graphql (api|server)|api server|backend service|microservice)\b/.test(text) ||
    (pkg && (pkg.dependencies?.express || pkg.dependencies?.fastify || pkg.dependencies?.koa))
  ) {
    // Distinguish from web-app: is there a UI?
    const hasUI = /\b(react|vue|svelte|next|nuxt|remix)\b/.test(pkgText);
    if (!hasUI) {
      signals.push('backend framework, no UI framework');
      return { type: 'api-service', confidence: 0.85, signals };
    }
  }

  // ---- Web app ------------------------------------------------------------
  const webSignals = [
    /\b(web app|webapp|dashboard|saas|landing page|website|web application)\b/.test(text),
    /\b(deploy to vercel|deployed on netlify)\b/.test(text),
    pkg?.dependencies?.next !== undefined,
    pkg?.dependencies?.['react-dom'] !== undefined,
    pkg?.scripts?.dev !== undefined && pkg?.scripts?.build !== undefined,
  ];
  if (webSignals.filter(Boolean).length >= 2) {
    signals.push(`${webSignals.filter(Boolean).length} web signals`);
    return { type: 'web-app', confidence: 0.9, signals };
  }

  // ---- Fallback -----------------------------------------------------------
  signals.push('no strong signals');
  return { type: 'unknown', confidence: 0.5, signals };
}

function safeParse(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}