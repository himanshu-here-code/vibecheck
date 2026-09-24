import type { ScanResult } from './types';

const cache = new Map<string, ScanResult>();
const MAX_ENTRIES = 500;

export function cacheScan(repo: string, result: ScanResult): void {
  if (cache.size >= MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(repo, result);
}

export function getCachedScan(repo: string): ScanResult | null {
  return cache.get(repo) ?? null;
}

// =============================================================================
// URL-safe base64 — pure btoa/atob, works in every runtime
// =============================================================================

/**
 * Encode a UTF-8 string to URL-safe base64.
 *
 * Uses only btoa/atob (available in Node 16+, all browsers, and edge
 * runtimes). No Buffer, no experimental encodings. Handles UTF-8
 * correctly by converting to a binary string first.
 */
function toBase64Url(input: string): string {
  // Convert UTF-8 → binary string
  const utf8 = unescape(encodeURIComponent(input));

  // btoa on the binary string
  const b64 = btoa(utf8);

  // base64 → base64url
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a URL-safe base64 string back to UTF-8.
 */
function fromBase64Url(input: string): string {
  // base64url → base64
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // Restore padding
  while (b64.length % 4) b64 += '=';

  // atob → binary string
  const binary = atob(b64);

  // binary string → UTF-8
  return decodeURIComponent(escape(binary));
}

// =============================================================================
// Compact codes
// =============================================================================

const TYPE_CODES: Record<string, string> = {
  'web-app': 'w',
  'cli-tool': 'c',
  library: 'l',
  'mobile-app': 'm',
  'browser-extension': 'b',
  'api-service': 'a',
  docs: 'd',
};

const TYPE_FROM_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_CODES).map(([k, v]) => [v, k])
);

const PURPOSE_CODES: Record<string, string> = {
  product: 'p',
  learning: 'l',
  portfolio: 'o',
  docs: 'd',
  boilerplate: 'b',
  experiment: 'e',
};

const PURPOSE_FROM_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(PURPOSE_CODES).map(([k, v]) => [v, k])
);

const SEV_CODES: Record<string, string> = {
  critical: 'c',
  high: 'h',
  medium: 'm',
  low: 'l',
};

const SEV_FROM_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(SEV_CODES).map(([k, v]) => [v, k])
);

// =============================================================================
// Encode / decode
// =============================================================================

/**
 * Compact pipe-separated payload:
 *   repo|score|grade|issueCount|passedCount|typeCode|purposeCode|topSeverity|topTitleB64
 */
export function encodeScanForUrl(result: ScanResult): string {
  try {
    const type = (result as any).projectType?.type ?? '';
    const purpose = (result as any).projectPurpose?.purpose ?? '';
    const topIssue = result.issues?.[0];

    const typeCode = TYPE_CODES[type] ?? '';
    const purposeCode = PURPOSE_CODES[purpose] ?? '';
    const sevCode = topIssue ? SEV_CODES[topIssue.severity] ?? '' : '';
    const titleB64 = topIssue ? toBase64Url(topIssue.title) : '';

    const payload = [
      result.repo,
      String(result.score),
      result.grade,
      String(result.issues.length),
      String(result.passed.length),
      typeCode,
      purposeCode,
      sevCode,
      titleB64,
    ].join('|');

    return toBase64Url(payload);
  } catch (e) {
    console.error('[encodeScanForUrl] failed:', e);
    return '';
  }
}

export interface DecodedScan {
  repo: string;
  score: number;
  grade: string;
  issueCount: number;
  passedCount: number;
  type: string;
  purpose: string;
  topSeverity: string;
  topTitle: string;
}

export function decodeScanFromUrl(encoded: string): DecodedScan | null {
  try {
    const payload = fromBase64Url(encoded);
    const parts = payload.split('|');

    // We expect at least 8 parts (5 base fields + type + purpose + severity)
    if (parts.length < 8) {
      console.error('[decodeScanFromUrl] too few parts:', parts.length);
      return null;
    }

    const [
      repo = '',
      score = '0',
      grade = 'A',
      issueCount = '0',
      passedCount = '0',
      typeCode = '',
      purposeCode = '',
      sevCode = '',
      titleB64 = '',
    ] = parts;

    let topTitle = '';
    if (titleB64) {
      try {
        topTitle = fromBase64Url(titleB64);
      } catch {}
    }

    return {
      repo,
      score: parseInt(score, 10) || 0,
      grade,
      issueCount: parseInt(issueCount, 10) || 0,
      passedCount: parseInt(passedCount, 10) || 0,
      type: TYPE_FROM_CODE[typeCode] ?? '',
      purpose: PURPOSE_FROM_CODE[purposeCode] ?? '',
      topSeverity: SEV_FROM_CODE[sevCode] ?? '',
      topTitle,
    };
  } catch (e) {
    console.error('[decodeScanFromUrl] failed:', e);
    return null;
  }
}