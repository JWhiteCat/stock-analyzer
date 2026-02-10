import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHotStocks, getIndices } from '../utils/api.js';
import { formatAmount } from '../utils/indicators.js';

function SkeletonIndex() {
  return (
    <div className="index-card">
      <div className="skeleton skeleton-line w-40" style={{ margin: '0 auto 8px', height: 12 }} />
      <div className="skeleton skeleton-line w-60" style={{ margin: '0 auto 6px', height: 24 }} />
      <div className="skeleton skeleton-line w-80" style={{ margin: '0 auto 6px', height: 12 }} />
      <div className="skeleton skeleton-line w-40" style={{ margin: '0 auto', height: 10 }} />
    </div>
  );
}

function SkeletonStock() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="skeleton skeleton-line" style={{ width: 80, height: 14, marginBottom: 4 }} />
          <div className="skeleton skeleton-line" style={{ width: 60, height: 10 }} />
        </div>
      </div>
      <div className="skeleton skeleton-line" style={{ width: 120, height: 28, marginBottom: 6 }} />
      <div className="skeleton skeleton-line" style={{ width: 140, height: 14 }} />
    </div>
  );
}

function HomePage() {
  const [stocks, setStocks] = useState([]);
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

  async function loadData() {
    try {
      const [stockData, indexData] = await Promise.all([getHotStocks(), getIndices()]);
      setStocks(stockData || []);
      setIndices(indexData || []);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="indices-bar">
          {[1, 2, 3].map(i => <SkeletonIndex key={i} />)}
        </div>
        <div className="card">
          <div className="card-title">
            <div className="skeleton skeleton-line" style={{ width: 100, height: 16 }} />
          </div>
        </div>
        <div className="stock-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonStock key={i} />)}
        </div>
      </div>
    );
  }

  const upCount = stocks.filter(s => s.change > 0).length;
  const downCount = stocks.filter(s => s.change < 0).length;
  const flatCount = stocks.filter(s => s.change === 0).length;

  return (
    <div>
      {indices.length > 0 && (
        <div className="indices-bar">
          {indices.map((idx) => {
            const cls = idx.change > 0 ? 'price-up' : idx.change < 0 ? 'price-down' : 'price-flat';
            return (
              <div key={idx.symbol} className={`index-card ${cls}`} onClick={() => navigate(`/stock/${idx.symbol}`)}>
                <div className="index-name">{idx.name}</div>
                <div className={`index-price ${cls}`}>{idx.price?.toFixed(2)}</div>
                <div className={`index-change ${cls}`}>
                  <span>{idx.change > 0 ? '+' : ''}{idx.change?.toFixed(2)}</span>
                  <span>{idx.changePercent > 0 ? '+' : ''}{idx.changePercent?.toFixed(2)}%</span>
                </div>
                <div className="index-volume">成交额 {formatAmount(idx.amount * 10000)}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <div className="card-title">
          热门股票
          <div className="market-summary">
            <span className="tag up">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 4l8 16H4z"/></svg>
              {upCount}
            </span>
            <span className="tag down">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 20l8-16H4z"/></svg>
              {downCount}
            </span>
            <span className="tag flat">{flatCount}</span>
          </div>
        </div>
      </div>

      <div className="stock-grid">
        {stocks.map((stock) => {
          const cls = stock.change > 0 ? 'price-up' : stock.change < 0 ? 'price-down' : 'price-flat';
          return (
            <div key={stock.symbol} className="stock-card" onClick={() => navigate(`/stock/${stock.symbol}`)}>
              <div className="stock-header">
                <div>
                  <div className="stock-name">{stock.name}</div>
                  <div className="stock-code">{stock.symbol}</div>
                </div>
              </div>
              <div className={`stock-price ${cls}`}>{stock.price?.toFixed(2) || '--'}</div>
              <div className={`stock-change ${cls}`}>
                <span>{stock.change > 0 ? '+' : ''}{stock.change?.toFixed(2)}</span>
                <span>{stock.change > 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {stocks.length === 0 && (
        <div className="empty-state">
          <div className="icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <p>暂无行情数据，请检查网络连接</p>
        </div>
      )}
    </div>
  );
}

export default HomePage;
