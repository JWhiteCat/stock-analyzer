import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchStock } from '../utils/api.js';

function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  async function handleSearch(e) {
    e?.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchStock(keyword);
      setResults(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const quickList = [
    { name: '贵州茅台', symbol: '600519' },
    { name: '五粮液', symbol: '000858' },
    { name: '中国平安', symbol: '601318' },
    { name: '招商银行', symbol: '600036' },
    { name: '比亚迪', symbol: '002594' },
    { name: '宁德时代', symbol: '300750' },
  ];

  return (
    <div>
      <div className="card">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            className="search-input"
            style={{ flex: 1, paddingLeft: 12 }}
            placeholder="输入股票代码或名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
          />
          <button className="chart-btn active" type="submit">搜索</button>
        </form>
      </div>

      {!searched && (
        <div className="card">
          <div className="card-title">热门搜索</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {quickList.map(item => (
              <button key={item.symbol} className="chart-btn" onClick={() => navigate(`/stock/${item.symbol}`)}>
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="loading"><div className="spinner" /></div>}

      {searched && !loading && (
        <div className="card">
          <div className="card-title">搜索结果 ({results.length})</div>
          {results.length === 0 ? (
            <div className="empty-state"><p>未找到相关股票</p></div>
          ) : (
            results.map((item, i) => (
              <div key={i} className="search-item" onClick={() => navigate(`/stock/${item.symbol}`)}>
                <span className="name">{item.name}</span>
                <span className="code">{item.symbol}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SearchPage;
