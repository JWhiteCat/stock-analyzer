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
import { calcMA, calcMACD, calcRSI, calcKDJ, calcBOLL, formatVolume, formatAmount } from '../utils/indicators.js';
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

function StockDetail() {
  const { symbol } = useParams();
  const [quote, setQuote] = useState(null);
  const [klineData, setKlineData] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [indicator, setIndicator] = useState('ma');
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(true);
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

  async function loadKline() {
    setLoading(true);
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
    } catch (e) { console.error(e); }
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

  const priceClass = quote ? (quote.change > 0 ? 'price-up' : quote.change < 0 ? 'price-down' : 'price-flat') : '';

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <div>
            {quote?.name || symbol}
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 8 }}>{symbol}</span>
          </div>
          <button className={`fav-btn ${fav ? 'active' : ''}`} onClick={toggleFavorite}>
            {fav ? '\u2605 已自选' : '\u2606 加自选'}
          </button>
        </div>

        {quote && (
          <>
            <div className={`stock-price ${priceClass}`} style={{ fontSize: 32, fontWeight: 700 }}>
              {quote.price?.toFixed(2)}
            </div>
            <div className={`stock-change ${priceClass}`} style={{ fontSize: 16, marginBottom: 12 }}>
              <span>{quote.change > 0 ? '+' : ''}{quote.change?.toFixed(2)}</span>
              <span style={{ marginLeft: 8 }}>{quote.change > 0 ? '+' : ''}{quote.changePercent?.toFixed(2)}%</span>
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
          <div className="loading"><div className="spinner" /></div>
        ) : klineData.length > 0 ? (
          <ReactEChartsCore echarts={echarts} option={chartOption} style={{ height: 500 }} notMerge lazyUpdate />
        ) : (
          <div className="empty-state"><p>暂无K线数据</p></div>
        )}
      </div>

      {/* AI Analysis Panel */}
      <div className="card">
        <div className="card-title">
          AI 技术分析
          <button className="chart-btn" onClick={loadAnalysis} disabled={analysisLoading}>
            {analysisLoading ? '分析中...' : '刷新分析'}
          </button>
        </div>

        {analysisLoading && <div className="loading"><div className="spinner" /></div>}

        {!analysisLoading && analysis && (
          <div className="analysis-panel">
            <div className="analysis-score-bar">
              <div className="score-gauge">
                <div className={`score-number ${analysis.ratingClass === 'bull' ? 'price-up' : analysis.ratingClass === 'bear' ? 'price-down' : 'price-flat'}`}>
                  {analysis.score}
                </div>
                <div className="score-label">综合评分</div>
              </div>
              <div className={`score-rating ${analysis.ratingClass === 'bull' ? 'price-up' : analysis.ratingClass === 'bear' ? 'price-down' : 'price-flat'}`}>
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
                    {signal.type === 'bull' ? '\u25B2' : signal.type === 'bear' ? '\u25BC' : '\u25CF'} {signal.indicator}
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

function buildChartOption(data, indicator) {
  const dates = data.map(d => d.day);
  const ohlc = data.map(d => [d.open, d.close, d.low, d.high]);
  const volumes = data.map(d => d.volume);
  const colors = data.map(d => d.close >= d.open ? '#f85149' : '#3fb950');

  const grids = [
    { left: 50, right: 20, top: 30, height: '45%' },
    { left: 50, right: 20, top: '58%', height: '12%' },
    { left: 50, right: 20, top: '74%', height: '18%' },
  ];

  const series = [
    {
      name: 'K线', type: 'candlestick', data: ohlc, xAxisIndex: 0, yAxisIndex: 0,
      itemStyle: { color: '#f85149', color0: '#3fb950', borderColor: '#f85149', borderColor0: '#3fb950' },
    },
    {
      name: '成交量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1,
      data: volumes.map((v, i) => ({ value: v, itemStyle: { color: colors[i] + '80' } })),
    },
  ];

  if (indicator === 'ma') {
    [5, 10, 20, 60].forEach((p, idx) => {
      const c = ['#58a6ff', '#d29922', '#f778ba', '#a371f7'][idx];
      series.push({ name: `MA${p}`, type: 'line', data: calcMA(data, p), smooth: true, lineStyle: { width: 1 }, symbol: 'none', xAxisIndex: 0, yAxisIndex: 0, itemStyle: { color: c } });
    });
  } else if (indicator === 'boll') {
    const boll = calcBOLL(data);
    series.push(
      { name: 'BOLL上轨', type: 'line', data: boll.upper, smooth: true, lineStyle: { width: 1 }, symbol: 'none', xAxisIndex: 0, yAxisIndex: 0, itemStyle: { color: '#f85149' } },
      { name: 'BOLL中轨', type: 'line', data: boll.mid, smooth: true, lineStyle: { width: 1 }, symbol: 'none', xAxisIndex: 0, yAxisIndex: 0, itemStyle: { color: '#d29922' } },
      { name: 'BOLL下轨', type: 'line', data: boll.lower, smooth: true, lineStyle: { width: 1 }, symbol: 'none', xAxisIndex: 0, yAxisIndex: 0, itemStyle: { color: '#3fb950' } },
    );
  }

  if (indicator === 'macd') {
    const macd = calcMACD(data);
    series.push(
      { name: 'DIF', type: 'line', data: macd.dif, symbol: 'none', lineStyle: { width: 1 }, xAxisIndex: 2, yAxisIndex: 2, itemStyle: { color: '#58a6ff' } },
      { name: 'DEA', type: 'line', data: macd.dea, symbol: 'none', lineStyle: { width: 1 }, xAxisIndex: 2, yAxisIndex: 2, itemStyle: { color: '#d29922' } },
      { name: 'MACD', type: 'bar', xAxisIndex: 2, yAxisIndex: 2, data: macd.macd.map(v => ({ value: v, itemStyle: { color: v >= 0 ? '#f8514980' : '#3fb95080' } })) },
    );
  } else if (indicator === 'rsi') {
    series.push(
      { name: 'RSI6', type: 'line', data: calcRSI(data, 6), symbol: 'none', lineStyle: { width: 1 }, xAxisIndex: 2, yAxisIndex: 2, itemStyle: { color: '#58a6ff' } },
      { name: 'RSI14', type: 'line', data: calcRSI(data, 14), symbol: 'none', lineStyle: { width: 1 }, xAxisIndex: 2, yAxisIndex: 2, itemStyle: { color: '#d29922' } },
    );
  } else if (indicator === 'kdj') {
    const kdj = calcKDJ(data);
    series.push(
      { name: 'K', type: 'line', data: kdj.k, symbol: 'none', lineStyle: { width: 1 }, xAxisIndex: 2, yAxisIndex: 2, itemStyle: { color: '#58a6ff' } },
      { name: 'D', type: 'line', data: kdj.d, symbol: 'none', lineStyle: { width: 1 }, xAxisIndex: 2, yAxisIndex: 2, itemStyle: { color: '#d29922' } },
      { name: 'J', type: 'line', data: kdj.j, symbol: 'none', lineStyle: { width: 1 }, xAxisIndex: 2, yAxisIndex: 2, itemStyle: { color: '#f778ba' } },
    );
  }

  return {
    backgroundColor: 'transparent',
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: '#1c2333ee', borderColor: '#30363d', textStyle: { color: '#e6edf3', fontSize: 12 } },
    legend: { top: 4, textStyle: { color: '#8b949e', fontSize: 11 }, itemWidth: 14, itemHeight: 10 },
    grid: grids,
    xAxis: [
      { type: 'category', data: dates, gridIndex: 0, axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { show: false }, axisTick: { show: false } },
      { type: 'category', data: dates, gridIndex: 1, axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { show: false }, axisTick: { show: false } },
      { type: 'category', data: dates, gridIndex: 2, axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { color: '#8b949e', fontSize: 10 }, axisTick: { show: false } },
    ],
    yAxis: [
      { scale: true, gridIndex: 0, splitLine: { lineStyle: { color: '#30363d30' } }, axisLabel: { color: '#8b949e', fontSize: 10 }, axisLine: { show: false } },
      { scale: true, gridIndex: 1, splitNumber: 2, splitLine: { show: false }, axisLabel: { color: '#8b949e', fontSize: 10, formatter: v => formatVolume(v) }, axisLine: { show: false } },
      { scale: true, gridIndex: 2, splitNumber: 3, splitLine: { lineStyle: { color: '#30363d30' } }, axisLabel: { color: '#8b949e', fontSize: 10 }, axisLine: { show: false } },
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1, 2], start: 60, end: 100 },
      { type: 'slider', xAxisIndex: [0, 1, 2], bottom: 4, height: 16, borderColor: '#30363d', fillerColor: '#58a6ff20', textStyle: { color: '#8b949e' } },
    ],
    series,
  };
}

export default StockDetail;
