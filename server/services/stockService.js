const axios = require('axios');

// Fetch real-time stock quote from Sina Finance API
async function getQuote(symbol) {
  const code = formatSinaCode(symbol);
  const url = `https://hq.sinajs.cn/list=${code}`;
  const res = await axios.get(url, {
    headers: { Referer: 'https://finance.sina.com.cn' },
    responseType: 'arraybuffer',
  });
  const text = new TextDecoder('gbk').decode(res.data);
  return parseSinaQuote(symbol, text);
}

// Fetch K-line history data from Sina
async function getKline(symbol, period = 'daily', count = 200) {
  const scaleMap = { daily: 240, weekly: 1200, '60min': 60, '30min': 30, '15min': 15, '5min': 5 };
  const scale = scaleMap[period] || 240;
  const code = formatSinaCode(symbol);

  const url = `https://quotes.sina.cn/cn/api/jsonp.php/var/IntelliSearchNT.eTag498765?datefmt=yyyy-MM-dd&cb=&name=cn_${symbol.toLowerCase()}&num=${count}&r=0.${Date.now()}`;

  // Use money.finance.sina.com.cn for kline
  const klineUrl = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${code}&scale=${scale}&ma=no&datalen=${count}`;

  try {
    const res = await axios.get(klineUrl, {
      headers: { Referer: 'https://finance.sina.com.cn' },
    });
    return res.data;
  } catch {
    return generateMockKline(count);
  }
}

// Fetch multiple stock quotes
async function getMultiQuotes(symbols) {
  const codes = symbols.map(formatSinaCode).join(',');
  const url = `https://hq.sinajs.cn/list=${codes}`;
  try {
    const res = await axios.get(url, {
      headers: { Referer: 'https://finance.sina.com.cn' },
      responseType: 'arraybuffer',
    });
    const text = new TextDecoder('gbk').decode(res.data);
    const lines = text.trim().split('\n').filter(Boolean);
    return lines.map((line, i) => parseSinaQuote(symbols[i], line));
  } catch {
    return symbols.map(s => ({ symbol: s, name: s, price: 0, change: 0, changePercent: 0 }));
  }
}

// Search stocks
async function searchStock(keyword) {
  const url = `https://suggest3.sinajs.cn/suggest/type=11,12,13,14,15&key=${encodeURIComponent(keyword)}&name=suggestdata`;
  try {
    const res = await axios.get(url, {
      headers: { Referer: 'https://finance.sina.com.cn' },
      responseType: 'arraybuffer',
    });
    const text = new TextDecoder('gbk').decode(res.data);
    const match = text.match(/"(.*)"/);
    if (!match || !match[1]) return [];
    return match[1].split(';').filter(Boolean).map(item => {
      const parts = item.split(',');
      return {
        symbol: parts[3] || parts[0],
        name: parts[4] || parts[1],
        type: parts[1],
        market: parts[0],
      };
    }).slice(0, 10);
  } catch {
    return [];
  }
}

function formatSinaCode(symbol) {
  symbol = symbol.toUpperCase();
  if (symbol.startsWith('SH') || symbol.startsWith('SZ')) return symbol.toLowerCase();
  if (/^6/.test(symbol)) return `sh${symbol}`;
  if (/^[0-3]/.test(symbol)) return `sz${symbol}`;
  if (/^8|^4/.test(symbol)) return `bj${symbol}`;
  return `sh${symbol}`;
}

function parseSinaQuote(symbol, text) {
  const match = text.match(/"(.*)"/);
  if (!match || !match[1]) {
    return { symbol, name: symbol, price: 0, open: 0, high: 0, low: 0, close: 0, preClose: 0, volume: 0, amount: 0, change: 0, changePercent: 0, time: '' };
  }
  const d = match[1].split(',');
  const name = d[0];
  const open = parseFloat(d[1]);
  const preClose = parseFloat(d[2]);
  const price = parseFloat(d[3]);
  const high = parseFloat(d[4]);
  const low = parseFloat(d[5]);
  const volume = parseInt(d[8]);
  const amount = parseFloat(d[9]);
  const date = d[30];
  const time = d[31];
  const change = price - preClose;
  const changePercent = preClose ? ((change / preClose) * 100) : 0;

  return {
    symbol, name, price, open, high, low, close: price, preClose,
    volume, amount, change: +change.toFixed(2),
    changePercent: +changePercent.toFixed(2),
    time: `${date} ${time}`,
  };
}

function generateMockKline(count) {
  const data = [];
  let price = 15 + Math.random() * 20;
  const now = new Date();
  for (let i = count; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const open = price + (Math.random() - 0.5) * 2;
    const close = open + (Math.random() - 0.5) * 3;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;
    const volume = Math.floor(50000 + Math.random() * 200000);
    data.push({
      day: date.toISOString().slice(0, 10),
      open: +open.toFixed(2), close: +close.toFixed(2),
      high: +high.toFixed(2), low: +low.toFixed(2),
      volume,
    });
    price = close;
  }
  return data;
}

// Fetch market indices (上证/深证/创业板)
async function getIndices() {
  const codes = 's_sh000001,s_sz399001,s_sz399006';
  const url = `https://hq.sinajs.cn/list=${codes}`;
  try {
    const res = await axios.get(url, {
      headers: { Referer: 'https://finance.sina.com.cn' },
      responseType: 'arraybuffer',
    });
    const text = new TextDecoder('gbk').decode(res.data);
    const lines = text.trim().split('\n').filter(Boolean);
    const symbols = ['sh000001', 'sz399001', 'sz399006'];
    return lines.map((line, i) => {
      const match = line.match(/"(.*)"/);
      if (!match || !match[1]) return { symbol: symbols[i], name: '--', price: 0, change: 0, changePercent: 0, volume: 0, amount: 0 };
      const d = match[1].split(',');
      return {
        symbol: symbols[i],
        name: d[0],
        price: parseFloat(d[1]),
        change: parseFloat(d[2]),
        changePercent: parseFloat(d[3]),
        volume: parseInt(d[4]),
        amount: parseFloat(d[5]),
      };
    });
  } catch {
    return [];
  }
}

// Fetch finance news from Sina
async function getNews(page = 1, count = 20) {
  const url = `https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&num=${count}&page=${page}`;
  try {
    const res = await axios.get(url, {
      headers: { Referer: 'https://finance.sina.com.cn' },
    });
    const items = res.data?.result?.data || [];
    return items.map(item => {
      const images = Array.isArray(item.images) ? item.images : [];
      const img = item.img;
      let thumbnail = images.length > 0 ? images[0].u : (img && img.u ? img.u : '');
      // Convert http to https for images
      if (thumbnail && thumbnail.startsWith('http://')) {
        thumbnail = thumbnail.replace('http://', 'https://');
      }
      return {
        title: item.title || '',
        url: item.url || '',
        wapurl: item.wapurl || '',
        source: item.media_name || '',
        time: item.ctime ? new Date(parseInt(item.ctime) * 1000).toLocaleString('zh-CN') : '',
        timestamp: parseInt(item.ctime) || 0,
        summary: item.intro || '',
        thumbnail,
      };
    });
  } catch {
    return [];
  }
}

async function getSectors(type = 'industry') {
  const param = type === 'concept' ? 'class' : 'industry';
  const url = `https://money.finance.sina.com.cn/q/view/newFLJK.php?param=${param}`;
  try {
    const res = await axios.get(url, {
      headers: { Referer: 'https://finance.sina.com.cn' },
      responseType: 'arraybuffer',
    });
    const text = new TextDecoder('gbk').decode(res.data);
    const match = text.match(/\{(.+)\}/s);
    if (!match) return [];
    const obj = JSON.parse('{' + match[1] + '}');
    return Object.entries(obj).map(([key, val]) => {
      const parts = val.split(',');
      return {
        code: parts[0] || key,
        name: parts[1] || '',
        stockCount: parseInt(parts[2]) || 0,
        avgPrice: parseFloat(parts[3]) || 0,
        change: parseFloat(parts[4]) || 0,
        changePercent: parseFloat(parts[5]) || 0,
        volume: parseInt(parts[6]) || 0,
        amount: parseFloat(parts[7]) || 0,
        leadCode: parts[8] || '',
        leadChangePercent: parseFloat(parts[9]) || 0,
        leadPrice: parseFloat(parts[10]) || 0,
        leadChange: parseFloat(parts[11]) || 0,
        leadName: parts[12] || '',
      };
    }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  } catch {
    return [];
  }
}

async function getSectorStocks(sectorCode, page = 1, count = 40) {
  const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=${count}&node=${sectorCode}&sort=changepercent&asc=0&_s_r_a=auto`;
  try {
    const res = await axios.get(url, {
      headers: { Referer: 'https://finance.sina.com.cn' },
    });
    const data = res.data || [];
    return data.map(item => ({
      symbol: item.symbol?.replace(/^sh|^sz|^bj/, '') || '',
      code: item.symbol || '',
      name: item.name || '',
      price: parseFloat(item.trade) || 0,
      change: parseFloat(item.pricechange) || 0,
      changePercent: parseFloat(item.changepercent) || 0,
      volume: parseInt(item.volume) || 0,
      amount: parseFloat(item.amount) || 0,
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      preClose: parseFloat(item.settlement) || 0,
      turnover: parseFloat(item.turnoverratio) || 0,
    }));
  } catch {
    return [];
  }
}

async function getSectorDetail(sectorCode) {
  const stocks = await getSectorStocks(sectorCode, 1, 80);
  if (!stocks.length) return { stocks: [], stats: {} };

  let upCount = 0;
  let downCount = 0;
  let changeSum = 0;
  let amountSum = 0;

  for (const stock of stocks) {
    if (stock.changePercent > 0) upCount++;
    else if (stock.changePercent < 0) downCount++;
    changeSum += stock.changePercent;
    amountSum += stock.amount;
  }

  return {
    stocks,
    stats: {
      total: stocks.length,
      upCount,
      downCount,
      flatCount: stocks.length - upCount - downCount,
      avgChange: +(changeSum / stocks.length).toFixed(2),
      totalAmount: amountSum,
    },
  };
}

module.exports = { getQuote, getKline, getMultiQuotes, searchStock, getIndices, getNews, getSectors, getSectorStocks, getSectorDetail };
