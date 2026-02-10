import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSectors, getSectorDetail } from '../utils/api.js';
import { formatAmount } from '../utils/indicators.js';

function pctClass(value) {
  if (value > 0) return 'price-up';
  if (value < 0) return 'price-down';
  return 'price-flat';
}

function formatPct(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function SkeletonRow() {
  return (
    <div className="sector-list-row" style={{ cursor: 'default' }}>
      <div className="sl-name">
        <div className="skeleton skeleton-line" style={{ width: 80, height: 14, marginBottom: 4 }} />
        <div className="skeleton skeleton-line" style={{ width: 40, height: 10 }} />
      </div>
      <div className="sl-change"><div className="skeleton skeleton-line" style={{ width: 50, height: 14, marginLeft: 'auto' }} /></div>
      <div className="sl-lead"><div className="skeleton skeleton-line" style={{ width: 60, height: 12, marginLeft: 'auto' }} /></div>
      <div className="sl-lead-pct"><div className="skeleton skeleton-line" style={{ width: 50, height: 12, marginLeft: 'auto' }} /></div>
    </div>
  );
}

function SectorPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('industry');
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(null);
  const [sectorDetail, setSectorDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadSectors();
  }, [type]);

  async function loadSectors() {
    setLoading(true);
    setSelectedSector(null);
    setSectorDetail(null);
    try {
      const data = await getSectors(type);
      setSectors(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function openSector(sector) {
    setSelectedSector(sector);
    setDetailLoading(true);
    try {
      const data = await getSectorDetail(sector.code);
      setSectorDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeSector() {
    setSelectedSector(null);
    setSectorDetail(null);
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            板块分类
          </div>
          <div className="chart-controls" style={{ marginBottom: 0 }}>
            <button className={`chart-btn ${type === 'industry' ? 'active' : ''}`} onClick={() => setType('industry')}>
              行业板块
            </button>
            <button className={`chart-btn ${type === 'concept' ? 'active' : ''}`} onClick={() => setType('concept')}>
              概念板块
            </button>
          </div>
        </div>
      </div>

      {selectedSector && (
        <SectorDetailView
          sector={selectedSector}
          detail={sectorDetail}
          loading={detailLoading}
          onClose={closeSector}
          onStockClick={(symbol) => navigate(`/stock/${symbol}`)}
        />
      )}

      {!selectedSector && (
        <SectorListView
          sectors={sectors}
          loading={loading}
          onSectorClick={openSector}
        />
      )}
    </div>
  );
}

function SectorDetailView({ sector, detail, loading, onClose, onStockClick }) {
  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner" />
          <span className="loading-text">加载板块详情...</span>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="card">
        <div className="empty-state"><p>暂无数据</p></div>
      </div>
    );
  }

  const { stats, stocks } = detail;

  return (
    <div className="card">
      <div className="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="sector-back-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          {sector.name}
          <span className={pctClass(sector.changePercent)} style={{ fontSize: 14, fontFamily: 'var(--font-mono)' }}>
            {formatPct(sector.changePercent)}
          </span>
        </div>
      </div>

      <div className="sector-stats">
        <div className="stat-item">
          <span className="stat-label">成分股</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">上涨</span>
          <span className="stat-value price-up">{stats.upCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">下跌</span>
          <span className="stat-value price-down">{stats.downCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">平均涨幅</span>
          <span className={`stat-value ${pctClass(stats.avgChange)}`}>
            {formatPct(stats.avgChange)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">总成交额</span>
          <span className="stat-value">{formatAmount(stats.totalAmount)}</span>
        </div>
      </div>

      <div className="sector-stock-list">
        <div className="sector-stock-header">
          <span className="col-name">名称</span>
          <span className="col-price">最新价</span>
          <span className="col-change">涨跌幅</span>
          <span className="col-volume">成交额</span>
        </div>
        {stocks.map(stock => (
          <div key={stock.symbol} className="sector-stock-row" onClick={() => onStockClick(stock.symbol)}>
            <div className="col-name">
              <div className="stock-row-name">{stock.name}</div>
              <div className="stock-row-code">{stock.symbol}</div>
            </div>
            <span className={`col-price ${pctClass(stock.changePercent)}`}>
              {stock.price.toFixed(2)}
            </span>
            <span className={`col-change ${pctClass(stock.changePercent)}`}>
              {formatPct(stock.changePercent)}
            </span>
            <span className="col-volume">{formatAmount(stock.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectorListView({ sectors, loading, onSectorClick }) {
  if (loading) {
    return (
      <div className="sector-list-table">
        <div className="sector-list-header">
          <span className="sl-name">板块名称</span>
          <span className="sl-change">涨跌幅</span>
          <span className="sl-lead">领涨股</span>
          <span className="sl-lead-pct">涨幅</span>
        </div>
        {[1,2,3,4,5,6,7,8].map(i => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (sectors.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>
        <p>暂无板块数据</p>
      </div>
    );
  }

  return (
    <div className="sector-list-table">
      <div className="sector-list-header">
        <span className="sl-name">板块名称</span>
        <span className="sl-change">涨跌幅</span>
        <span className="sl-lead">领涨股</span>
        <span className="sl-lead-pct">涨幅</span>
      </div>
      {sectors.map(sector => (
        <div key={sector.code} className="sector-list-row" onClick={() => onSectorClick(sector)}>
          <div className="sl-name">
            <div className="sl-sector-name">{sector.name}</div>
            <div className="sl-sector-count">{sector.stockCount}只</div>
          </div>
          <span className={`sl-change ${pctClass(sector.changePercent)}`}>
            {formatPct(sector.changePercent)}
          </span>
          <span className="sl-lead">{sector.leadName}</span>
          <span className={`sl-lead-pct ${pctClass(sector.leadChangePercent)}`}>
            {formatPct(sector.leadChangePercent)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default SectorPage;
