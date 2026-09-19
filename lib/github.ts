import { RepoContext } from './types';

const GH = 'https://api.github.com';

function headers() {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vibecheck',
  };
  // Optional: set GITHUB_TOKEN env var for 5000 req/hr instead of 60
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  const cleaned = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
  // Accept: owner/repo, github.com/owner/repo, https://github.com/owner/repo
  const patterns = [
    /^([\w.-]+)\/([\w.-]+)$/,
    /github\.com\/([\w.-]+)\/([\w.-]+)/,
  ];
  for (const re of patterns) {
    const m = cleaned.match(re);
    if (m) return { owner: m[1], repo: m[2] };
  }
  return null;
}

export async function buildRepoContext(
  owner: string,
  repo: string
): Promise<RepoContext> {
  // 1. Get repo metadata
  const repoRes = await fetch(`${GH}/repos/${owner}/${repo}`, { headers: headers() });
  if (!repoRes.ok) {
    throw new Error(
      repoRes.status === 404
        ? 'Repo not found (is it public?)'
        : `GitHub error: ${repoRes.status}`
    );
  }
  const repoData = await repoRes.json();
  const branch = repoData.default_branch;

  // 2. Get full file tree
  const treeRes = await fetch(
    `${GH}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: headers() }
  );
  if (!treeRes.ok) throw new Error(`Tree fetch failed: ${treeRes.status}`);
  const treeData = await treeRes.json();

  const files: string[] = (treeData.tree || [])
    .filter((n: any) => n.type === 'blob')
    .map((n: any) => n.path);

  const fileSet = new Set(files);

  // 3. File content getter (raw.githubusercontent is free & no rate limit issues)
  const cache = new Map<string, string | null>();
  const getFile = async (path: string): Promise<string | null> => {
    if (cache.has(path)) return cache.get(path)!;
    if (!fileSet.has(path)) {
      cache.set(path, null);
      return null;
    }
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
      );
      if (!res.ok) {
        cache.set(path, null);
        return null;
      }
      const text = await res.text();
      // Skip huge files
      const val = text.length > 500_000 ? text.slice(0, 500_000) : text;
      cache.set(path, val);
      return val;
    } catch {
      cache.set(path, null);
      return null;
    }
  };

  const getFileByPattern = (re: RegExp): string | null => {
    return files.find((f) => re.test(f)) ?? null;
  };

  return { owner, repo, branch, files, fileSet, getFile, getFileByPattern };
}