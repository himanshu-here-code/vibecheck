export type Language =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'html'
  | 'css'
  | 'vue'
  | 'svelte'
  | 'php'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'unknown';

export interface LanguageDetection {
  primary: Language;
  secondary: Language[];
  fileCount: Record<Language, number>;
  isWebProject: boolean;
}

/**
 * Count file extensions and pick the dominant language(s).
 * A repo can be multi-language — most are (JS + HTML + CSS at minimum).
 */
export function detectLanguages(files: string[]): LanguageDetection {
  const counts: Record<Language, number> = {
    typescript: 0,
    javascript: 0,
    python: 0,
    html: 0,
    css: 0,
    vue: 0,
    svelte: 0,
    php: 0,
    ruby: 0,
    go: 0,
    rust: 0,
    unknown: 0,
  };

  const ignored = /node_modules|\.next|dist\/|build\/|venv\/|__pycache__\/|\.venv\//;

  for (const f of files) {
    if (ignored.test(f)) continue;
    const ext = f.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
      case 'ts': case 'tsx': counts.typescript++; break;
      case 'js': case 'jsx': case 'mjs': case 'cjs': counts.javascript++; break;
      case 'py': counts.python++; break;
      case 'html': case 'htm': counts.html++; break;
      case 'css': case 'scss': case 'sass': case 'less': counts.css++; break;
      case 'vue': counts.vue++; break;
      case 'svelte': counts.svelte++; break;
      case 'php': counts.php++; break;
      case 'rb': counts.ruby++; break;
      case 'go': counts.go++; break;
      case 'rs': counts.rust++; break;
    }
  }

  // Primary = highest count
  const entries = Object.entries(counts) as [Language, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const primary = entries[0][1] > 0 ? entries[0][0] : 'unknown';

  // Secondary = anything else with meaningful count (>10% of primary or >3 files)
  const primaryCount = entries[0][1];
  const secondary = entries
    .slice(1)
    .filter(([, n]) => n >= 3 && n >= primaryCount * 0.1)
    .map(([lang]) => lang);

  const isWebProject =
    counts.html > 0 ||
    counts.css > 0 ||
    counts.vue > 0 ||
    counts.svelte > 0 ||
    ['typescript', 'javascript'].includes(primary);

  return { primary, secondary, fileCount: counts, isWebProject };
}