import type { GitHubRepo } from '../types/github';

interface Props {
  repo: GitHubRepo;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572a5',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  PHP: '#4f5d95',
  Shell: '#89e051',
  HTML: '#e44b23',
  CSS: '#563d7c',
  Vue: '#41b883',
  Dart: '#00b4ab',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'bugün';
  if (days === 1) return 'dün';
  if (days < 30) return `${days} gün önce`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ay önce`;
  return `${Math.floor(months / 12)} yıl önce`;
}

export default function RepoCard({ repo }: Props) {
  const color = repo.language ? (LANG_COLORS[repo.language] ?? '#888') : null;
  const ago = timeAgo(repo.pushed_at);

  return (
    <div className="repo-card">
      <div className="repo-card-top">
        <a href={repo.html_url} target="_blank" rel="noreferrer" className="repo-name">
          <i className="ti ti-book" aria-hidden="true" />
          {repo.name}
        </a>
        {repo.fork && <span className="badge-fork">fork</span>}
      </div>

      {repo.description && (
        <p className="repo-desc">{repo.description}</p>
      )}

      {repo.topics.length > 0 && (
        <div className="repo-topics">
          {repo.topics.slice(0, 4).map((t) => (
            <span key={t} className="topic-tag">{t}</span>
          ))}
        </div>
      )}

      <div className="repo-meta">
        {color && (
          <span className="repo-lang">
            <span className="lang-dot" style={{ background: color }} />
            {repo.language}
          </span>
        )}
        <span className="repo-stat">
          <i className="ti ti-star" aria-hidden="true" />
          {repo.stargazers_count.toLocaleString('tr-TR')}
        </span>
        <span className="repo-stat">
          <i className="ti ti-git-fork" aria-hidden="true" />
          {repo.forks_count}
        </span>
        <span className="repo-stat repo-ago">{ago}</span>
      </div>
    </div>
  );
}