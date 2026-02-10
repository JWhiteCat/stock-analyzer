// AI-style technical analysis based on indicators

// Cache: symbol -> { result, timestamp }
const analysisCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(symbol) {
  const entry = analysisCache.get(symbol);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.result;
  return null;
}

function setCache(symbol, result) {
  analysisCache.set(symbol, { result, timestamp: Date.now() });
}

function analyzeStock(quote, klineData) {
  if (!klineData || klineData.length < 30) {
    return { score: 50, rating: '数据不足', signals: [], summary: '历史数据不足，无法进行有效分析。' };
  }

  const data = klineData.map(d => ({
    close: parseFloat(d.close), open: parseFloat(d.open),
    high: parseFloat(d.high), low: parseFloat(d.low),
    volume: parseInt(d.volume),
  }));

  const signals = [];
  let bullScore = 0;
  let bearScore = 0;

  const closes = data.map(d => d.close);
  const latest = closes[closes.length - 1];
  const prev = closes[closes.length - 2];

  // 1. MA Analysis
  const ma5 = avg(closes.slice(-5));
  const ma10 = avg(closes.slice(-10));
  const ma20 = avg(closes.slice(-20));
  const ma60 = closes.length >= 60 ? avg(closes.slice(-60)) : null;

  if (latest > ma5 && latest > ma10 && latest > ma20) {
    signals.push({ type: 'bull', indicator: 'MA', text: '股价站上MA5/MA10/MA20均线，多头排列' });
    bullScore += 15;
  } else if (latest < ma5 && latest < ma10 && latest < ma20) {
    signals.push({ type: 'bear', indicator: 'MA', text: '股价跌破MA5/MA10/MA20均线，空头排列' });
    bearScore += 15;
  } else if (latest > ma20) {
    signals.push({ type: 'neutral', indicator: 'MA', text: '股价在MA20上方运行，中期趋势偏多' });
    bullScore += 5;
  } else {
    signals.push({ type: 'neutral', indicator: 'MA', text: '股价在MA20下方运行，中期趋势偏弱' });
    bearScore += 5;
  }

  // MA5 cross MA10
  if (closes.length >= 12) {
    const prevMa5 = avg(closes.slice(-6, -1));
    const prevMa10 = avg(closes.slice(-11, -1));
    if (prevMa5 <= prevMa10 && ma5 > ma10) {
      signals.push({ type: 'bull', indicator: 'MA', text: 'MA5上穿MA10，形成金叉' });
      bullScore += 10;
    } else if (prevMa5 >= prevMa10 && ma5 < ma10) {
      signals.push({ type: 'bear', indicator: 'MA', text: 'MA5下穿MA10，形成死叉' });
      bearScore += 10;
    }
  }

  // 2. MACD Analysis
  if (closes.length >= 30) {
    const emaShort = calcEMA(closes, 12);
    const emaLong = calcEMA(closes, 26);
    const dif = emaShort.map((v, i) => v - emaLong[i]);
    const dea = calcEMA(dif, 9);
    const macdBar = dif.map((v, i) => (v - dea[i]) * 2);

    const curDif = dif[dif.length - 1];
    const curDea = dea[dea.length - 1];
    const curMacd = macdBar[macdBar.length - 1];
    const prevMacd = macdBar[macdBar.length - 2];

    if (curDif > curDea && curDif > 0) {
      signals.push({ type: 'bull', indicator: 'MACD', text: 'MACD在零轴上方，DIF>DEA，强势运行' });
      bullScore += 12;
    } else if (curDif < curDea && curDif < 0) {
      signals.push({ type: 'bear', indicator: 'MACD', text: 'MACD在零轴下方，DIF<DEA，弱势运行' });
      bearScore += 12;
    } else if (curDif > curDea) {
      signals.push({ type: 'bull', indicator: 'MACD', text: 'DIF>DEA，短线偏多' });
      bullScore += 5;
    } else if (curDif < curDea) {
      signals.push({ type: 'bear', indicator: 'MACD', text: 'DIF<DEA，短线偏空' });
      bearScore += 5;
    }

    if (prevMacd < 0 && curMacd >= 0) {
      signals.push({ type: 'bull', indicator: 'MACD', text: 'MACD柱由绿转红，动能转多' });
      bullScore += 8;
    } else if (prevMacd > 0 && curMacd <= 0) {
      signals.push({ type: 'bear', indicator: 'MACD', text: 'MACD柱由红转绿，动能转空' });
      bearScore += 8;
    }
  }

  // 3. RSI Analysis
  if (closes.length >= 16) {
    const rsi14 = calcRSI(closes, 14);
    if (rsi14 !== null) {
      if (rsi14 > 80) {
        signals.push({ type: 'bear', indicator: 'RSI', text: `RSI(14)=${rsi14.toFixed(1)}，进入超买区域，注意回调风险` });
        bearScore += 12;
      } else if (rsi14 > 70) {
        signals.push({ type: 'bear', indicator: 'RSI', text: `RSI(14)=${rsi14.toFixed(1)}，接近超买区域` });
        bearScore += 5;
      } else if (rsi14 > 55) {
        signals.push({ type: 'bull', indicator: 'RSI', text: `RSI(14)=${rsi14.toFixed(1)}，偏强运行` });
        bullScore += 3;
      } else if (rsi14 < 20) {
        signals.push({ type: 'bull', indicator: 'RSI', text: `RSI(14)=${rsi14.toFixed(1)}，进入超卖区域，可能迎来反弹` });
        bullScore += 12;
      } else if (rsi14 < 30) {
        signals.push({ type: 'bull', indicator: 'RSI', text: `RSI(14)=${rsi14.toFixed(1)}，接近超卖区域` });
        bullScore += 5;
      } else if (rsi14 < 45) {
        signals.push({ type: 'bear', indicator: 'RSI', text: `RSI(14)=${rsi14.toFixed(1)}，偏弱运行` });
        bearScore += 3;
      } else {
        signals.push({ type: 'neutral', indicator: 'RSI', text: `RSI(14)=${rsi14.toFixed(1)}，处于中性区间` });
      }
    }
  }

  // 4. KDJ Analysis
  if (closes.length >= 12) {
    const kdj = calcKDJ(data);
    if (kdj) {
      if (kdj.k > 80 && kdj.d > 80) {
        signals.push({ type: 'bear', indicator: 'KDJ', text: `KDJ(${kdj.k.toFixed(0)},${kdj.d.toFixed(0)},${kdj.j.toFixed(0)})高位，超买信号` });
        bearScore += 8;
      } else if (kdj.k < 20 && kdj.d < 20) {
        signals.push({ type: 'bull', indicator: 'KDJ', text: `KDJ(${kdj.k.toFixed(0)},${kdj.d.toFixed(0)},${kdj.j.toFixed(0)})低位，超卖信号` });
        bullScore += 8;
      } else if (kdj.j > 100) {
        signals.push({ type: 'bear', indicator: 'KDJ', text: `J值=${kdj.j.toFixed(0)}超过100，短线过热` });
        bearScore += 5;
      } else if (kdj.j < 0) {
        signals.push({ type: 'bull', indicator: 'KDJ', text: `J值=${kdj.j.toFixed(0)}低于0，短线超跌` });
        bullScore += 5;
      } else if (kdj.k > 60) {
        signals.push({ type: 'bull', indicator: 'KDJ', text: `KDJ(${kdj.k.toFixed(0)},${kdj.d.toFixed(0)},${kdj.j.toFixed(0)})偏强区域` });
        bullScore += 3;
      } else if (kdj.k < 40) {
        signals.push({ type: 'bear', indicator: 'KDJ', text: `KDJ(${kdj.k.toFixed(0)},${kdj.d.toFixed(0)},${kdj.j.toFixed(0)})偏弱区域` });
        bearScore += 3;
      } else {
        signals.push({ type: 'neutral', indicator: 'KDJ', text: `KDJ(${kdj.k.toFixed(0)},${kdj.d.toFixed(0)},${kdj.j.toFixed(0)})中性区间` });
      }
    }
  }

  // 5. Volume Analysis
  if (data.length >= 10) {
    const recentVols = data.slice(-5).map(d => d.volume);
    const avgVol5 = avg(recentVols);
    const avgVol10 = avg(data.slice(-10).map(d => d.volume));
    const latestVol = data[data.length - 1].volume;

    if (latestVol > avgVol10 * 1.5 && latest > prev) {
      signals.push({ type: 'bull', indicator: '成交量', text: '放量上涨，资金积极入场' });
      bullScore += 10;
    } else if (latestVol > avgVol10 * 1.5 && latest < prev) {
      signals.push({ type: 'bear', indicator: '成交量', text: '放量下跌，抛压较重' });
      bearScore += 10;
    } else if (latestVol < avgVol10 * 0.6) {
      signals.push({ type: 'neutral', indicator: '成交量', text: '缩量运行，市场观望情绪浓厚' });
    } else if (avgVol5 > avgVol10 * 1.1) {
      signals.push({ type: 'bull', indicator: '成交量', text: '近5日量能温和放大' });
      bullScore += 3;
    } else if (avgVol5 < avgVol10 * 0.8) {
      signals.push({ type: 'bear', indicator: '成交量', text: '近5日量能逐步萎缩' });
      bearScore += 3;
    }
  }

  // 6. Trend Analysis
  if (data.length >= 5) {
    const last5 = closes.slice(-5);
    const upDays = last5.filter((c, i) => i > 0 && c > last5[i - 1]).length;
    const downDays = last5.filter((c, i) => i > 0 && c < last5[i - 1]).length;

    if (upDays >= 4) {
      signals.push({ type: 'bull', indicator: '趋势', text: `近5日${upDays}天上涨，短线势头强劲` });
      bullScore += 8;
    } else if (downDays >= 4) {
      signals.push({ type: 'bear', indicator: '趋势', text: `近5日${downDays}天下跌，短线走势偏弱` });
      bearScore += 8;
    } else if (upDays >= 3) {
      signals.push({ type: 'bull', indicator: '趋势', text: `近5日${upDays}天上涨，短线偏强` });
      bullScore += 4;
    } else if (downDays >= 3) {
      signals.push({ type: 'bear', indicator: '趋势', text: `近5日${downDays}天下跌，短线偏弱` });
      bearScore += 4;
    } else {
      signals.push({ type: 'neutral', indicator: '趋势', text: '近5日涨跌互现，方向不明' });
    }
  }

  // 7. Support/Resistance
  if (data.length >= 20) {
    const recent20 = data.slice(-20);
    const high20 = Math.max(...recent20.map(d => d.high));
    const low20 = Math.min(...recent20.map(d => d.low));
    const range = high20 - low20;

    if (latest > high20 - range * 0.1) {
      signals.push({ type: 'neutral', indicator: '压力位', text: `接近20日高点${high20.toFixed(2)}，面临上方压力` });
    } else if (latest < low20 + range * 0.1) {
      signals.push({ type: 'neutral', indicator: '支撑位', text: `接近20日低点${low20.toFixed(2)}，关注支撑有效性` });
    }
  }

  const score = clamp(50 + (bullScore - bearScore), 5, 95);
  const { rating, ratingClass } = scoreToRating(score);

  const summary = generateSummary(quote, signals, score, rating);

  const result = { score, rating, ratingClass, signals, summary, bullScore, bearScore };
  if (quote?.symbol) setCache(quote.symbol, result);
  return result;
}

function generateSummary(quote, signals, score, rating) {
  const name = quote?.name || '该股';
  const bullSignals = signals.filter(s => s.type === 'bull');
  const bearSignals = signals.filter(s => s.type === 'bear');

  let summary = `${name}当前技术面综合评分${score}分，整体评级【${rating}】。`;

  if (bullSignals.length > 0) {
    summary += `\n\n多头信号：${bullSignals.map(s => s.text).join('；')}。`;
  }
  if (bearSignals.length > 0) {
    summary += `\n\n空头信号：${bearSignals.map(s => s.text).join('；')}。`;
  }

  if (score >= 60) {
    summary += '\n\n建议：技术面偏多，可适当关注买入机会，但需设好止损位，控制仓位风险。';
  } else if (score <= 40) {
    summary += '\n\n建议：技术面偏空，建议观望或减仓，等待企稳信号出现后再做决策。';
  } else {
    summary += '\n\n建议：技术面信号不明朗，建议保持观望，等待方向选择明确后再操作。';
  }

  summary += '\n\n⚠ 以上分析基于技术指标自动生成，仅供参考，不构成投资建议。投资有风险，入市需谨慎。';

  return summary;
}

// Helper functions
function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scoreToRating(score) {
  if (score >= 75) return { rating: '强烈看多', ratingClass: 'bull' };
  if (score >= 60) return { rating: '偏多', ratingClass: 'bull' };
  if (score >= 45) return { rating: '中性', ratingClass: 'neutral' };
  if (score >= 30) return { rating: '偏空', ratingClass: 'bear' };
  return { rating: '强烈看空', ratingClass: 'bear' };
}

function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

function calcRSI(closes, period) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  const recent = closes.slice(-(period + 1));
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const rs = losses === 0 ? 100 : gains / losses;
  return 100 - 100 / (1 + rs);
}

function calcKDJ(data) {
  const n = 9;
  if (data.length < n) return null;
  const recent = data.slice(-n);
  const highN = Math.max(...recent.map(d => d.high));
  const lowN = Math.min(...recent.map(d => d.low));
  const close = data[data.length - 1].close;
  const rsv = highN === lowN ? 50 : ((close - lowN) / (highN - lowN)) * 100;
  // Simplified: use latest RSV as approximation
  const k = rsv * 0.33 + 50 * 0.67;
  const d = k * 0.33 + 50 * 0.67;
  const j = 3 * k - 2 * d;
  return { k, d, j };
}

module.exports = { analyzeStock, getCached };
