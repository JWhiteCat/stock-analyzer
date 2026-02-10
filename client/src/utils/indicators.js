export function calcMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j].close;
      result.push(+(sum / period).toFixed(2));
    }
  }
  return result;
}

export function calcMACD(data, short = 12, long = 26, signal = 9) {
  const closes = data.map(d => d.close);
  const emaShort = calcEMA(closes, short);
  const emaLong = calcEMA(closes, long);
  const dif = emaShort.map((v, i) => +(v - emaLong[i]).toFixed(4));
  const dea = calcEMA(dif, signal).map(v => +v.toFixed(4));
  const macd = dif.map((v, i) => +((v - dea[i]) * 2).toFixed(4));
  return { dif, dea, macd };
}

export function calcRSI(data, period = 14) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) { result.push(null); continue; }
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j].close - data[j - 1].close;
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    result.push(+(100 - 100 / (1 + rs)).toFixed(2));
  }
  return result;
}

export function calcKDJ(data, n = 9) {
  const kArr = [], dArr = [], jArr = [];
  let prevK = 50, prevD = 50;
  for (let i = 0; i < data.length; i++) {
    if (i < n - 1) { kArr.push(null); dArr.push(null); jArr.push(null); continue; }
    let highN = -Infinity, lowN = Infinity;
    for (let j = i - n + 1; j <= i; j++) {
      highN = Math.max(highN, data[j].high);
      lowN = Math.min(lowN, data[j].low);
    }
    const rsv = highN === lowN ? 50 : ((data[i].close - lowN) / (highN - lowN)) * 100;
    const k = (2 / 3) * prevK + (1 / 3) * rsv;
    const d = (2 / 3) * prevD + (1 / 3) * k;
    const j = 3 * k - 2 * d;
    kArr.push(+k.toFixed(2)); dArr.push(+d.toFixed(2)); jArr.push(+j.toFixed(2));
    prevK = k; prevD = d;
  }
  return { k: kArr, d: dArr, j: jArr };
}

export function calcBOLL(data, period = 20, multiplier = 2) {
  const upper = [], mid = [], lower = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { upper.push(null); mid.push(null); lower.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
    const ma = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += Math.pow(data[j].close - ma, 2);
    const std = Math.sqrt(variance / period);
    mid.push(+ma.toFixed(2));
    upper.push(+(ma + multiplier * std).toFixed(2));
    lower.push(+(ma - multiplier * std).toFixed(2));
  }
  return { upper, mid, lower };
}

function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function formatVolume(v) {
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿';
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万';
  return v.toString();
}

export function formatAmount(v) {
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿';
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万';
  return v?.toFixed(2) || '0';
}
