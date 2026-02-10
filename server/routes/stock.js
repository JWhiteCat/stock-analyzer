const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');
const analysisService = require('../services/analysisService');

const HOT_SYMBOLS = [
  '600519', '000858', '601318', '600036',
  '000001', '600276', '300750', '601012',
  '000333', '002594', '600900', '601888',
];

function asyncHandler(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  };
}

router.get('/quote/:symbol', asyncHandler((req) =>
  stockService.getQuote(req.params.symbol)
));

router.get('/kline/:symbol', asyncHandler((req) => {
  const { period = 'daily', count = 200 } = req.query;
  return stockService.getKline(req.params.symbol, period, parseInt(count));
}));

router.get('/multi', asyncHandler((req) => {
  const symbols = (req.query.symbols || '').split(',').filter(Boolean);
  return stockService.getMultiQuotes(symbols);
}));

router.get('/search', asyncHandler((req) =>
  stockService.searchStock(req.query.keyword || '')
));

router.get('/hot', asyncHandler(() =>
  stockService.getMultiQuotes(HOT_SYMBOLS)
));

router.get('/indices', asyncHandler(() =>
  stockService.getIndices()
));

router.get('/news', asyncHandler((req) => {
  const { page = 1, count = 20 } = req.query;
  return stockService.getNews(parseInt(page), parseInt(count));
}));

router.get('/analyze/:symbol', asyncHandler(async (req) => {
  const { symbol } = req.params;
  const [quote, kline] = await Promise.all([
    stockService.getQuote(symbol),
    stockService.getKline(symbol, 'daily', 120),
  ]);
  return analysisService.analyzeStock(quote, kline);
}));

router.get('/sectors', asyncHandler((req) => {
  const { type = 'industry' } = req.query;
  return stockService.getSectors(type);
}));

router.get('/sector/:code', asyncHandler((req) =>
  stockService.getSectorDetail(req.params.code)
));

module.exports = router;
