const FAVORITES_KEY = 'stock_favorites';

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addFavorite(stock) {
  const list = getFavorites();
  if (!list.find(s => s.symbol === stock.symbol)) {
    list.push({ symbol: stock.symbol, name: stock.name });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  }
  return list;
}

export function removeFavorite(symbol) {
  const list = getFavorites().filter(s => s.symbol !== symbol);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  return list;
}

export function isFavorite(symbol) {
  return getFavorites().some(s => s.symbol === symbol);
}
