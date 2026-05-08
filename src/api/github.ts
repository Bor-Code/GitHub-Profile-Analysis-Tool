import type { GitHubUser, GitHubRepo, ContributionWeek } from '../types/github';

const BASE = 'https://api.github.com';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchUser(username: string): Promise<GitHubUser> {
  return apiFetch<GitHubUser>(`/users/${encodeURIComponent(username)}`);
}

export async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  return apiFetch<GitHubRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`
  );
}

export async function fetchContributions(username: string): Promise<ContributionWeek[]> {
  try {
    const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rects = Array.from(doc.querySelectorAll('rect[data-date]'));
    const byWeek: Map<number, ContributionWeek> = new Map();

    rects.forEach((rect) => {
      const date = rect.getAttribute('data-date') ?? '';
      const count = parseInt(rect.getAttribute('data-count') ?? '0', 10);
      const level = parseInt(rect.getAttribute('data-level') ?? '0', 10) as 0 | 1 | 2 | 3 | 4;
      const d = new Date(date);
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((day + 6) % 7));
      const key = monday.getTime();
      if (!byWeek.has(key)) byWeek.set(key, { days: [] });
      byWeek.get(key)!.days.push({ date, count, level });
    });

    return Array.from(byWeek.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, week]) => week);
  } catch {
    return [];
  }
}

export function computeLanguageStats(repos: GitHubRepo[]): Record<string, number> {
  const map: Record<string, number> = {};
  repos
    .filter((r) => !r.fork && r.language)
    .forEach((r) => {
      map[r.language!] = (map[r.language!] ?? 0) + 1;
    });
  return map;
}