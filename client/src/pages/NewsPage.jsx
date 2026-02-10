import { useState, useEffect } from 'react';
import { getNews } from '../utils/api.js';

function SkeletonNews() {
  return (
    <div className="news-item" style={{ cursor: 'default' }}>
      <div className="news-content">
        <div className="skeleton skeleton-line w-80" style={{ height: 16, marginBottom: 8 }} />
        <div className="skeleton skeleton-line w-60" style={{ height: 12, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton skeleton-line" style={{ width: 60, height: 12 }} />
          <div className="skeleton skeleton-line" style={{ width: 40, height: 12 }} />
        </div>
      </div>
      <div className="news-thumb" style={{ background: 'var(--bg-card)' }}>
        <div className="skeleton" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { loadNews(); }, []);

  async function loadNews() {
    try {
      const data = await getNews(1, 20);
      setNews(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getNews(nextPage, 20);
      if (data && data.length) {
        setNews(prev => [...prev, ...data]);
        setPage(nextPage);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingMore(false); }
  }

  if (loading) {
    return (
      <div>
        <div className="card">
          <div className="card-title">
            <div className="skeleton skeleton-line" style={{ width: 100, height: 16 }} />
          </div>
        </div>
        <div className="news-list">
          {[1,2,3,4,5].map(i => <SkeletonNews key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
              <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8z"/>
            </svg>
            财经资讯
          </div>
        </div>
      </div>

      <div className="news-list">
        {news.map((item, i) => (
          <a
            key={i}
            className="news-item"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="news-content">
              <div className="news-title">{item.title}</div>
              {item.summary && (
                <div className="news-summary">{item.summary.slice(0, 80)}{item.summary.length > 80 ? '...' : ''}</div>
              )}
              <div className="news-meta">
                {item.source && <span className="news-source">{item.source}</span>}
                <span className="news-time">{timeAgo(item.timestamp)}</span>
              </div>
            </div>
            {item.thumbnail && (
              <div className="news-thumb">
                <img src={item.thumbnail} alt="" loading="lazy" />
              </div>
            )}
          </a>
        ))}
      </div>

      {news.length > 0 && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                加载中...
              </span>
            ) : '加载更多'}
          </button>
        </div>
      )}

      {news.length === 0 && (
        <div className="empty-state">
          <div className="icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
              <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
            </svg>
          </div>
          <p>暂无新闻资讯</p>
        </div>
      )}
    </div>
  );
}

export default NewsPage;
