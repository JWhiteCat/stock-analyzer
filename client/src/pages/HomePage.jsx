import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHotStocks, getIndices } from '../utils/api.js';
import { formatAmount } from '../utils/indicators.js';

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
    return <div className="loading"><div className="spinner" /></div>;
  }

  const upCount = stocks.filter(s => s.change > 0).length;
  const downCount = stocks.filter(s => s.change < 0).length;
  const flatCount = stocks.filter(s => s.change === 0).length;

  return (
    <div>
      {/* Market Indices */}
      {indices.length > 0 && (
        <div className="indices-bar">
          {indices.map((idx) => {
            const cls = idx.change > 0 ? 'price-up' : idx.change < 0 ? 'price-down' : 'price-flat';
            return (
              <div key={idx.symbol} className={`index-card ${cls}`} onClick={() => navigate(`/stock/${idx.symbol}`)}>
                <div className="index-name">{idx.name}</div>
                <div className="index-price">{idx.price?.toFixed(2)}</div>
                <div className="index-change">
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
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <span className="price-up">涨 {upCount}</span>
            {' '}
            <span className="price-down">跌 {downCount}</span>
            {' '}
            <span className="price-flat">平 {flatCount}</span>
          </span>
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
        <div className="empty-state"><p>暂无行情数据，请检查网络连接</p></div>
      )}
    </div>
  );
}

export default HomePage;
