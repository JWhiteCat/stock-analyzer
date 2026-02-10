import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMultiQuotes } from '../utils/api.js';
import { getFavorites, removeFavorite } from '../utils/favorites.js';

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadFavorites(); }, []);

  async function loadFavorites() {
    const favList = getFavorites();
    setFavorites(favList);
    if (favList.length > 0) {
      try {
        const data = await getMultiQuotes(favList.map(f => f.symbol));
        setStocks(data || []);
      } catch (e) { console.error(e); }
    }
    setLoading(false);
  }

  function handleRemove(e, symbol) {
    e.stopPropagation();
    removeFavorite(symbol);
    setFavorites(prev => prev.filter(f => f.symbol !== symbol));
    setStocks(prev => prev.filter(s => s.symbol !== symbol));
  }

  if (loading) {
    return (
      <div>
        <div className="card"><div className="card-title"><div className="skeleton skeleton-line" style={{ width: 120, height: 16 }} /></div></div>
        <div className="stock-grid">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-line" style={{ width: 80, height: 14, marginBottom: 8 }} />
              <div className="skeleton skeleton-line" style={{ width: 120, height: 28, marginBottom: 6 }} />
              <div className="skeleton skeleton-line" style={{ width: 140, height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <p>暂无自选股</p>
        <p style={{ marginTop: 8, fontSize: 13 }}>搜索并添加感兴趣的股票到自选列表</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--yellow)" stroke="var(--yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            我的自选 ({favorites.length})
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
                <button className="fav-btn active" onClick={(e) => handleRemove(e, stock.symbol)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  已关注
                </button>
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
    </div>
  );
}

export default FavoritesPage;
