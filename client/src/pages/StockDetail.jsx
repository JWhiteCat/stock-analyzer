import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { CandlestickChart, LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, AxisPointerComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { getQuote, getKline, getAnalysis } from '../utils/api.js';
import { calcMA, calcMACD, calcRSI, calcKDJ, calcBOLL, formatVolume, formatAmount, priceClass, formatSign } from '../utils/indicators.js';
import { addFavorite, removeFavorite, isFavorite } from '../utils/favorites.js';

echarts.use([
  CandlestickChart, LineChart, BarChart,
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, AxisPointerComponent, CanvasRenderer,
]);

const PERIODS = [
  { key: 'daily', label: '日K' },
  { key: 'weekly', label: '周K' },
  { key: '60min', label: '60分' },
  { key: '30min', label: '30分' },
  { key: '15min', label: '15分' },
  { key: '5min', label: '5分' },
];

const INDICATORS = [
  { key: 'ma', label: 'MA' },
  { key: 'macd', label: 'MACD' },
  { key: 'rsi', label: 'RSI' },
  { key: 'kdj', label: 'KDJ' },
  { key: 'boll', label: 'BOLL' },
];

const RATING_CLASS_MAP = { bull: 'price-up', bear: 'price-down', neutral: 'price-flat' };

function ratingToPriceClass(ratingClass) {
  return RATING_CLASS_MAP[ratingClass] || 'price-flat';
}

const SIGNAL_ICONS = { bull: '\u25B2', bear: '\u25BC', neutral: '\u25CF' };

function StockDetail() {
  const { symbol } = useParams();
  const [quote, setQuote] = useState(null);
  const [klineData, setKlineData] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [indicator, setIndicator] = useState('ma');
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [klineError, setKlineError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    setFav(isFavorite(symbol));
    loadQuote();
    loadAnalysis();
  }, [symbol]);

  useEffect(() => { loadKline(); }, [symbol, period]);

  async function loadQuote() {
    try { const data = await getQuote(symbol); setQuote(data); }
    catch (e) { console.error(e); }
  }

  async function loadKline(retries = 2) {
    setLoading(true);
    setKlineError(null);
    try {
      const raw = await getKline(symbol, period, 200);
      const data = Array.isArray(raw) ? raw.map(d => ({
        day: d.day,
        open: parseFloat(d.open),
        close: parseFloat(d.close),
        high: parseFloat(d.high),
        low: parseFloat(d.low),
        volume: parseInt(d.volume),
      })) : [];
      setKlineData(data);
    } catch (e) {
      console.error(e);
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1500));
        return loadKline(retries - 1);
      }
      setKlineError('K线数据加载失败，请点击重试');
    }
    finally { setLoading(false); }
  }

  function toggleFavorite() {
    if (fav) { removeFavorite(symbol); setFav(false); }
    else { addFavorite({ symbol, name: quote?.name || symbol }); setFav(true); }
  }

  async function loadAnalysis() {
    setAnalysisLoading(true);
    try {
      const data = await getAnalysis(symbol);
      setAnalysis(data);
    } catch (e) { console.error(e); }
    finally { setAnalysisLoading(false); }
  }

  const chartOption = useMemo(() => {
    if (!klineData.length) return {};
    return buildChartOption(klineData, indicator);
  }, [klineData, indicator]);

  const cls = quote ? priceClass(quote.change) : '';

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span>{quote?.name || symbol}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{symbol}</span>
          </div>
          <button className={`fav-btn ${fav ? 'active' : ''}`} onClick={toggleFavorite}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {fav ? '已自选' : '加自选'}
          </button>
        </div>

        {quote && (
          <>
            <div className={`stock-price ${cls}`} style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>
              {quote.price?.toFixed(2)}
            </div>
            <div className={`stock-change ${cls}`} style={{ fontSize: 16, marginBottom: 12, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
              <span>{formatSign(quote.change)}{quote.change?.toFixed(2)}</span>
              <span style={{ marginLeft: 12 }}>{formatSign(quote.change)}{quote.changePercent?.toFixed(2)}%</span>
            </div>
            <div className="quote-detail">
              <div className="quote-item"><span className="label">开盘</span><span>{quote.open?.toFixed(2)}</span></div>
              <div className="quote-item"><span className="label">最高</span><span className="price-up">{quote.high?.toFixed(2)}</span></div>
              <div className="quote-item"><span className="label">最低</span><span className="price-down">{quote.low?.toFixed(2)}</span></div>
              <div className="quote-item"><span className="label">昨收</span><span>{quote.preClose?.toFixed(2)}</span></div>
              <div className="quote-item"><span className="label">成交量</span><span>{formatVolume(quote.volume || 0)}</span></div>
              <div className="quote-item"><span className="label">成交额</span><span>{formatAmount(quote.amount || 0)}</span></div>
            </div>
          </>
        )}

        {!quote && (
          <div style={{ padding: '16px 0' }}>
            <div className="skeleton skeleton-line" style={{ width: 160, height: 36, marginBottom: 8 }} />
            <div className="skeleton skeleton-line" style={{ width: 200, height: 16, marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-line" style={{ height: 36 }} />)}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">K线图表</div>
        <div className="chart-controls">
          {PERIODS.map(p => (
            <button key={p.key} className={`chart-btn ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="indicator-tabs">
          {INDICATORS.map(ind => (
            <button key={ind.key} className={`indicator-tab ${indicator === ind.key ? 'active' : ''}`} onClick={() => setIndicator(ind.key)}>
              {ind.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span className="loading-text">加载图表数据...</span>
          </div>
        ) : klineError ? (
          <div className="empty-state">
            <div className="icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
              </svg>
            </div>
            <p>{klineError}</p>
            <button className="chart-btn active" onClick={loadKline} style={{ marginTop: 8 }}>重试</button>
          </div>
        ) : klineData.length > 0 ? (
          <ReactEChartsCore echarts={echarts} option={chartOption} style={{ height: 500 }} notMerge lazyUpdate />
        ) : (
          <div className="empty-state">
            <div className="icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                <rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 14l3-3 2 2 5-5"/>
              </svg>
            </div>
            <p>暂无K线数据</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
            AI 技术分析
          </div>
          <button className="chart-btn" onClick={loadAnalysis} disabled={analysisLoading}>
            {analysisLoading ? '分析中...' : '刷新分析'}
          </button>
        </div>

        {analysisLoading && (
          <div className="loading">
            <div className="spinner" />
            <span className="loading-text">AI分析计算中...</span>
          </div>
        )}

        {!analysisLoading && analysis && (
          <div className="analysis-panel">
            <div className="analysis-score-bar">
              <div className="score-gauge">
                <div className={`score-number ${ratingToPriceClass(analysis.ratingClass)}`}>
                  {analysis.score}
                </div>
                <div className="score-label">综合评分</div>
              </div>
              <div className={`score-rating ${ratingToPriceClass(analysis.ratingClass)}`}>
                {analysis.rating}
              </div>
              <div className="score-meter">
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: `${analysis.score}%` }} />
                  <div className="meter-pointer" style={{ left: `${analysis.score}%` }} />
                </div>
                <div className="meter-labels">
                  <span>看空</span><span>中性</span><span>看多</span>
                </div>
              </div>
            </div>

            <div className="analysis-signals">
              {analysis.signals?.map((signal, i) => (
                <div key={i} className={`signal-item signal-${signal.type}`}>
                  <span className="signal-badge">
                    {SIGNAL_ICONS[signal.type] || '\u25CF'} {signal.indicator}
                  </span>
                  <span className="signal-text">{signal.text}</span>
                </div>
              ))}
            </div>

            <div className="analysis-summary">
              {analysis.summary?.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function makeLineSeries(name, data, color, axisIndex = 0) {
  return {
    name, type: 'line', data, smooth: axisIndex === 0, symbol: 'none',
    lineStyle: { width: 1 }, xAxisIndex: axisIndex, yAxisIndex: axisIndex,
    itemStyle: { color },
  };
}

function buildChartOption(data, indicator) {
  const dates = data.map(d => d.day);
  const ohlc = data.map(d => [d.open, d.close, d.low, d.high]);
  const volumes = data.map(d => d.volume);
  const colors = data.map(d => d.close >= d.open ? '#ef4444' : '#22c55e');

  const grids = [
    { left: 50, right: 20, top: 30, height: '45%' },
    { left: 50, right: 20, top: '58%', height: '12%' },
    { left: 50, right: 20, top: '74%', height: '18%' },
  ];

  const series = [
    {
      name: 'K线', type: 'candlestick', data: ohlc, xAxisIndex: 0, yAxisIndex: 0,
      itemStyle: { color: '#ef4444', color0: '#22c55e', borderColor: '#ef4444', borderColor0: '#22c55e' },
    },
    {
      name: '成交量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1,
      data: volumes.map((v, i) => ({ value: v, itemStyle: { color: colors[i] + '60' } })),
    },
  ];

  if (indicator === 'ma') {
    const maColors = ['#60a5fa', '#eab308', '#f472b6', '#a78bfa'];
    [5, 10, 20, 60].forEach((p, idx) => {
      series.push(makeLineSeries(`MA${p}`, calcMA(data, p), maColors[idx]));
    });
  } else if (indicator === 'boll') {
    const boll = calcBOLL(data);
    series.push(
      makeLineSeries('BOLL上轨', boll.upper, '#ef4444'),
      makeLineSeries('BOLL中轨', boll.mid, '#eab308'),
      makeLineSeries('BOLL下轨', boll.lower, '#22c55e'),
    );
  }

  if (indicator === 'macd') {
    const macd = calcMACD(data);
    series.push(
      makeLineSeries('DIF', macd.dif, '#60a5fa', 2),
      makeLineSeries('DEA', macd.dea, '#eab308', 2),
      { name: 'MACD', type: 'bar', xAxisIndex: 2, yAxisIndex: 2, data: macd.macd.map(v => ({ value: v, itemStyle: { color: v >= 0 ? '#ef444460' : '#22c55e60' } })) },
    );
  } else if (indicator === 'rsi') {
    series.push(
      makeLineSeries('RSI6', calcRSI(data, 6), '#60a5fa', 2),
      makeLineSeries('RSI14', calcRSI(data, 14), '#eab308', 2),
    );
  } else if (indicator === 'kdj') {
    const kdj = calcKDJ(data);
    series.push(
      makeLineSeries('K', kdj.k, '#60a5fa', 2),
      makeLineSeries('D', kdj.d, '#eab308', 2),
      makeLineSeries('J', kdj.j, '#f472b6', 2),
    );
  }

  return {
    backgroundColor: 'transparent',
    animation: false,
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross' },
      backgroundColor: '#1e293bee', borderColor: '#334155',
      textStyle: { color: '#f8fafc', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" },
      formatter: function (params) {
        if (!params || !params.length) return '';
        const klineParam = params.find(p => p.seriesName === 'K线');
        if (!klineParam) return '';
        const idx = klineParam.dataIndex;
        const { open, close, low, high } = data[idx];
        const preClose = idx > 0 ? data[idx - 1].close : open;
        const change = close - preClose;
        const changePct = preClose ? ((change / preClose) * 100).toFixed(2) : '0.00';
        const changeColor = change > 0 ? '#ef4444' : change < 0 ? '#22c55e' : '#94a3b8';
        const sign = change > 0 ? '+' : '';
        let html = `<div style="font-size:12px;line-height:1.8">`;
        html += `<div style="font-weight:600;margin-bottom:2px">${dates[idx]}</div>`;
        html += `<div>开盘: <b>${open.toFixed(2)}</b></div>`;
        html += `<div>收盘: <b>${close.toFixed(2)}</b></div>`;
        html += `<div>最高: <b style="color:#ef4444">${high.toFixed(2)}</b></div>`;
        html += `<div>最低: <b style="color:#22c55e">${low.toFixed(2)}</b></div>`;
        html += `<div style="color:${changeColor}">涨幅: <b>${sign}${changePct}%</b></div>`;
        const volParam = params.find(p => p.seriesName === '成交量');
        if (volParam) html += `<div>成交量: <b>${formatVolume(volParam.data.value ?? volParam.data)}</b></div>`;
        params.forEach(p => {
          if (p.seriesName !== 'K线' && p.seriesName !== '成交量' && p.data != null) {
            const val = typeof p.data === 'object' ? p.data.value : p.data;
            if (val != null && !isNaN(val)) {
              html += `<div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:4px"></span>${p.seriesName}: <b>${parseFloat(val).toFixed(2)}</b></div>`;
            }
          }
        });
        html += `</div>`;
        return html;
      },
    },
    legend: { top: 4, textStyle: { color: '#94a3b8', fontSize: 11 }, itemWidth: 14, itemHeight: 10 },
    grid: grids,
    xAxis: [
      { type: 'category', data: dates, gridIndex: 0, axisLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { show: false }, axisTick: { show: false } },
      { type: 'category', data: dates, gridIndex: 1, axisLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { show: false }, axisTick: { show: false } },
      { type: 'category', data: dates, gridIndex: 2, axisLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b', fontSize: 10 }, axisTick: { show: false } },
    ],
    yAxis: [
      { scale: true, gridIndex: 0, splitLine: { lineStyle: { color: '#1e293b30' } }, axisLabel: { color: '#64748b', fontSize: 10 }, axisLine: { show: false } },
      { scale: true, gridIndex: 1, splitNumber: 2, splitLine: { show: false }, axisLabel: { color: '#64748b', fontSize: 10, formatter: v => formatVolume(v) }, axisLine: { show: false } },
      { scale: true, gridIndex: 2, splitNumber: 3, splitLine: { lineStyle: { color: '#1e293b30' } }, axisLabel: { color: '#64748b', fontSize: 10 }, axisLine: { show: false } },
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1, 2], start: 60, end: 100 },
      { type: 'slider', xAxisIndex: [0, 1, 2], bottom: 4, height: 16, borderColor: '#1e293b', fillerColor: '#3b82f620', textStyle: { color: '#64748b' } },
    ],
    series,
  };
}

export default StockDetail;
