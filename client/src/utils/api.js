import axios from 'axios';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

export async function getQuote(symbol) {
  const { data } = await api.get(`/stock/quote/${symbol}`);
  return data.data;
}

export async function getKline(symbol, period = 'daily', count = 200) {
  const { data } = await api.get(`/stock/kline/${symbol}`, { params: { period, count } });
  return data.data;
}

export async function getHotStocks() {
  const { data } = await api.get('/stock/hot');
  return data.data;
}

export async function searchStock(keyword) {
  const { data } = await api.get('/stock/search', { params: { keyword } });
  return data.data;
}

export async function getMultiQuotes(symbols) {
  const { data } = await api.get('/stock/multi', { params: { symbols: symbols.join(',') } });
  return data.data;
}

export async function getIndices() {
  const { data } = await api.get('/stock/indices');
  return data.data;
}

export async function getNews(page = 1, count = 20) {
  const { data } = await api.get('/stock/news', { params: { page, count } });
  return data.data;
}

export async function getAnalysis(symbol) {
  const { data } = await api.get(`/stock/analyze/${symbol}`);
  return data.data;
}

export async function getSectors(type = 'industry') {
  const { data } = await api.get('/stock/sectors', { params: { type } });
  return data.data;
}

export async function getSectorDetail(code) {
  const { data } = await api.get(`/stock/sector/${code}`);
  return data.data;
}
