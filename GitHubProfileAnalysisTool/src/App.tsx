import { useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import type { GitHubUser, GitHubRepo, ContributionWeek } from './types/github';
import { fetchUser, fetchRepos, fetchContributions, computeLanguageStats } from './api/github';
import MetricCard from './components/MetricCard';
import ContributionHeatmap from './components/ContributionHeatmap';
import RepoCard from './components/RepoCard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const LANG_PALETTE = ['#3266ad','#1d9e75','#d85a30','#7f77dd','#ba7517','#0f6e56','#993c1d','#534ab7'];

type Tab = 'repos' | 'stars' | 'forks';

export default function App() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [contributions, setContributions] = useState<ContributionWeek[]>([]);
  const [tab, setTab] = useState<Tab>('stars');

  const analyze = useCallback(async (u = username) => {
    if (!u.trim()) return;
    setLoading(true);
    setError('');
    setUser(null);
    setRepos([]);
    setContributions([]);
    try {
      const [userData, repoData, contribData] = await Promise.all([
        fetchUser(u),
        fetchRepos(u),
        fetchContributions(u),
      ]);
      setUser(userData);
      setRepos(repoData);
      setContributions(contribData);
    } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [username]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') analyze();
  };

  const joined = user
    ? new Date(user.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
    : '';

  const langStats = computeLanguageStats(repos);
  const sortedLangs = Object.entries(langStats).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const ownRepos = repos.filter(r => !r.fork);
  const topStars = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 8);
  const topForks = [...repos].sort((a, b) => b.forks_count - a.forks_count).slice(0, 8);
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  const totalContributions = contributions.reduce(
    (s, w) => s + w.days.reduce((ds, d) => ds + d.count, 0), 0
  );

  const displayedRepos: GitHubRepo[] =
    tab === 'repos'
      ? [...ownRepos].sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()).slice(0, 12)
      : tab === 'stars' ? topStars : topForks;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <i className="ti ti-brand-github" aria-hidden="true" />
            <span>GitHub Analyzer</span>
          </div>
          <div className="search-bar">
            <i className="ti ti-search search-icon" aria-hidden="true" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Kullanıcı adı ara..."
              aria-label="GitHub kullanıcı adı"
            />
            <button onClick={() => analyze()} disabled={loading} className="search-btn">
              {loading
                ? <i className="ti ti-loader-2 spin" aria-hidden="true" />
                : 'Analiz Et'}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="error-box" role="alert">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            {error}
          </div>
        )}

        {!user && !loading && !error && (
          <div className="empty-state">
            <i className="ti ti-brand-github empty-icon" aria-hidden="true" />
            <p>Bir kullanıcı adı gir ve <strong>Analiz Et</strong>&apos;e bas</p>
            <div className="quick-examples">
              {['torvalds', 'gaearon', 'yyx990803', 'sindresorhus'].map(u => (
                <button key={u} className="example-btn" onClick={() => { setUsername(u); analyze(u); }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <i className="ti ti-loader-2 spin loading-icon" aria-hidden="true" />
            <p>Veriler yükleniyor...</p>
          </div>
        )}

        {user && (
          <>
            <section className="profile-section">
              <img src={user.avatar_url} alt={`${user.login} avatar`} className="avatar" />
              <div className="profile-info">
                <h1 className="profile-name">{user.name || user.login}</h1>
                <p className="profile-login">@{user.login}</p>
                {user.bio && <p className="profile-bio">{user.bio}</p>}
                <div className="profile-meta">
                  {user.location && <span><i className="ti ti-map-pin" />{user.location}</span>}
                  {user.company && <span><i className="ti ti-building" />{user.company}</span>}
                  {user.blog && (
                    <span>
                      <i className="ti ti-link" />
                      <a href={user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}
                        target="_blank" rel="noreferrer">
                        {user.blog}
                      </a>
                    </span>
                  )}
                  <span><i className="ti ti-calendar" />{joined} tarihinden beri</span>
                </div>
              </div>
              <a href={user.html_url} target="_blank" rel="noreferrer" className="profile-link-btn">
                <i className="ti ti-external-link" /> GitHub&apos;da Gör
              </a>
            </section>

            <section className="metrics-grid">
              <MetricCard icon="ti-book"        label="Toplam Repo"  value={user.public_repos} />
              <MetricCard icon="ti-star"        label="Toplam Yıldız" value={totalStars} />
              <MetricCard icon="ti-git-fork"    label="Fork Aldı"    value={totalForks} />
              <MetricCard icon="ti-users"       label="Takipçi"      value={user.followers} />
              <MetricCard icon="ti-user-check"  label="Takip"        value={user.following} />
              <MetricCard icon="ti-activity"    label="Katkı"        value={totalContributions} />
            </section>

            <section className="charts-section">
              {sortedLangs.length > 0 && (
                <div className="chart-card">
                  <h2 className="chart-title">Dil dağılımı</h2>
                  <div className="lang-legend">
                    {sortedLangs.map(([lang], i) => (
                      <span key={lang} className="lang-legend-item">
                        <span className="lang-legend-dot" style={{ background: LANG_PALETTE[i] }} />
                        {lang}
                      </span>
                    ))}
                  </div>
                  <div className="doughnut-wrap">
                    <Doughnut
                      data={{
                        labels: sortedLangs.map(l => l[0]),
                        datasets: [{
                          data: sortedLangs.map(l => l[1]),
                          backgroundColor: LANG_PALETTE.slice(0, sortedLangs.length),
                          borderWidth: 2,
                          borderColor: 'transparent',
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                      }}
                    />
                  </div>
                </div>
              )}

              {topStars.length > 0 && (
                <div className="chart-card">
                  <h2 className="chart-title">En yıldızlı repolar</h2>
                  <div style={{ position: 'relative', height: Math.max(topStars.length * 40 + 60, 220) + 'px' }}>
                    <Bar
                      data={{
                        labels: topStars.map(r => r.name.length > 16 ? r.name.slice(0, 15) + '…' : r.name),
                        datasets: [{
                          label: 'Yıldız',
                          data: topStars.map(r => r.stargazers_count),
                          backgroundColor: '#3266ad',
                          borderRadius: 4,
                        }],
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888' } },
                          y: { grid: { display: false }, ticks: { color: '#888', font: { size: 11 } } },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </section>

            {contributions.length > 0 && (
              <ContributionHeatmap
                weeks={contributions}
                totalContributions={totalContributions}
              />
            )}

            <section className="repos-section">
              <div className="repos-header">
                <h2 className="section-title-lg">Repolar</h2>
                <div className="tab-bar" role="tablist">
                  {(['stars', 'repos', 'forks'] as Tab[]).map(t => (
                    <button
                      key={t}
                      role="tab"
                      aria-selected={tab === t}
                      className={'tab-btn' + (tab === t ? ' active' : '')}
                      onClick={() => setTab(t)}
                    >
                      {t === 'stars' ? 'Yıldız' : t === 'repos' ? 'Son güncellenen' : 'Fork'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="repos-grid">
                {displayedRepos.map(r => <RepoCard key={r.id} repo={r} />)}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          GitHub REST API · Veri gerçek zamanlı çekilir ·{' '}
          <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer">API Docs</a>
        </p>
      </footer>
    </div>
  );
}