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

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  if (favorites.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">&#9734;</div>
        <p>暂无自选股</p>
        <p style={{ marginTop: 8, fontSize: 13 }}>搜索并添加感兴趣的股票到自选列表</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card"><div className="card-title">我的自选 ({favorites.length})</div></div>
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
                <button className="fav-btn active" onClick={(e) => handleRemove(e, stock.symbol)}>&#9733; 已关注</button>
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
