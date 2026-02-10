import { useState, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { searchStock } from '../utils/api.js';

const NAV_ITEMS = [
  {
    path: '/',
    label: '行情',
    icon: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  },
  {
    path: '/sectors',
    label: '板块',
    icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  },
  {
    path: '/top-picks',
    label: '精选',
    icon: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01z"/></>,
  },
  {
    path: '/favorites',
    label: '自选',
    icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  },
  {
    path: '/news',
    label: '资讯',
    icon: <><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8z"/></>,
  },
];

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef(null);
  const currentPath = location.pathname;

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setKeyword(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const data = await searchStock(val);
      setResults(data || []);
      setShowResults(true);
    }, 300);
  }, []);

  function handleSelect(item) {
    setKeyword('');
    setShowResults(false);
    navigate(`/stock/${item.symbol}`);
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          StockView <span>A股分析</span>
        </Link>
        <div className="search-container">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="search-input"
            placeholder="搜索股票代码/名称..."
            value={keyword}
            onChange={handleSearch}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          {showResults && results.length > 0 && (
            <div className="search-results">
              {results.map((item, i) => (
                <div key={i} className="search-item" onMouseDown={() => handleSelect(item)}>
                  <span className="name">{item.name}</span>
                  <span className="code">{item.symbol}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <nav className="nav-tabs">
        {NAV_ITEMS.map(({ path, label }) => (
          <Link key={path} to={path} className={currentPath === path ? 'active' : ''}>{label}</Link>
        ))}
      </nav>

      <main className="app-main">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>

      <div className="bottom-nav">
        <div className="nav-items">
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <div key={path} className={`nav-item ${isActive(path) ? 'active' : ''}`} onClick={() => navigate(path)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {icon}
              </svg>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Layout;
