import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopRated } from '../utils/api.js';
import { priceClass, formatSign } from '../utils/indicators.js';

const FILTERS = [
  { label: '全部', min: 0 },
  { label: '强烈看多 (≥75)', min: 75 },
  { label: '偏多 (≥60)', min: 60 },
  { label: '中性 (≥45)', min: 45 },
];

function SkeletonRow() {
  return (
    <div className="top-pick-row">
      <div className="tp-rank"><div className="skeleton" style={{ width: 24, height: 24, borderRadius: '50%' }} /></div>
      <div className="tp-info"><div className="skeleton skeleton-line" style={{ width: 80, height: 14 }} /></div>
      <div className="tp-score"><div className="skeleton skeleton-line" style={{ width: 40, height: 20 }} /></div>
      <div className="tp-price"><div className="skeleton skeleton-line" style={{ width: 60, height: 14 }} /></div>
      <div className="tp-change"><div className="skeleton skeleton-line" style={{ width: 50, height: 14 }} /></div>
    </div>
  );
}

function TableHeader() {
  return (
    <div className="top-pick-header">
      <div className="tp-rank">#</div>
      <div className="tp-info">股票</div>
      <div className="tp-score">评分</div>
      <div className="tp-price">现价</div>
      <div className="tp-change">涨跌幅</div>
    </div>
  );
}

function TopPicksPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getTopRated();
      setStocks(data || []);
    } catch (e) {
      console.error('Failed to load top rated:', e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = stocks.filter(s => s.score >= FILTERS[filter].min);

  function scoreColor(score) {
    if (score >= 75) return 'var(--red)';
    if (score >= 60) return '#f97316';
    if (score >= 45) return 'var(--text-muted)';
    if (score >= 30) return '#22c55e';
    return 'var(--green)';
  }

  function scoreBg(score) {
    if (score >= 75) return 'var(--red-soft)';
    if (score >= 60) return 'rgba(249, 115, 22, 0.12)';
    if (score >= 45) return 'rgba(148, 163, 184, 0.1)';
    return 'var(--green-soft)';
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -3, marginRight: 8 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            AI 评分精选
          </span>
          {!loading && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
              共 {filtered.length} 只
            </span>
          )}
        </div>

        <div className="chart-controls" style={{ marginBottom: 16 }}>
          {FILTERS.map((f, i) => (
            <button
              key={i}
              className={`chart-btn${filter === i ? ' active' : ''}`}
              onClick={() => setFilter(i)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="top-picks-list">
            <TableHeader />
            {[1,2,3,4,5,6,7,8].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <p>当前筛选条件下暂无符合的股票</p>
          </div>
        ) : (
          <div className="top-picks-list">
            <TableHeader />
            {filtered.map((stock, idx) => {
              const cls = priceClass(stock.change);
              return (
                <div key={stock.symbol} className="top-pick-row" onClick={() => navigate(`/stock/${stock.symbol}`)}>
                  <div className="tp-rank">
                    <span className={`rank-badge${idx < 3 ? ' top' : ''}`}>{idx + 1}</span>
                  </div>
                  <div className="tp-info">
                    <div className="stock-row-name">{stock.name}</div>
                    <div className="stock-row-code">{stock.symbol}</div>
                  </div>
                  <div className="tp-score">
                    <span
                      className="score-badge"
                      style={{ color: scoreColor(stock.score), background: scoreBg(stock.score) }}
                    >
                      {stock.score}
                    </span>
                    <span className="score-rating-text" style={{ color: scoreColor(stock.score) }}>
                      {stock.rating}
                    </span>
                  </div>
                  <div className={`tp-price ${cls}`}>{stock.price?.toFixed(2) || '--'}</div>
                  <div className={`tp-change ${cls}`}>
                    {formatSign(stock.change)}{stock.changePercent?.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: 'var(--text-muted)' }}>
        评分基于 MA / MACD / RSI / KDJ / 成交量等技术指标综合分析，仅供参考
      </div>
    </div>
  );
}

export default TopPicksPage;
