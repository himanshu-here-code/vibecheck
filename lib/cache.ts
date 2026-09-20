import type { ScanResult } from './types';

/**
 * In-memory scan cache. Lives on the server process.
 * Cleared on restart or redeploy — good enough for sharing.
 *
 * Key format: "owner/repo"
 * Value: ScanResult
 */
const cache = new Map<string, ScanResult>();

// Keep the cache bounded so it doesn't grow forever
const MAX_ENTRIES = 500;

export function cacheScan(repo: string, result: ScanResult): void {
  if (cache.size >= MAX_ENTRIES) {
    // Evict oldest entry
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(repo, result);
}

export function getCachedScan(repo: string): ScanResult | null {
  return cache.get(repo) ?? null;
}