import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import StockDetail from './pages/StockDetail.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import SectorPage from './pages/SectorPage.jsx';
import TopPicksPage from './pages/TopPicksPage.jsx';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/stock/:symbol" element={<StockDetail />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/sectors" element={<SectorPage />} />
          <Route path="/top-picks" element={<TopPicksPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
