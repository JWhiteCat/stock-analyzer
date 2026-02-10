import { useState, useEffect } from 'react';
import { getNews } from '../utils/api.js';

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

  function timeAgo(timestamp) {
    if (!timestamp) return '';
    const diff = Math.floor(Date.now() / 1000) - timestamp;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  }

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">财经资讯</div>
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
        <div style={{ textAlign: 'center', padding: 16 }}>
          <button className="chart-btn" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}

      {news.length === 0 && (
        <div className="empty-state"><p>暂无新闻资讯</p></div>
      )}
    </div>
  );
}

export default NewsPage;
