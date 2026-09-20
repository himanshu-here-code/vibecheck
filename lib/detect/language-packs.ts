import { Language } from './language';

/**
 * Each language declares its own conventions for the concepts we check.
 * Checks ask "what files would hold X in this language?" and the pack answers.
 */
export interface LanguagePack {
  /** Files that likely hold the privacy policy */
  privacyCandidates: RegExp[];
  /** Files that likely hold the terms of service */
  termsCandidates: RegExp[];
  /** Files that likely hold a contact page */
  contactCandidates: RegExp[];
  /** Files that hold the main page/template */
  mainPageCandidates: RegExp[];
  /** Files where we look for meta tags */
  metaCandidates: RegExp[];
  /** Files that hold routing / views */
  routesCandidates: RegExp[];
  /** Files that hold styling */
  stylesCandidates: RegExp[];
  /** Files that hold the entry point / main function */
  entryPointCandidates: RegExp[];
  /** Extensions we scan for signatures */
  sourceExtensions: RegExp;
}

export const LANGUAGE_PACKS: Record<Language, LanguagePack> = {
  // ---------------------------------------------------------------------------
  typescript: {
    privacyCandidates: [/privacy/i, /(^|\/)pp\./i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)page\.(tsx?|jsx?)$/i, /(^|\/)index\.(tsx?|jsx?)$/i, /layout\.(tsx?|jsx?)$/i],
    metaCandidates: [/(^|\/)layout\.(tsx?|jsx?)$/i, /(^|\/)head\.(tsx?|jsx?)$/i, /(^|\/)index\.html$/i],
    routesCandidates: [/(^|\/)app\//, /(^|\/)pages\//, /(^|\/)routes\//],
    stylesCandidates: [/\.css$/, /\.scss$/, /tailwind\.config\./],
    entryPointCandidates: [/(^|\/)index\.(tsx?|jsx?)$/i, /(^|\/)main\.(tsx?|jsx?)$/i, /(^|\/)app\.(tsx?|jsx?)$/i],
    sourceExtensions: /\.(tsx?|jsx?)$/,
  },

  // ---------------------------------------------------------------------------
  javascript: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)index\.html?$/i, /(^|\/)main\.jsx?$/i, /(^|\/)app\.jsx?$/i],
    metaCandidates: [/(^|\/)index\.html?$/i, /(^|\/)head\.(jsx?|html)$/i],
    routesCandidates: [/(^|\/)routes\//, /(^|\/)pages\//, /(^|\/)controllers\//],
    stylesCandidates: [/\.css$/, /\.scss$/],
    entryPointCandidates: [/(^|\/)index\.jsx?$/i, /(^|\/)main\.jsx?$/i, /(^|\/)app\.jsx?$/i, /(^|\/)server\.jsx?$/i],
    sourceExtensions: /\.(jsx?|mjs|cjs)$/,
  },

  // ---------------------------------------------------------------------------
  python: {
    privacyCandidates: [/privacy/i, /privacy_policy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [
      /(^|\/)app\.py$/i,
      /(^|\/)main\.py$/i,
      /(^|\/)wsgi\.py$/i,
      /(^|\/)manage\.py$/i,
      /templates\/(index|home)\.html?$/i,
    ],
    metaCandidates: [/templates\/.*\.html?$/i, /(^|\/)base\.html?$/i],
    routesCandidates: [/(^|\/)urls\.py$/i, /(^|\/)routes\.py$/i, /(^|\/)views\.py$/i, /(^|\/)views\//i],
    stylesCandidates: [/\.css$/i, /static\//i, /templates\/.*\.html?$/i],
    entryPointCandidates: [/(^|\/)app\.py$/i, /(^|\/)main\.py$/i, /(^|\/)manage\.py$/i, /(^|\/)__main__\.py$/i],
    sourceExtensions: /\.py$/,
  },

  // ---------------------------------------------------------------------------
  html: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)index\.html?$/i, /(^|\/)home\.html?$/i],
    metaCandidates: [/\.html?$/i],
    routesCandidates: [/\.html?$/i],
    stylesCandidates: [/\.css$/i, /\.scss$/i],
    entryPointCandidates: [/(^|\/)index\.html?$/i],
    sourceExtensions: /\.(html?|css|scss|js)$/,
  },

  // ---------------------------------------------------------------------------
  css: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)index\.html?$/i],
    metaCandidates: [/\.html?$/i],
    routesCandidates: [/\.html?$/i],
    stylesCandidates: [/\.css$/i, /\.scss$/i],
    entryPointCandidates: [/(^|\/)index\.html?$/i],
    sourceExtensions: /\.(css|scss|sass|less|html?)$/,
  },

  // ---------------------------------------------------------------------------
  vue: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)App\.vue$/i, /(^|\/)Index\.vue$/i],
    metaCandidates: [/(^|\/)index\.html?$/i],
    routesCandidates: [/(^|\/)router\//i, /(^|\/)views\//i, /(^|\/)pages\//i],
    stylesCandidates: [/\.css$/i, /\.scss$/i, /\.vue$/i],
    entryPointCandidates: [/(^|\/)main\.(ts|js)$/i, /(^|\/)App\.vue$/i],
    sourceExtensions: /\.(vue|tsx?|jsx?)$/,
  },

  // ---------------------------------------------------------------------------
  svelte: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)\+page\.svelte$/i],
    metaCandidates: [/(^|\/)app\.html$/i],
    routesCandidates: [/(^|\/)routes\//i],
    stylesCandidates: [/\.css$/i, /\.svelte$/i],
    entryPointCandidates: [/(^|\/)main\.(ts|js)$/i],
    sourceExtensions: /\.(svelte|tsx?|jsx?)$/,
  },

  // ---------------------------------------------------------------------------
  php: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)index\.php$/i, /(^|\/)home\.php$/i],
    metaCandidates: [/(^|\/)header\.php$/i, /\.html?$/i],
    routesCandidates: [/(^|\/)routes\//i, /(^|\/)controllers\//i],
    stylesCandidates: [/\.css$/i],
    entryPointCandidates: [/(^|\/)index\.php$/i],
    sourceExtensions: /\.(php|html?|css|js)$/,
  },

  // ---------------------------------------------------------------------------
  ruby: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)config\.ru$/i, /(^|\/)application\.rb$/i],
    metaCandidates: [/(^|\/)application\.html\.erb$/i, /layouts\//i],
    routesCandidates: [/(^|\/)routes\.rb$/i, /controllers\//i],
    stylesCandidates: [/\.css$/i, /\.scss$/i, /assets\//i],
    entryPointCandidates: [/(^|\/)config\.ru$/i, /(^|\/)main\.rb$/i],
    sourceExtensions: /\.(rb|erb|html?|css|js)$/,
  },

  // ---------------------------------------------------------------------------
  go: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)main\.go$/i, /templates\//i],
    metaCandidates: [/templates\/.*\.html?$/i],
    routesCandidates: [/(^|\/)routes?\//i, /handlers\//i],
    stylesCandidates: [/\.css$/i, /static\//i],
    entryPointCandidates: [/(^|\/)main\.go$/i],
    sourceExtensions: /\.(go|html?|css|js)$/,
  },

  // ---------------------------------------------------------------------------
  rust: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)main\.rs$/i, /(^|\/)lib\.rs$/i],
    metaCandidates: [/(^|\/)index\.html?$/i],
    routesCandidates: [/(^|\/)routes?\//i],
    stylesCandidates: [/\.css$/i],
    entryPointCandidates: [/(^|\/)main\.rs$/i, /(^|\/)lib\.rs$/i],
    sourceExtensions: /\.(rs|html?|css|js)$/,
  },

  // ---------------------------------------------------------------------------
  unknown: {
    privacyCandidates: [/privacy/i],
    termsCandidates: [/terms/i, /tos/i],
    contactCandidates: [/contact/i],
    mainPageCandidates: [/(^|\/)index\./i, /(^|\/)main\./i],
    metaCandidates: [/\.html?$/i],
    routesCandidates: [/(^|\/)routes?\//i],
    stylesCandidates: [/\.css$/i],
    entryPointCandidates: [/(^|\/)main\./i, /(^|\/)index\./i],
    sourceExtensions: /\.(tsx?|jsx?|py|html?|css|vue|svelte|php|rb|go|rs)$/,
  },
};

/**
 * Given a list of files and a set of candidate patterns, find the first match.
 */
export function findCandidate(
  files: string[],
  patterns: RegExp[],
  excludePatterns: RegExp[] = [/node_modules/, /\.next/, /dist\/|build\//, /venv\/|__pycache__\//]
): string | null {
  for (const f of files) {
    if (excludePatterns.some((rx) => rx.test(f))) continue;
    if (patterns.some((rx) => rx.test(f))) return f;
  }
  return null;
}